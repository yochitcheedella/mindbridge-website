from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
import datetime

from app.models.base import Base

class AIFollowUpPlan(Base):
    __tablename__ = "ai_followup_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    rationale = Column(Text, nullable=False)
    status = Column(String, default="active") # active, completed, abandoned
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    tasks = relationship("AIFollowUpTask", back_populates="plan", cascade="all, delete-orphan")


class AIFollowUpTask(Base):
    __tablename__ = "ai_followup_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("ai_followup_plans.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    day_number = Column(Integer, nullable=False) # e.g., Day 1, Day 2
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    plan = relationship("AIFollowUpPlan", back_populates="tasks")
