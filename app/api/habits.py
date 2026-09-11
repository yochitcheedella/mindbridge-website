from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import Student
from app.models.habit import Habit

router = APIRouter(prefix="/api/habits", tags=["habits"])

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

class HabitDTO(BaseModel):
    id: str
    name: str
    emoji: str
    category: str
    streak: int
    completions: List[str]

@router.get("")
def get_habits(student: Student = Depends(_get_student), db: Session = Depends(get_db)):
    """Return all habits for the authenticated student."""
    habits = db.query(Habit).filter(Habit.student_id == student.id).all()
    result = []
    for h in habits:
        completions = h.completions
        
        # Calculate streak
        streak = 0
        from datetime import date, timedelta
        d = date.today()
        while True:
            key = d.isoformat()
            if key not in completions:
                break
            streak += 1
            d -= timedelta(days=1)
            
        result.append({
            "id": h.habit_id,
            "name": h.name,
            "emoji": h.emoji,
            "category": h.category,
            "streak": streak,
            "completions": completions
        })
    return result

@router.post("")
def sync_habits(habits_data: List[HabitDTO], student: Student = Depends(_get_student), db: Session = Depends(get_db)):
    """
    Sync habits from the frontend.
    For MVP, we overwrite the existing habits for this student.
    """
    # Delete existing habits for this student
    db.query(Habit).filter(Habit.student_id == student.id).delete()
    
    for dto in habits_data:
        h = Habit(
            student_id=student.id,
            habit_id=dto.id,
            name=dto.name,
            emoji=dto.emoji,
            category=dto.category
        )
        h.completions = dto.completions
        db.add(h)
        
    db.commit()
    
    # After syncing habits, trigger Risk Engine update to recalculate burnout probability
    from app.services.risk_engine import calculate_multi_factor_risk
    calculate_multi_factor_risk(db, student.id)
    
    return {"status": "success", "message": "Habits synced successfully."}
