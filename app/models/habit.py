import json
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from .base import Base

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    habit_id = Column(String, index=True)  # client-side ID like "sleep7" or "custom_123"
    name = Column(String)
    emoji = Column(String)
    category = Column(String)
    _completions = Column("completions", Text, default="[]")  # JSON string of ISO dates
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def completions(self):
        try:
            return json.loads(self._completions) if self._completions else []
        except:
            return []

    @completions.setter
    def completions(self, value):
        self._completions = json.dumps(value)
