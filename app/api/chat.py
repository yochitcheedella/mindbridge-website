from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio

from app.core.database import get_db
from app.core.deps import get_current_student
from app.core.security import decode_token
from app.core.alert_manager import alert_manager
from app.models.chat import ChatMessage
from app.models.user import Student
from app.models.appointment import Appointment
from app.models.psychologist import Psychologist
from app.models.alert import RiskAlert
from app.core.ai_service import analyze_message_with_history

router = APIRouter(prefix="/api/chat", tags=["chat"])

class CounselorMessageSendRequest(BaseModel):
    text: str
    appointment_id: Optional[int] = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, student_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[student_id] = websocket

    def disconnect(self, student_id: int):
        if student_id in self.active_connections:
            del self.active_connections[student_id]

    async def send_personal(self, message: str, student_id: int):
        if student_id in self.active_connections:
            await self.active_connections[student_id].send_text(message)

manager = ConnectionManager()


@router.get("/history")
def get_chat_history(
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Retrieve the user's past chat messages."""
    payload = None
    if authorization and authorization.startswith("Bearer "):
        payload = decode_token(authorization.split(" ", 1)[1])
    elif token:
        payload = decode_token(token)
        
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    student_id = int(payload["sub"])
    messages = db.query(ChatMessage).filter(ChatMessage.student_id == student_id).order_by(ChatMessage.timestamp.asc()).all()
    
    return [
        {
            "id": str(msg.id),
            "sender": msg.sender,
            "text": msg.text,
            "sentiment_score": msg.sentiment_score,
            "timestamp": msg.timestamp.isoformat()
        } for msg in messages
    ]


@router.get("/counselor/history")
def get_counselor_chat_history(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves the private 1-on-1 counseling conversation between student and psychologist.
    Excludes pure AI bot messages.
    Includes active appointment details and counselor profile.
    """
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.student_id == student.id, ChatMessage.sender.in_(["user", "counselor"]))
        .order_by(ChatMessage.timestamp.asc())
        .all()
    )

    # Find the student's assigned counselor from their latest active appointment
    latest_appt = (
        db.query(Appointment)
        .filter(Appointment.student_id == student.id)
        .order_by(Appointment.created_at.desc())
        .first()
    )

    counselor_info = {
        "name": "Dr. Ananya Sharma",
        "specialization": "Clinical Psychologist",
        "is_online": True,
        "appointment_id": latest_appt.id if latest_appt else None,
        "appointment_status": latest_appt.status if latest_appt else None,
    }

    if latest_appt and latest_appt.psychologist_id:
        psych = db.query(Psychologist).filter(Psychologist.id == latest_appt.psychologist_id).first()
        if psych:
            counselor_info["name"] = psych.name
            counselor_info["specialization"] = psych.specialization or "Clinical Psychologist"

    return {
        "student_alias": student.anonymous_token,
        "counselor": counselor_info,
        "messages": [
            {
                "id": str(msg.id),
                "sender": msg.sender,
                "text": msg.text,
                "risk_score": msg.sentiment_score,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
            }
            for msg in messages
        ],
    }


@router.post("/counselor/send")
async def send_message_to_counselor(
    req: CounselorMessageSendRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Student sends an anonymous message to the counselor.
    Analyzes message with MindBridge AI risk detection to assist the psychologist.
    Shields student real identity (only anonymous alias is visible).
    """
    text_clean = req.text.strip()
    if not text_clean:
        raise HTTPException(status_code=400, detail="Message text cannot be empty.")

    # 1. MindBridge AI Safety & Clinical Risk Analysis
    analysis = await analyze_message_with_history(text_clean)
    risk_score = analysis.risk_score
    risk_level = analysis.risk_classification

    # Map risk level for internal psychologist triage:
    if risk_level in ("critical", "red") or risk_score >= 0.7:
        clinical_concern = "high_concern"
    elif risk_level in ("orange", "yellow") or risk_score >= 0.35:
        clinical_concern = "elevated"
    else:
        clinical_concern = "low"

    # Update student's dynamic risk score
    student.risk_score = max(student.risk_score or 0.0, risk_score)

    # If critical concern, create clinician triage alert in RiskAlert
    if clinical_concern == "high_concern" or analysis.requires_alert:
        alert = RiskAlert(
            student_id=student.id,
            risk_level=risk_level,
            triggered_by="counselor_chat_message",
            status="active",
        )
        db.add(alert)

    # 2. Save chat message to database
    db_msg = ChatMessage(
        student_id=student.id,
        sender="user",
        text=text_clean,
        sentiment_score=risk_score,
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)

    return {
        "id": str(db_msg.id),
        "sender": "user",
        "text": db_msg.text,
        "risk_score": risk_score,
        "clinical_concern": clinical_concern,
        "timestamp": db_msg.timestamp.isoformat() if db_msg.timestamp else None,
    }


class AIChatMessageRequest(BaseModel):
    message: str
    language: Optional[str] = "en-IN"


@router.post("/message")
async def send_chat_message(
    req: AIChatMessageRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    HTTP REST endpoint for AI emotional support assistant.
    Provides synchronous fallback for environments where WebSockets are unavailable.
    """
    user_text = req.message.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Save user message
    user_msg = ChatMessage(student_id=student.id, sender="user", text=user_text)
    db.add(user_msg)
    db.commit()

    # Load recent conversation history
    db_history = (
        db.query(ChatMessage)
        .filter(ChatMessage.student_id == student.id)
        .order_by(ChatMessage.timestamp.desc())
        .limit(10)
        .all()
    )
    db_history.reverse()

    ai_history = [
        {"role": "user" if m.sender == "user" else "assistant", "content": m.text}
        for m in db_history
    ]

    analysis = await analyze_message_with_history(user_text, ai_history, req.language or "en-IN")
    ai_response = analysis.response_text
    risk_level = analysis.risk_classification
    risk_score = analysis.risk_score

    ai_msg = ChatMessage(
        student_id=student.id,
        sender="ai",
        text=ai_response,
        sentiment_score=risk_score
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return {
        "id": ai_msg.id,
        "sender": "ai",
        "response": ai_response,
        "reply": ai_response,
        "text": ai_response,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "disclaimer": "MindBridge AI Companion is an emotional support guide, not a licensed medical diagnosis."
    }


@router.websocket("/ws")
async def chat_endpoint(websocket: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    # Authenticate token
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=1008) # Policy Violation
        return

    student_id = int(payload["sub"])
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        await websocket.close(code=1008)
        return

    await manager.connect(student_id, websocket)
    try:
        # Load history for AI context (last 10 messages for memory, to avoid context bloat)
        db_history = db.query(ChatMessage).filter(ChatMessage.student_id == student_id).order_by(ChatMessage.timestamp.desc()).limit(10).all()
        db_history.reverse()
        
        ai_history = []
        for msg in db_history:
            role = "user" if msg.sender == "user" else "assistant"
            ai_history.append({"role": role, "content": msg.text})

        # Send greeting if history is empty
        if len(db_history) == 0:
            greeting_msg = ChatMessage(
                student_id=student_id,
                sender="ai",
                text="Hi there. I'm your MindBridge Guide. This is a safe, completely anonymous space. How are you feeling right now?",
                sentiment_score=0.0
            )
            db.add(greeting_msg)
            db.commit()
            db.refresh(greeting_msg)
            
            await manager.send_personal(
                json.dumps({
                    "id": str(greeting_msg.id),
                    "sender": "ai",
                    "text": greeting_msg.text,
                    "risk_level": "green",
                    "risk_score": 0.0,
                }),
                student_id,
            )
            ai_history.append({"role": "assistant", "content": greeting_msg.text})
        else:
            await manager.send_personal(
                json.dumps({
                    "id": f"ready-{student_id}",
                    "sender": "ai",
                    "text": "Welcome back to MindBridge Guide. I'm here to listen whenever you're ready.",
                    "risk_level": "green",
                    "risk_score": 0.0,
                    "is_resumed": True,
                }),
                student_id,
            )

        while True:
            raw_message = await websocket.receive_text()
            try:
                msg_data = json.loads(raw_message)
                user_message = msg_data.get("text", "")
                language = msg_data.get("language", "en-IN")
            except:
                user_message = raw_message
                language = "en-IN"

            # Save user message
            db_user_msg = ChatMessage(
                student_id=student_id,
                sender="user",
                text=user_message,
            )
            db.add(db_user_msg)
            db.commit()

            # Run AI analysis
            analysis = await analyze_message_with_history(user_message, history=ai_history, student_language=language)

            # Update ai_history for current session
            ai_history.append({"role": "user", "content": user_message})
            ai_history.append({"role": "assistant", "content": analysis.response_text})
            
            # Keep history manageable
            if len(ai_history) > 12:
                ai_history = ai_history[-12:]

            # Save AI response
            db_ai_msg = ChatMessage(
                student_id=student_id,
                sender="ai",
                text=analysis.response_text,
                sentiment_score=analysis.risk_score # re-using sentiment_score column for risk_score temporarily
            )
            db.add(db_ai_msg)
            
            # Update holistic risk score using the new engine
            from app.services.risk_engine import calculate_multi_factor_risk
            risk_data = calculate_multi_factor_risk(db, student_id)
            if risk_data:
                db.refresh(student) # Get updated burnout and risk

            if analysis.requires_alert:
                from app.models.alert import RiskAlert
                from app.services.notifications import send_push_notification
                
                # Ensure no active alert already exists to prevent spam
                existing_alert = db.query(RiskAlert).filter(RiskAlert.student_id == student_id, RiskAlert.status == "active").first()
                if not existing_alert:
                    new_alert = RiskAlert(
                        student_id=student_id,
                        risk_level="critical",
                        triggered_by="ai_chat",
                        status="active"
                    )
                    db.add(new_alert)
                    db.commit()
                    
                    mock_psychologist_fcm_token = "placeholder-psychologist-fcm-token"
                    send_push_notification(
                        title="AI RISK ALERT",
                        body=f"Critical risk detected in chat for student {student.anonymous_token}.",
                        fcm_token=mock_psychologist_fcm_token,
                        data={"alert_id": str(new_alert.id), "student_id": str(student.id)}
                    )

                    
                    # Real-time WebSocket broadcast to clinical staff
                    alert_manager.dispatch_alert({
                        "type": "CRITICAL_ALERT",
                        "student_id": student.anonymous_token,
                        "risk_reason": analysis.emotion_analysis[0] if analysis.emotion_analysis else "Critical Risk"
                    })

            db.commit()

            await manager.send_personal(
                json.dumps({
                    "id": str(db_ai_msg.id),
                    "sender": "ai",
                    "text": analysis.response_text,
                    "risk_level": analysis.risk_classification,
                    "risk_score": analysis.risk_score,
                    "sentiment_score": analysis.sentiment_score,
                    "detected_emotions": analysis.emotion_analysis,
                }),
                student_id,
            )

    except WebSocketDisconnect:
        manager.disconnect(student_id)
