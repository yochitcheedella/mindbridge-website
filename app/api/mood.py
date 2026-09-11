from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_student
from app.models.mood import MoodLog
from app.models.user import Student

router = APIRouter(prefix="/api/mood", tags=["mood"])


class MoodLogRequest(BaseModel):
    score: int  # 1 = Very Low, 5 = Excellent
    note: Optional[str] = None


@router.post("/log")
def log_mood(
    req: MoodLogRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    if not 1 <= req.score <= 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5.")

    log = MoodLog(student_id=student.id, score=req.score, note=req.note)
    db.add(log)
    db.commit()
    db.refresh(log)
    return {
        "id": log.id,
        "score": log.score,
        "note": log.note,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


@router.get("/history")
def get_mood_history(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    logs = (
        db.query(MoodLog)
        .filter(MoodLog.student_id == student.id, MoodLog.created_at >= thirty_days_ago)
        .order_by(MoodLog.created_at.desc())
        .all()
    )
    return [
        {
            "id": l.id,
            "score": l.score,
            "note": l.note,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


@router.get("/today")
def get_today_mood(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    log = (
        db.query(MoodLog)
        .filter(MoodLog.student_id == student.id, MoodLog.created_at >= today_start)
        .order_by(MoodLog.created_at.desc())
        .first()
    )
    if not log:
        return {"score": None, "note": None}
    return {"score": log.score, "note": log.note, "created_at": log.created_at.isoformat()}
