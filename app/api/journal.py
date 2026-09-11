from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from app.core.database import get_db
from app.core.deps import get_current_student
from app.models.journal import JournalEntry
from app.models.mood import MoodLog
from app.models.user import Student
from app.services.llm import generate_journal_insights

router = APIRouter(prefix="/api/journal", tags=["journal"])


class JournalEntryRequest(BaseModel):
    id: Optional[int] = None              # If provided, update this specific entry; otherwise create new
    entry_date: Optional[str] = None      # 'YYYY-MM-DD', default today
    content: str
    mood: Optional[str] = None            # '5' (Thriving), '4' (Calm), '3' (Balanced), '2' (Stressed), '1' (Overwhelmed)
    mood_tag: Optional[str] = None        # 'academic' | 'relationships' | 'family' | 'finance' | 'health' | 'career'
    is_shared_with_counselor: bool = False


class JournalReflectRequest(BaseModel):
    content: str


# ── 1. Monthly Calendar Metadata ───────────────────────────────────────────────

@router.get("/calendar")
def get_monthly_calendar(
    month: Optional[str] = Query(None, description="Format: YYYY-MM (e.g., 2026-09)"),
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns calendar activity metadata for the given month.
    Indicates for each day whether journal entries and/or mood logs exist.
    """
    target_month = month or datetime.now().strftime("%Y-%m")
    
    # 1. Fetch journal entries for student in this month
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.student_id == student.id)
        .order_by(JournalEntry.created_at.asc())
        .all()
    )
    
    entry_map = {}
    for e in entries:
        d_str = e.entry_date or (e.created_at.strftime("%Y-%m-%d") if e.created_at else None)
        if d_str and d_str.startswith(target_month):
            if d_str not in entry_map:
                entry_map[d_str] = []
            entry_map[d_str].append(e)

    # 2. Fetch mood logs for student in this month
    mood_logs = (
        db.query(MoodLog)
        .filter(MoodLog.student_id == student.id)
        .all()
    )
    
    mood_map = {}
    for m in mood_logs:
        d_str = m.created_at.strftime("%Y-%m-%d") if m.created_at else None
        if d_str and d_str.startswith(target_month):
            mood_map[d_str] = m.score

    # 3. Aggregate all active dates in this month
    all_dates = set(entry_map.keys()) | set(mood_map.keys())
    
    days_data = []
    for d_str in sorted(all_dates):
        day_entries = entry_map.get(d_str, [])
        mood_score = mood_map.get(d_str)
        
        has_entry = len(day_entries) > 0
        latest_entry = day_entries[-1] if day_entries else None
        has_mood = mood_score is not None or any(e.mood is not None for e in day_entries)
        
        # Determine marker mood from latest entry or mood log
        active_mood = (latest_entry.mood if (latest_entry and latest_entry.mood) else None) or (str(mood_score) if mood_score else None)
        
        days_data.append({
            "date": d_str,
            "has_entry": has_entry,
            "entry_count": len(day_entries),
            "has_mood": has_mood,
            "mood": active_mood,
            "mood_tag": latest_entry.mood_tag if latest_entry else None,
            "is_shared": any(bool(e.is_shared_with_counselor) for e in day_entries),
            "word_count": sum(e.word_count or 0 for e in day_entries),
        })

    return {
        "month": target_month,
        "days": days_data,
        "total_month_entries": sum(len(el) for el in entry_map.values()),
    }


# ── 2. Get Diary Entry by Date ────────────────────────────────────────────────

@router.get("/date/{date_str}")
def get_entry_by_date(
    date_str: str,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Fetch all diary entries for a specific date (YYYY-MM-DD)."""
    entries = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.student_id == student.id,
            (JournalEntry.entry_date == date_str) | (func.date(JournalEntry.created_at) == date_str)
        )
        .order_by(JournalEntry.created_at.asc())
        .all()
    )

    # Check mood log for that date
    mood_score = None
    mood_log = (
        db.query(MoodLog)
        .filter(
            MoodLog.student_id == student.id,
            func.date(MoodLog.created_at) == date_str
        )
        .first()
    )
    if mood_log:
        mood_score = mood_log.score

    formatted_entries = [
        {
            "id": e.id,
            "entry_date": e.entry_date or date_str,
            "content": e.content,
            "mood": e.mood or (str(mood_score) if mood_score else None),
            "mood_tag": e.mood_tag,
            "is_shared_with_counselor": bool(e.is_shared_with_counselor),
            "word_count": e.word_count or len(e.content.split()),
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "updated_at": e.updated_at.isoformat() if e.updated_at else None,
        }
        for e in entries
    ]

    return {
        "date": date_str,
        "has_entry": len(entries) > 0,
        "count": len(entries),
        "entry": formatted_entries[0] if formatted_entries else None,
        "entries": formatted_entries,
        "associated_mood_score": mood_score,
    }


# ── 3. Upsert Diary Entry (Multiple Entries Allowed) ──────────────────────────

@router.post("")
@router.post("/entry")
def save_or_update_diary_entry(
    req: JournalEntryRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Saves a new diary entry or updates an existing one if req.id is provided.
    Students can have multiple diary entries on the same date.
    """
    target_date = req.entry_date or datetime.now().strftime("%Y-%m-%d")
    words = len(req.content.strip().split()) if req.content.strip() else 0

    entry = None
    if req.id:
        entry = (
            db.query(JournalEntry)
            .filter(
                JournalEntry.id == req.id,
                JournalEntry.student_id == student.id,
            )
            .first()
        )

    if entry:
        # Update existing diary entry
        entry.entry_date = target_date
        entry.content = req.content.strip()
        entry.mood = req.mood
        entry.mood_tag = req.mood_tag
        entry.is_shared_with_counselor = req.is_shared_with_counselor
        entry.word_count = words
        entry.updated_at = datetime.now()
    else:
        # Create new diary entry
        entry = JournalEntry(
            student_id=student.id,
            entry_date=target_date,
            content=req.content.strip(),
            mood=req.mood,
            mood_tag=req.mood_tag,
            is_shared_with_counselor=req.is_shared_with_counselor,
            word_count=words,
        )
        db.add(entry)

    # If numeric mood provided, optionally sync with MoodLog for today
    if req.mood and req.mood.isdigit():
        score_val = int(req.mood)
        if 1 <= score_val <= 5:
            existing_mood = (
                db.query(MoodLog)
                .filter(
                    MoodLog.student_id == student.id,
                    func.date(MoodLog.created_at) == target_date
                )
                .first()
            )
            if existing_mood:
                existing_mood.score = score_val
            else:
                db.add(MoodLog(student_id=student.id, score=score_val, note="Logged via Daily Diary"))

    db.commit()
    db.refresh(entry)

    return {
        "status": "success",
        "id": entry.id,
        "entry_date": entry.entry_date or target_date,
        "content": entry.content,
        "mood": entry.mood,
        "mood_tag": entry.mood_tag,
        "word_count": entry.word_count,
        "is_shared_with_counselor": bool(entry.is_shared_with_counselor),
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
    }


# ── 4. Delete Entry by Date or ID ─────────────────────────────────────────────

@router.delete("/date/{date_str}")
def delete_entry_by_date(
    date_str: str,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.student_id == student.id,
            (JournalEntry.entry_date == date_str) | (func.date(JournalEntry.created_at) == date_str)
        )
        .all()
    )
    if not entries:
        raise HTTPException(status_code=404, detail="No diary entries found for this date.")
    
    count = len(entries)
    for e in entries:
        db.delete(e)
    db.commit()
    return {"status": "success", "message": f"{count} diary page(s) for {date_str} deleted."}


@router.delete("/entry/{entry_id}")
def delete_entry(
    entry_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.student_id == student.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found or unauthorized")
    
    db.delete(entry)
    db.commit()
    return {"status": "success", "message": "Entry deleted"}


class JournalShareRequest(BaseModel):
    is_shared: bool = True


@router.patch("/{entry_id}/share")
def toggle_share_entry(
    entry_id: int,
    req: JournalShareRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Toggle sharing a diary entry with college counselor."""
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.student_id == student.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found.")
    entry.is_shared_with_counselor = req.is_shared
    db.commit()
    db.refresh(entry)
    return {
        "id": entry.id,
        "is_shared_with_counselor": bool(entry.is_shared_with_counselor),
        "message": "Sharing preference updated."
    }


# ── 5. Past Entries & Search ──────────────────────────────────────────────────

@router.get("")
@router.get("/entries")
def get_entries(
    q: Optional[str] = None,
    limit: int = 50,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns past diary entries with optional full-text search."""
    query = db.query(JournalEntry).filter(JournalEntry.student_id == student.id)
    
    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        query = query.filter(JournalEntry.content.ilike(search_pattern))

    entries = (
        query
        .order_by(JournalEntry.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": e.id,
            "entry_date": e.entry_date or (e.created_at.strftime("%Y-%m-%d") if e.created_at else None),
            "content": e.content,
            "mood": e.mood,
            "mood_tag": e.mood_tag,
            "word_count": e.word_count or len(e.content.split()),
            "is_shared_with_counselor": bool(e.is_shared_with_counselor),
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]


# ── 6. Diary Statistics ───────────────────────────────────────────────────────

@router.get("/stats")
def get_diary_stats(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Calculates journal entry counts, active streaks, and common mood states."""
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.student_id == student.id)
        .order_by(JournalEntry.created_at.desc())
        .all()
    )

    total_entries = len(entries)
    total_words = sum(e.word_count or len(e.content.split()) for e in entries)
    
    # Calculate streak from unique entry dates
    entry_dates = set()
    for e in entries:
        d_str = e.entry_date or (e.created_at.strftime("%Y-%m-%d") if e.created_at else None)
        if d_str:
            entry_dates.add(d_str)

    # Count consecutive days backwards from today
    streak = 0
    today_dt = date.today()
    check_dt = today_dt
    while check_dt.strftime("%Y-%m-%d") in entry_dates:
        streak += 1
        check_dt = check_dt.fromordinal(check_dt.toordinal() - 1)

    return {
        "total_entries": total_entries,
        "total_words": total_words,
        "streak_days": streak,
        "days_logged_this_month": len([d for d in entry_dates if d.startswith(today_dt.strftime("%Y-%m"))]),
    }


# ── 7. AI Psychological Reflection ────────────────────────────────────────────

@router.post("/reflect")
async def reflect_on_entry(
    req: JournalReflectRequest,
    student: Student = Depends(get_current_student),
):
    """Generates an on-demand empathetic AI reflection for a single diary entry."""
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Entry content is empty.")
    
    insights = await generate_journal_insights([req.content.strip()])
    return insights


@router.get("/insights")
async def get_journal_insights(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.student_id == student.id)
        .order_by(JournalEntry.created_at.desc())
        .limit(10)
        .all()
    )
    
    texts = [e.content for e in entries if e.content]
    insights = await generate_journal_insights(texts)
    return insights
