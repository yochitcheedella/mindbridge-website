from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from .base import Base


class Psychologist(Base):
    __tablename__ = "psychologists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    institution = Column(String, nullable=True, default="Vishnu Institute of Technology")
    experience = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    full_photo_url = Column(String, nullable=True)
    quote = Column(String, nullable=True)
    pillars = Column(String, nullable=True)
    focus_areas = Column(String, nullable=True)
    message_to_students = Column(String, nullable=True)
    fun_facts = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    available = Column(String, default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

