from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
from datetime import date

from app.core.database import get_db
from app.models.user import Student
from app.models.chat import ChatMessage
from app.models.mood import MoodLog
from app.models.journal import JournalEntry
from app.models.clinical import CaseNote, FollowUp
from app.models.audit import AuditLog
from app.models.alert import RiskAlert
from app.models.appointment import Appointment
from app.api.chat import manager

router = APIRouter(prefix="/api/psychologist", tags=["psychologist"])

class ChatMessageRequest(BaseModel):
    text: str

class CaseNoteRequest(BaseModel):
    content: str

class FollowUpRequest(BaseModel):
    due_date: str   # ISO date string YYYY-MM-DD
    reason: Optional[str] = None


import urllib.parse

def _find_student_by_alias(db: Session, anonymous_id: str) -> Optional[Student]:
    """Find student by exact alias, decoded alias, or prefix match if fragment truncated."""
    if not anonymous_id:
        return None
    clean = urllib.parse.unquote(anonymous_id).strip()
    student = db.query(Student).filter(Student.anonymous_token == clean).first()
    if student:
        return student
    student = db.query(Student).filter(Student.anonymous_token == anonymous_id).first()
    if student:
        return student
    # If the alias had a '#' character that was stripped by URL fragment parsing, match prefix
    student = db.query(Student).filter(Student.anonymous_token.ilike(f"{clean}%")).first()
    return student


@router.get("/student/{anonymous_id}")
def get_student_case_details(anonymous_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the case summary, mood logs, shared journals, and chat history for a given anonymous student.
    Strictly excludes PII (real email, name, etc.).
    """
    student = _find_student_by_alias(db, anonymous_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Fetch recent mood logs
    mood_logs = (
        db.query(MoodLog)
        .filter(MoodLog.student_id == student.id)
        .order_by(MoodLog.created_at.desc())
        .limit(10)
        .all()
    )

    # Fetch shared journal entries
    shared_journals = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.student_id == student.id,
            JournalEntry.is_shared_with_counselor == True
        )
        .order_by(JournalEntry.created_at.desc())
        .limit(15)
        .all()
    )

    # Fetch recent chat history
    chat_history = (
        db.query(ChatMessage)
        .filter(ChatMessage.student_id == student.id)
        .order_by(ChatMessage.timestamp.desc())
        .limit(30)
        .all()
    )
    chat_history.reverse() # Chronological order

    # Fetch active appointment if any
    appt = db.query(Appointment).filter(Appointment.student_id == student.id).order_by(Appointment.created_at.desc()).first()

    # Determine MindBridge AI Clinical Concern Level
    r_score = student.risk_score or 0.0
    if r_score >= 0.7:
        clinical_concern_level = "high_concern"
    elif r_score >= 0.35:
        clinical_concern_level = "elevated"
    else:
        clinical_concern_level = "low"

    return {
        "student": {
            "anonymous_id": student.anonymous_token,
            "department": student.department,
            "year": student.year,
            "risk_score": student.risk_score,
            "clinical_concern_level": clinical_concern_level,
            "created_at": student.created_at.isoformat() if student.created_at else None,
        },
        "active_appointment_id": appt.id if appt else None,
        "mood_logs": [
            {
                "score": log.score,
                "note": log.note,
                "timestamp": log.created_at.isoformat() if log.created_at else None
            } for log in mood_logs
        ],
        "shared_journals": [
            {
                "id": j.id,
                "entry_date": j.entry_date or (j.created_at.strftime("%Y-%m-%d") if j.created_at else None),
                "content": j.content,
                "mood": j.mood,
                "mood_tag": j.mood_tag,
                "word_count": j.word_count,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            } for j in shared_journals
        ],
        "chat_history": [
            {
                "id": str(msg.id),
                "sender": msg.sender,
                "text": msg.text,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                "risk_score": msg.sentiment_score
            } for msg in chat_history
        ]
    }

@router.post("/student/{anonymous_id}/chat")
async def send_counselor_message(anonymous_id: str, req: ChatMessageRequest, db: Session = Depends(get_db)):
    """
    Sends an anonymous message from the psychologist to the student.
    """
    student = _find_student_by_alias(db, anonymous_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Save to database
    counselor_msg = ChatMessage(
        student_id=student.id,
        sender="counselor",
        text=req.text
    )
    db.add(counselor_msg)
    db.commit()
    db.refresh(counselor_msg)

    # Push to WebSocket if student is connected
    payload = json.dumps({
        "id": str(counselor_msg.id),
        "sender": "counselor",
        "text": counselor_msg.text,
        "risk_level": "none",
        "risk_score": None,
        "timestamp": counselor_msg.timestamp.isoformat() if counselor_msg.timestamp else None,
    })
    
    await manager.send_personal(payload, student.id)
    
    # Push Notification to Student Device
    from app.services.notifications import send_push_notification
    # Note: Retrieving the student's registered FCM token from the database
    if student.fcm_token:
        send_push_notification(
            title="MindBridge Clinical Team",
            body="You have a new message from a counselor.",
            fcm_token=student.fcm_token,
            data={"type": "counselor_message", "student_id": str(student.id)}
        )

    return {"status": "success", "message_id": counselor_msg.id}

@router.post("/student/{anonymous_id}/resolve")
def resolve_student_case(anonymous_id: str, db: Session = Depends(get_db)):
    """Resolves the case by resetting the student's risk score to a baseline (0.0) and resolving active SOS/risk alerts."""
    student = _find_student_by_alias(db, anonymous_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.risk_score = 0.0
    active_alerts = db.query(RiskAlert).filter(RiskAlert.student_id == student.id, RiskAlert.status == "active").all()
    for alert in active_alerts:
        alert.status = "resolved"
    db.commit()
    return {"status": "success", "message": "Case and related alerts resolved"}


# ── Case Notes ─────────────────────────────────────────────────────────────────

@router.get("/student/{anonymous_id}/notes")
def get_case_notes(anonymous_id: str, db: Session = Depends(get_db)):
    """Return all private case notes for this anonymous student."""
    notes = (
        db.query(CaseNote)
        .filter(CaseNote.student_anonymous_id == anonymous_id)
        .order_by(CaseNote.created_at.desc())
        .all()
    )
    return [
        {"id": n.id, "content": n.content, "created_at": n.created_at.isoformat()}
        for n in notes
    ]


@router.post("/student/{anonymous_id}/notes")
def add_case_note(anonymous_id: str, req: CaseNoteRequest, db: Session = Depends(get_db)):
    """Add a new private case note for this anonymous student."""
    note = CaseNote(student_anonymous_id=anonymous_id, content=req.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"id": note.id, "content": note.content, "created_at": note.created_at.isoformat()}


# ── Follow-ups ─────────────────────────────────────────────────────────────────

@router.get("/student/{anonymous_id}/followup")
def get_followup(anonymous_id: str, db: Session = Depends(get_db)):
    """Return all follow-up reminders for this student."""
    rows = (
        db.query(FollowUp)
        .filter(FollowUp.student_anonymous_id == anonymous_id)
        .order_by(FollowUp.due_date)
        .all()
    )
    return [
        {
            "id": r.id,
            "due_date": str(r.due_date),
            "reason": r.reason,
            "completed": bool(r.completed),
        }
        for r in rows
    ]


@router.post("/student/{anonymous_id}/followup")
def set_followup(anonymous_id: str, req: FollowUpRequest, db: Session = Depends(get_db)):
    """Schedule a follow-up reminder for this anonymous student."""
    try:
        parsed = date.fromisoformat(req.due_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="due_date must be YYYY-MM-DD.")
    row = FollowUp(student_anonymous_id=anonymous_id, due_date=parsed, reason=req.reason)
    db.add(row)
    db.commit()
    db.refresh(row)
    
    # Push Notification to Student Device
    from app.services.notifications import send_push_notification
    student = _find_student_by_alias(db, anonymous_id)
    if student and student.fcm_token:
        send_push_notification(
            title="MindBridge - Follow Up Scheduled",
            body=f"A counselor has scheduled a check-in for {parsed.strftime('%B %d, %Y')}.",
            fcm_token=student.fcm_token,
            data={"type": "follow_up", "student_id": str(student.id)}
        )

    return {"id": row.id, "due_date": str(row.due_date), "reason": row.reason, "completed": False}


@router.post("/student/{anonymous_id}/followup/{followup_id}/complete")
def complete_followup(anonymous_id: str, followup_id: int, db: Session = Depends(get_db)):
    """Mark a follow-up as completed."""
    row = db.query(FollowUp).filter(FollowUp.id == followup_id, FollowUp.student_anonymous_id == anonymous_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Follow-up not found.")
    row.completed = 1
    db.commit()
    return {"status": "completed"}


class IdentityRequestPayload(BaseModel):
    reason: str


@router.post("/student/{anonymous_id}/request-identity")
def request_student_identity(anonymous_id: str, req: IdentityRequestPayload, db: Session = Depends(get_db)):
    """Request the real identity of a student in a life-threatening emergency."""
    student = _find_student_by_alias(db, anonymous_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Note: Anonymity reveal is strictly monitored. Whether acute crisis or clinical emergency override, an immutable audit log is committed.
    from app.core.security import decrypt_data
    
    real_name = decrypt_data(student.encrypted_name) if student.encrypted_name else "Unknown"
    real_email = decrypt_data(student.encrypted_email) if student.encrypted_email else "Unknown"
    real_phone = decrypt_data(student.encrypted_phone) if student.encrypted_phone else "Unknown"
    
    # Permanently log this sensitive action to the database AuditLog table as required by SRS section 16
    audit_record = AuditLog(
        action="CLINICAL_IDENTITY_REVEAL",
        target_student_id=student.id,
        requested_by="Psychologist",
        reason=req.reason
    )
    db.add(audit_record)
    db.commit()
    print(f"CRITICAL AUDIT: Psychologist requested identity for alias {anonymous_id}. Reason: {req.reason}. Recorded to DB AuditLog id={audit_record.id}")
    
    return {
        "status": "approved",
        "real_name": real_name,
        "real_email": real_email,
        "real_phone": real_phone
    }

