from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import asyncio

from app.core.database import get_db
from app.core.alert_manager import alert_manager
from app.models.user import Student
from app.models.alert import RiskAlert
from app.models.journal import JournalEntry
from app.models.mood import MoodLog
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/risk", tags=["risk"])


class RiskEvaluationRequest(BaseModel):
    student_id: Optional[int] = None
    user_message: Optional[str] = None
    chat_history: Optional[List[dict]] = None
    self_assessment_score: Optional[float] = None


@router.post("/evaluate")
def evaluate_risk(req: RiskEvaluationRequest, db: Session = Depends(get_db)):
    """
    Multi-Signal Risk Engine (0-100 score).
    Synthesizes message content, conversation history, self-assessment,
    and historical mood trajectories into an institutional risk classification.
    """
    signals = {
        "chat_score": 10.0,
        "mood_trajectory_score": 20.0,
        "burnout_score": 15.0,
        "assessment_score": 10.0,
    }
    
    # 1. Message Safety / Sentiment Signal
    msg_text = (req.user_message or "").lower()
    critical_markers = ["kill myself", "suicide", "end my life", "want to die", "hanging", "overdose"]
    high_markers = ["hopeless", "can't go on", "no point in living", "self harm", "cutting", "panic attack"]
    moderate_markers = ["overwhelmed", "failing", "severe anxiety", "cannot sleep", "breaking down", "depressed"]
    
    if any(m in msg_text for m in critical_markers):
        signals["chat_score"] = 95.0
    elif any(m in msg_text for m in high_markers):
        signals["chat_score"] = 75.0
    elif any(m in msg_text for m in moderate_markers):
        signals["chat_score"] = 50.0

    # 2. Historical Mood Trajectory Signal
    student = None
    if req.student_id:
        student = db.query(Student).filter(Student.id == req.student_id).first()
        if student:
            recent_moods = db.query(MoodLog).filter(MoodLog.student_id == student.id).order_by(MoodLog.created_at.desc()).limit(7).all()
            if recent_moods:
                avg_mood = sum(m.score for m in recent_moods) / len(recent_moods)
                # Map 1-5 mood to 0-100 risk (1 mood -> 90 risk, 5 mood -> 10 risk)
                signals["mood_trajectory_score"] = max(5.0, (5 - avg_mood) * 22.5)
            
            signals["burnout_score"] = float(student.burnout_probability or 0.0) * 100.0

    # 3. Self-Assessment Signal
    if req.self_assessment_score is not None:
        signals["assessment_score"] = float(req.self_assessment_score)

    # 4. Multi-Signal Fusion
    composite_score = round(
        0.35 * signals["chat_score"] +
        0.25 * signals["mood_trajectory_score"] +
        0.20 * signals["burnout_score"] +
        0.20 * signals["assessment_score"],
        2
    )

    # Critical override if explicit self-harm detected
    if signals["chat_score"] >= 90.0:
        composite_score = max(composite_score, 85.0)

    # Categorization: 0-19 LOW, 20-39 MILD, 40-59 MODERATE, 60-79 HIGH, 80-100 CRITICAL
    if composite_score >= 80.0:
        tier = "CRITICAL"
        requires_review = True
        requires_identity_access = False # Only with explicit clinical escalation
        confidence = 0.94
    elif composite_score >= 60.0:
        tier = "HIGH"
        requires_review = True
        requires_identity_access = False
        confidence = 0.88
    elif composite_score >= 40.0:
        tier = "MODERATE"
        requires_review = False
        requires_identity_access = False
        confidence = 0.82
    elif composite_score >= 20.0:
        tier = "MILD"
        requires_review = False
        requires_identity_access = False
        confidence = 0.90
    else:
        tier = "LOW"
        requires_review = False
        requires_identity_access = False
        confidence = 0.95

    # Update student risk_score if student known
    if student:
        student.risk_score = round(composite_score / 100.0, 3)
        db.commit()

    return {
        "risk_score": composite_score,
        "risk_level": tier,
        "confidence": confidence,
        "requires_review": requires_review,
        "requires_identity_access": requires_identity_access,
        "signals": signals,
    }


@router.get("/queue")
def get_risk_queue(db: Session = Depends(get_db)):
    """
    Returns anonymous students sorted by risk score (highest first).
    Psychologist dashboard consumes this. No real identity is returned.
    """
    students = (
        db.query(Student)
        .filter(Student.risk_score >= 0.0)
        .order_by(Student.risk_score.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "anonymous_id": s.anonymous_token,
            "risk_score": round(s.risk_score, 3),
            "department": s.department,
            "year": s.year,
        }
        for s in students
    ]


@router.get("/alerts")
def get_active_alerts(db: Session = Depends(get_db)):
    """Returns the count and list of active risk alerts enriched with student alias and risk score."""
    alerts = db.query(RiskAlert).filter(RiskAlert.status == "active").all()
    enriched = []
    for a in alerts:
        student = db.query(Student).filter(Student.id == a.student_id).first()
        enriched.append({
            "id": a.id,
            "risk_level": a.risk_level,
            "triggered_by": a.triggered_by,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "student_alias": student.anonymous_token if student else "Unknown",
            "risk_score": round(student.risk_score, 3) if student else 0.0,
            "department": student.department if student else "Unknown",
            "year": student.year if student else 0,
        })
    return {
        "count": len(enriched),
        "alerts": enriched,
    }


@router.post("/alerts/{alert_id}/resolve")
def resolve_risk_alert(alert_id: int, db: Session = Depends(get_db)):
    """Resolves a specific risk alert."""
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.status = "resolved"
    db.commit()
    return {"status": "success", "message": "Alert resolved."}


@router.websocket("/ws/alerts")
async def alerts_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time clinician alerts.
    In a real app, you would authenticate the clinician here.
    """
    await alert_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for incoming messages if any
            # The client doesn't need to send anything, but we must handle disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)


@router.get("/analytics")
def get_campus_analytics(db: Session = Depends(get_db)):
    """
    Anonymous campus-wide wellbeing analytics for the admin dashboard.
    No individual student data is returned.
    """
    total_students = db.query(func.count(Student.id)).scalar() or 0
    avg_risk = db.query(func.avg(Student.risk_score)).scalar() or 0.0
    high_risk_count = db.query(func.count(Student.id)).filter(Student.risk_score >= 0.7).scalar() or 0
    medium_risk_count = db.query(func.count(Student.id)).filter(
        Student.risk_score >= 0.4, Student.risk_score < 0.7
    ).scalar() or 0

    avg_mood_raw = db.query(func.avg(MoodLog.score)).scalar()
    avg_mood = round(float(avg_mood_raw), 2) if avg_mood_raw else 3.2

    avg_burnout = db.query(func.avg(Student.burnout_probability)).scalar() or 0.0

    # Department Data (stress = avg risk score * 100)
    dept_stats = (
        db.query(Student.department, func.avg(Student.risk_score).label("avg_risk"))
        .filter(Student.department != None)
        .group_by(Student.department)
        .all()
    )
    
    department_data = [
        {"name": d.department, "stress": round(float(d.avg_risk) * 100)}
        for d in dept_stats
    ]
    # Sort descending by stress
    department_data.sort(key=lambda x: x["stress"], reverse=True)

    return {
        "total_students": total_students,
        "average_risk_score": round(float(avg_risk), 3),
        "high_risk_count": high_risk_count,
        "medium_risk_count": medium_risk_count,
        "average_mood_score": avg_mood,
        "average_burnout_probability": round(float(avg_burnout), 3),
        "campus_wellbeing_percent": max(0, round((1 - float(avg_risk)) * 100)),
        "department_data": department_data,
    }
