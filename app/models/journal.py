from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from .base import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    entry_date = Column(String, index=True, nullable=True)  # ISO Date 'YYYY-MM-DD'
    content = Column(Text, nullable=False)
    mood = Column(String, nullable=True)                    # 'thriving' | 'calm' | 'balanced' | 'stressed' | 'overwhelmed' or 1-5
    mood_tag = Column(String, nullable=True)                # 'academic' | 'relationships' | 'family' | 'finance' | 'health' | 'career'
    is_shared_with_counselor = Column(Boolean, default=False, nullable=True)
    word_count = Column(Integer, default=0, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=True)
