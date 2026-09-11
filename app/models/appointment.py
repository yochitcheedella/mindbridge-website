from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from .base import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    psychologist_id = Column(Integer, ForeignKey("psychologists.id"), nullable=True)
    slot_time = Column(DateTime(timezone=True))
    session_type = Column(String, default="video")  # video, audio, chat, in_person
    duration = Column(Integer, default=45)          # 30, 45, 60 minutes
    concern = Column(String, nullable=True)         # Academic pressure, Anxiety, Confidence, Loneliness, Career, etc.
    status = Column(String, default="pending")      # pending, confirmed, cancelled, completed
    notes = Column(Text, nullable=True)             # "Tell them before you talk" pre-session note
    feedback_rating = Column(Integer, nullable=True)
    feedback_tags = Column(String, nullable=True)
    feedback_comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
