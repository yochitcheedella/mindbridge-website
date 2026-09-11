from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import Student
from app.models.sleep import SleepLog

router = APIRouter(prefix="/api/sleep", tags=["sleep"])

QUALITY_OPTIONS = {"poor", "fair", "good", "excellent"}


def _get_student(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Student:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = decode_token(authorization.split(" ", 1)[1])
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token.")
    student = db.query(Student).filter(Student.id == int(payload["sub"])).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student


class SleepLogRequest(BaseModel):
    hours: float
    quality: str
    note: Optional[str] = None


@router.post("")
@router.post("/log")
def log_sleep(req: SleepLogRequest, student: Student = Depends(_get_student), db: Session = Depends(get_db)):
    """Log tonight's sleep — hours (0–12) and quality rating."""
    if req.hours < 0 or req.hours > 12:
        raise HTTPException(status_code=422, detail="Hours must be between 0 and 12.")
    quality_lower = req.quality.strip().lower()
    if quality_lower not in QUALITY_OPTIONS:
        raise HTTPException(status_code=422, detail=f"Quality must be one of: {', '.join(QUALITY_OPTIONS)}.")

    entry = SleepLog(
        student_id=student.id,
        hours=req.hours,
        quality=quality_lower,
        note=req.note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {
        "id": entry.id,
        "hours": entry.hours,
        "quality": entry.quality,
        "note": entry.note,
        "created_at": entry.created_at.isoformat(),
    }


@router.get("")
@router.get("/history")
def get_sleep_history(student: Student = Depends(_get_student), db: Session = Depends(get_db)):
    """Return the student's last 30 sleep log entries, newest first."""
    logs = (
        db.query(SleepLog)
        .filter(SleepLog.student_id == student.id)
        .order_by(SleepLog.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": l.id,
            "hours": l.hours,
            "quality": l.quality,
            "note": l.note,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]


@router.get("/today")
def get_today_sleep(student: Student = Depends(_get_student), db: Session = Depends(get_db)):
    """Return today's sleep log if it exists."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    log = (
        db.query(SleepLog)
        .filter(SleepLog.student_id == student.id, SleepLog.created_at >= today_start)
        .first()
    )
    if not log:
        return {}
    return {"hours": log.hours, "quality": log.quality}
