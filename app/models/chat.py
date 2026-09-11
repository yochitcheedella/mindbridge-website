from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from .base import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    sender = Column(String) # 'user' or 'ai'
    text = Column(String)
    sentiment_score = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
