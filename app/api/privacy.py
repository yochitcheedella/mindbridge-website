from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_student
from app.models.user import Student
from app.models.mood import MoodLog
from app.models.sleep import SleepLog
from app.models.journal import JournalEntry
from app.models.chat import ChatMessage
from app.models.appointment import Appointment

router = APIRouter(prefix="/api/privacy", tags=["privacy"])

@router.get("/export")
def export_data(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    """Export all personal data for the authenticated student."""
    moods = db.query(MoodLog).filter(MoodLog.student_id == student.id).all()
    sleeps = db.query(SleepLog).filter(SleepLog.student_id == student.id).all()
    journals = db.query(JournalEntry).filter(JournalEntry.student_id == student.id).all()
    chats = db.query(ChatMessage).filter(ChatMessage.student_id == student.id).all()
    appointments = db.query(Appointment).filter(Appointment.student_id == student.id).all()
    
    export_payload = {
        "profile": {
            "id": student.id,
            "anonymous_token": student.anonymous_token,
            "department": student.department,
            "year": student.year,
            "risk_score": student.risk_score,
            "joined_at": student.created_at.isoformat() if student.created_at else None
        },
        "mood_logs": [{"score": m.score, "date": m.created_at.isoformat() if m.created_at else None} for m in moods],
        "sleep_logs": [{"hours": s.hours, "quality": s.quality, "date": s.created_at.isoformat() if s.created_at else None} for s in sleeps],
        "journals": [{"content": j.content, "mood": j.mood, "mood_tag": j.mood_tag, "date": j.created_at.isoformat() if j.created_at else None} for j in journals],
        "chat_history": [{"sender": c.sender, "text": c.text, "date": c.timestamp.isoformat() if c.timestamp else None} for c in chats],
        "appointments": [{"status": a.status, "date": a.slot_time.isoformat() if a.slot_time else None} for a in appointments]
    }
    
    return export_payload

from app.models.habit import Habit
from app.models.alert import RiskAlert
from app.models.clinical import CaseNote, FollowUp, ClinicalAssessment, SOAPRecord
from app.models.plan import AIFollowUpPlan, AIFollowUpTask

@router.delete("/account")
def delete_account(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    """Hard delete the user account and all associated personal data."""
    if student:
        sid = student.id
        alias = student.anonymous_token

        db.query(MoodLog).filter(MoodLog.student_id == sid).delete()
        db.query(SleepLog).filter(SleepLog.student_id == sid).delete()
        db.query(JournalEntry).filter(JournalEntry.student_id == sid).delete()
        db.query(ChatMessage).filter(ChatMessage.student_id == sid).delete()
        db.query(Appointment).filter(Appointment.student_id == sid).delete()
        db.query(Habit).filter(Habit.student_id == sid).delete()
        db.query(RiskAlert).filter(RiskAlert.student_id == sid).delete()
        db.query(ClinicalAssessment).filter(ClinicalAssessment.student_id == sid).delete()

        if alias:
            db.query(CaseNote).filter(CaseNote.student_anonymous_id == alias).delete()
            db.query(FollowUp).filter(FollowUp.student_anonymous_id == alias).delete()
            db.query(SOAPRecord).filter(SOAPRecord.student_alias == alias).delete()

        # Delete AI Followup Tasks then Plans
        plans = db.query(AIFollowUpPlan).filter(AIFollowUpPlan.student_id == sid).all()
        for p in plans:
            db.query(AIFollowUpTask).filter(AIFollowUpTask.plan_id == p.id).delete()
        db.query(AIFollowUpPlan).filter(AIFollowUpPlan.student_id == sid).delete()

        db.delete(student)
        db.commit()
    return {"status": "success", "message": "Account permanently deleted."}
