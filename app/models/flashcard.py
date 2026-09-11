from sqlalchemy import Column, Integer, String, Text, DateTime, Date
from sqlalchemy.sql import func
from .base import Base

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    front_content = Column(Text, nullable=False)
    back_content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    source = Column(String(20), nullable=False, default="AI")  # 'AI' | 'COUNSELLOR'
    created_by = Column(String(100), nullable=True)
    author_name = Column(String(100), nullable=True)
    institution = Column(String(100), default="Vishnu Wellness Centre")
    status = Column(String(30), default="PENDING_REVIEW")  # 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED'
    scheduled_date = Column(String(20), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    priority = Column(Integer, default=0)  # 10 for Counsellor, 0 for AI
    visibility = Column(String(50), default="ALL")  # 'ALL' | 'STUDENTS' | 'GROUP'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
