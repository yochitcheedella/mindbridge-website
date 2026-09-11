from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_student
from app.models.community import CommunityPost, CommunityReply
from app.models.user import Student

router = APIRouter(prefix="/api/community", tags=["community"])


class PostRequest(BaseModel):
    title: str
    content: str


class ReplyRequest(BaseModel):
    content: str


@router.get("/posts")
def get_recent_posts(db: Session = Depends(get_db)):
    """Fetch recent community posts."""
    posts = (
        db.query(CommunityPost)
        .order_by(CommunityPost.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": p.id,
            "title": p.title,
            "content": p.content,
            "upvotes": p.upvotes,
            "reply_count": len(p.replies),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in posts
    ]


@router.post("/posts")
def create_post(
    req: PostRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Create a new anonymous community post."""
    post = CommunityPost(
        student_id=student.id,
        title=req.title,
        content=req.content,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "upvotes": post.upvotes,
        "created_at": post.created_at.isoformat() if post.created_at else None,
    }


@router.get("/posts/{post_id}")
def get_post_details(post_id: int, db: Session = Depends(get_db)):
    """Fetch a specific post and its replies."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "upvotes": post.upvotes,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "replies": [
            {
                "id": r.id,
                "content": r.content,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in post.replies
        ]
    }


@router.post("/posts/{post_id}/replies")
def add_reply(
    post_id: int,
    req: ReplyRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Add a reply to a post."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    reply = CommunityReply(
        post_id=post.id,
        student_id=student.id,
        content=req.content,
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    
    return {
        "id": reply.id,
        "content": reply.content,
        "created_at": reply.created_at.isoformat() if reply.created_at else None,
    }


@router.post("/posts/{post_id}/upvote")
def upvote_post(
    post_id: int,
    db: Session = Depends(get_db),
):
    """Increment the upvote counter for a post."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.upvotes += 1
    db.commit()
    return {"status": "success", "upvotes": post.upvotes}


@router.post("/posts/{post_id}/report")
def report_post(
    post_id: int,
    db: Session = Depends(get_db),
):
    """Flag a post for abuse or inappropriate content."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.is_flagged = True
    db.commit()
    return {"status": "success", "message": "Post has been reported."}
