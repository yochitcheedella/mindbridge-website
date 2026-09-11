from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from .base import Base


class AuditLog(Base):
    """Permanent audit trail for all sensitive actions in MindBridge AI."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Legacy columns (kept for compatibility)
    action = Column(String, index=True, nullable=True)          # e.g., 'IDENTITY_DECRYPTED'
    target_student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    requested_by = Column(String, nullable=True)                # legacy field
    reason = Column(Text, nullable=True)

    # New structured columns for admin/psychologist actions
    action_type = Column(String, index=True, nullable=True)     # e.g., 'psychologist_added'
    actor_id = Column(Integer, nullable=True)                   # ID of the admin/psychologist who acted
    target_id = Column(Integer, nullable=True)                  # ID of the affected resource
    details = Column(Text, nullable=True)                       # Human-readable description

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    timestamp = Column(DateTime(timezone=True), server_default=func.now())  # legacy alias
