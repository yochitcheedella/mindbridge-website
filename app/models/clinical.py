from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from .base import Base


class CaseNote(Base):
    """Private psychologist notes per anonymous student. Never exposed to the student."""
    __tablename__ = "case_notes"

    id = Column(Integer, primary_key=True, index=True)
    student_anonymous_id = Column(String(200), index=True)   # anonymous_token
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class FollowUp(Base):
    """Scheduled follow-up reminders set by psychologists for anonymous students."""
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    student_anonymous_id = Column(String(200), index=True)
    due_date = Column(Date)
    reason = Column(String(300), nullable=True)
    completed = Column(Integer, default=0)   # 0=pending, 1=done
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClinicalAssessment(Base):
    """Stores validated psychometric results (PHQ-9, GAD-7, MBI-S) for anonymous students."""
    __tablename__ = "clinical_assessments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, index=True, nullable=True)
    test_type = Column(String(50), index=True)  # phq9, gad7, burnout
    score = Column(Integer)
    severity_label = Column(String(100))
    answers_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SOAPRecord(Base):
    """Structured SOAP clinical EHR records created by licensed campus counseling professionals."""
    __tablename__ = "soap_records"

    id = Column(Integer, primary_key=True, index=True)
    student_alias = Column(String(200), index=True)
    psychologist_id = Column(Integer, index=True, nullable=True)
    risk_level = Column(String(50), default="Moderate")
    subjective = Column(Text)
    objective = Column(Text)
    assessment = Column(Text)
    plan = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

