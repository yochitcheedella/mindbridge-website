from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict

from app.core.database import get_db
from app.core.deps import get_current_student
from app.models.user import Student
from app.models.appointment import Appointment
from app.models.psychologist import Psychologist
from datetime import datetime, timezone

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# Fallback alerts for demonstration
MOCK_NOTIFICATIONS = [
    {"id": 1, "title": "AI Check-in Available", "message": "Your AI Guide is ready for your daily check-in.", "is_read": False, "type": "info"},
    {"id": 3, "title": "Wellness Goal", "message": "Don't forget to complete your 5-minute meditation.", "is_read": True, "type": "warning"},
]

@router.get("/")
def get_notifications(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Fetch recent notifications and upcoming appointment reminders for the student."""
    notifications = list(MOCK_NOTIFICATIONS)

    # Fetch confirmed appointments for this student
    appts = (
        db.query(Appointment)
        .filter(Appointment.student_id == student.id, Appointment.status == "confirmed")
        .order_by(Appointment.slot_time.asc())
        .all()
    )

    for a in appts:
        psych = db.query(Psychologist).filter(Psychologist.id == a.psychologist_id).first()
        psych_name = psych.name if psych else "Clinical Counselor"
        time_str = a.slot_time.strftime("%b %d at %I:%M %p") if a.slot_time else "scheduled time"
        notifications.insert(0, {
            "id": 1000 + a.id,
            "title": f"Counseling Session with {psych_name}",
            "message": f"Confirmed for {time_str}. Your identity is protected as '{student.anonymous_token}'.",
            "is_read": False,
            "type": "success",
            "appointment_id": a.id,
        })

    return notifications

@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read."""
    for n in MOCK_NOTIFICATIONS:
        if n["id"] == notification_id:
            n["is_read"] = True
            return {"status": "success"}
    raise HTTPException(status_code=404, detail="Notification not found")
