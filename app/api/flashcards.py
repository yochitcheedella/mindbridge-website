from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from app.core.database import get_db
from app.models.flashcard import Flashcard

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


class CreateFlashcardRequest(BaseModel):
    title: str
    front_content: str
    back_content: str
    category: str
    visibility: Optional[str] = "ALL"
    scheduled_date: Optional[str] = None
    as_draft: Optional[bool] = False
    author_name: Optional[str] = "Counsellor"
    created_by: Optional[str] = None


class ReviewFlashcardRequest(BaseModel):
    status: str  # 'APPROVED', 'PUBLISHED', 'REJECTED', 'DRAFT'
    scheduled_date: Optional[str] = None


@router.get("/today")
def get_today_flashcards(db: Session = Depends(get_db)):
    """
    Returns exactly 5 cards for today:
    1. Priority given to Counsellor published cards (priority 10).
    2. Remaining slots filled with AI published cards (priority 0-5).
    """
    today_str = date.today().isoformat()

    # Fetch eligible published cards
    counsellor_cards = (
        db.query(Flashcard)
        .filter(Flashcard.status == "PUBLISHED", Flashcard.source == "COUNSELLOR")
        .order_by(desc(Flashcard.priority), desc(Flashcard.id))
        .all()
    )

    ai_cards = (
        db.query(Flashcard)
        .filter(Flashcard.status == "PUBLISHED", Flashcard.source == "AI")
        .order_by(desc(Flashcard.priority), desc(Flashcard.id))
        .all()
    )

    selected = []
    # Add counsellor cards first (up to 5)
    for c in counsellor_cards:
        if len(selected) < 5:
            selected.append(c)

    # Fill remainder with AI cards
    for a in ai_cards:
        if len(selected) >= 5:
            break
        if not any(s.id == a.id for s in selected):
            selected.append(a)

    return [
        {
            "id": card.id,
            "title": card.title,
            "front_content": card.front_content,
            "back_content": card.back_content,
            "category": card.category,
            "source": card.source,
            "author_name": card.author_name,
            "institution": card.institution,
            "status": card.status,
            "scheduled_date": card.scheduled_date or today_str,
            "priority": card.priority,
            "visibility": card.visibility,
        }
        for card in selected
    ]


@router.post("")
def create_flashcard(req: CreateFlashcardRequest, db: Session = Depends(get_db)):
    status = "DRAFT" if req.as_draft else "PENDING_REVIEW"
    card = Flashcard(
        title=req.title,
        front_content=req.front_content,
        back_content=req.back_content,
        category=req.category,
        source="COUNSELLOR",
        created_by=req.created_by,
        author_name=req.author_name,
        institution="Vishnu Wellness Centre",
        status=status,
        scheduled_date=req.scheduled_date or date.today().isoformat(),
        priority=10,
        visibility=req.visibility or "ALL",
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return {"status": "success", "flashcard_id": card.id, "card_status": card.status}


@router.get("/all")
def get_all_flashcards(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Flashcard)
    if status:
        query = query.filter(Flashcard.status == status)
    cards = query.order_by(desc(Flashcard.id)).all()

    # Counts
    ai_count = db.query(Flashcard).filter(Flashcard.source == "AI").count()
    counsellor_drafts = db.query(Flashcard).filter(Flashcard.source == "COUNSELLOR", Flashcard.status == "DRAFT").count()
    pending_review = db.query(Flashcard).filter(Flashcard.status == "PENDING_REVIEW").count()
    published = db.query(Flashcard).filter(Flashcard.status == "PUBLISHED").count()

    return {
        "metrics": {
            "ai_generated": ai_count,
            "counsellor_drafts": counsellor_drafts,
            "pending_review": pending_review,
            "published": published,
        },
        "flashcards": [
            {
                "id": c.id,
                "title": c.title,
                "front_content": c.front_content,
                "back_content": c.back_content,
                "category": c.category,
                "source": c.source,
                "author_name": c.author_name,
                "status": c.status,
                "scheduled_date": c.scheduled_date,
                "priority": c.priority,
            }
            for c in cards
        ],
    }


@router.put("/{card_id}/review")
def review_flashcard(card_id: int, req: ReviewFlashcardRequest, db: Session = Depends(get_db)):
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    card.status = req.status
    if req.scheduled_date:
        card.scheduled_date = req.scheduled_date
    if req.status == "PUBLISHED":
        card.published_at = datetime.utcnow()

    db.commit()
    return {"status": "success", "flashcard_id": card.id, "new_status": card.status}
