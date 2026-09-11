from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from .base import Base

class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    risk_level = Column(String) # 'warning', 'critical'
    triggered_by = Column(String)
    status = Column(String, default="active") # 'active', 'resolved'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
