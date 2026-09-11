"""
Shared FastAPI dependencies — used across all API routes.
Three user roles: Student · Psychologist · Admin (VIT-only, no SaaS).
"""
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import Student
from app.models.psychologist import Psychologist
from app.models.admin import VITAdmin


# ── Student ────────────────────────────────────────────────────────────────────

def get_current_student(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Student:
    """JWT dependency — extracts and validates the authenticated VIT student."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") not in (None, "student"):
        raise HTTPException(status_code=403, detail="Student access required")

    student = db.query(Student).filter(Student.id == int(payload["sub"])).first()
    if not student:
        raise HTTPException(status_code=401, detail="Student account not found")

    return student


# ── Psychologist ───────────────────────────────────────────────────────────────

def get_current_psychologist(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Psychologist:
    """JWT dependency — extracts and validates the authenticated VIT psychologist."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "psychologist":
        raise HTTPException(status_code=403, detail="Psychologist access required")

    psych = db.query(Psychologist).filter(Psychologist.id == int(payload["sub"])).first()
    if not psych or not psych.is_active:
        raise HTTPException(status_code=401, detail="Psychologist account not found or inactive")

    return psych


# ── Admin ──────────────────────────────────────────────────────────────────────

def get_current_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> VITAdmin:
    """JWT dependency — extracts and validates the authenticated VIT admin."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    admin = db.query(VITAdmin).filter(VITAdmin.id == int(payload["sub"])).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin account not found or inactive")

    return admin


# ── Any Authenticated Role (Student, Psychologist, Admin) ─────────────────────

def get_current_user_any_role(
    authorization: Optional[str] = Header(None),
) -> dict:
    """JWT dependency — validates token and allows any of the three VIT roles."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    role = payload.get("role", "student")
    uid = int(payload["sub"])
    return {"id": uid, "user_id": uid, "role": role}

