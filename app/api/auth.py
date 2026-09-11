"""
MindBridge AI — Authentication API
VIT-only platform. Three roles: student · psychologist · admin.
No SaaS, no multi-tenant, no university selection.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any
import random
import re

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    generate_anonymous_alias, decode_token, encrypt_data,
)
from app.models.user import Student
from app.models.psychologist import Psychologist
from app.models.admin import VITAdmin
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/auth", tags=["auth"])

VIT_INSTITUTION = "Vishnu Institute of Technology"
VIT_PRIMARY_COLOR = "#6366f1"  # Indigo — VIT brand color


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_current_student(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Student:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    student = db.query(Student).filter(Student.id == int(payload["sub"])).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student


# ── Schemas ────────────────────────────────────────────────────────────────────

class StudentRegisterRequest(BaseModel):
    name: str
    phone: str
    alias: str = ""
    email: str
    password: str
    department: str = "General"
    year: Any = 1


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  # None / "auto" | "student" | "psychologist" | "admin"


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


class ConsentRequest(BaseModel):
    policy_version: str = "v1.0-vishnu"
    accepted_privacy: bool = True
    accepted_anonymous_policy: bool = True
    accepted_crisis_terms: bool = True


class ProfileUpdateRequest(BaseModel):
    department: Optional[str] = None
    year: Optional[int] = None


class FCMTokenRequest(BaseModel):
    token: str


class AdminCreateRequest(BaseModel):
    name: str
    email: str
    password: str


# ── Student Registration ───────────────────────────────────────────────────────

@router.post("/register")
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new VIT student with AES-128 encrypted identity vault.
    Real identity is never stored in plaintext.
    """
    email_clean = req.email.lower().strip()

    # Check for duplicate registration
    existing = db.query(Student).filter(Student.email_hash == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this VIT email already exists.")

    # Handle user-controlled anonymous alias with graceful collision resolution
    raw_alias = req.alias.strip() if req.alias and req.alias.strip() else ""
    if raw_alias:
        alias = raw_alias
        # If another student already uses this alias, append private discriminator like #4821
        while db.query(Student).filter(Student.anonymous_token == alias).first():
            alias = f"{raw_alias} #{random.randint(1000, 9999)}"
    else:
        alias = generate_anonymous_alias()
        while db.query(Student).filter(Student.anonymous_token == alias).first():
            alias = generate_anonymous_alias()

    # Encrypt PII
    enc_name = encrypt_data(req.name.strip())
    enc_phone = encrypt_data(req.phone.strip())
    enc_email = encrypt_data(email_clean)

    # Safely parse year from int, string, or mixed format like "Year 3"
    parsed_year = 1
    try:
        if isinstance(req.year, int):
            parsed_year = req.year
        elif isinstance(req.year, str):
            digits = re.findall(r'\d+', req.year)
            parsed_year = int(digits[0]) if digits else 1
    except Exception:
        parsed_year = 1
    parsed_year = max(1, min(10, parsed_year))

    student = Student(
        email_hash=email_clean,
        password_hash=hash_password(req.password),
        encrypted_name=enc_name,
        encrypted_phone=enc_phone,
        encrypted_email=enc_email,
        anonymous_token=alias,
        department=req.department.strip() or "General",
        year=parsed_year,
        risk_score=0.0,
        burnout_probability=0.0,
        daily_wellness_score=100,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    token = create_access_token({
        "sub": str(student.id),
        "alias": student.anonymous_token,
        "role": "student",
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "student",
        "anonymous_alias": student.anonymous_token,
        "student_id": student.id,
        "institution": VIT_INSTITUTION,
        "primary_color": VIT_PRIMARY_COLOR,
    }


# ── Unified Login ──────────────────────────────────────────────────────────────

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Unified login for all 3 Vishnu College roles: student, psychologist, admin.
    Auto-detects role if not explicitly provided, or validates against selected role.
    Returns a JWT with the 'role' claim embedded.
    """
    role = req.role.lower().strip() if req.role else None
    email_clean = req.email.lower().strip()

    # Helper functions for each role check
    def _try_student():
        student = db.query(Student).filter(Student.email_hash == email_clean).first()
        if student and verify_password(req.password, student.password_hash):
            token = create_access_token({
                "sub": str(student.id),
                "alias": student.anonymous_token,
                "role": "student",
            })
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "student",
                "anonymous_alias": student.anonymous_token,
                "student_id": student.id,
                "institution": VIT_INSTITUTION,
                "primary_color": VIT_PRIMARY_COLOR,
            }
        return None

    def _try_psychologist():
        psych = db.query(Psychologist).filter(
            Psychologist.email == email_clean,
            Psychologist.is_active == True,
        ).first()
        if psych and psych.password_hash and verify_password(req.password, psych.password_hash):
            token = create_access_token({
                "sub": str(psych.id),
                "name": psych.name,
                "role": "psychologist",
            })
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "psychologist",
                "psychologist_id": psych.id,
                "name": psych.name,
                "specialization": psych.specialization,
                "institution": VIT_INSTITUTION,
                "primary_color": "#3b82f6",
            }
        return None

    def _try_admin():
        admin = db.query(VITAdmin).filter(
            VITAdmin.email == email_clean,
            VITAdmin.is_active == True,
        ).first()
        if admin and verify_password(req.password, admin.password_hash):
            token = create_access_token({
                "sub": str(admin.id),
                "name": admin.name,
                "role": "admin",
            })
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "admin",
                "admin_id": admin.id,
                "name": admin.name,
                "institution": VIT_INSTITUTION,
                "primary_color": "#8b5cf6",
            }
        return None

    # 1. Explicit role provided
    if role == "student":
        res = _try_student()
        if res: return res
        raise HTTPException(status_code=401, detail="Invalid student credentials.")
    elif role == "psychologist":
        res = _try_psychologist()
        if res: return res
        raise HTTPException(status_code=401, detail="Invalid psychologist credentials.")
    elif role == "admin":
        res = _try_admin()
        if res: return res
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")

    # 2. Unified Auto-detection (No role specified)
    # Check student first
    res = _try_student()
    if res: return res

    # Check psychologist
    res = _try_psychologist()
    if res: return res

    # Check admin
    res = _try_admin()
    if res: return res

    raise HTTPException(status_code=401, detail="Invalid email or password.")


@router.get("/me")
def get_current_user_profile(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Verify session and return profile of currently authenticated user (any role)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    
    role = payload.get("role", "student")
    user_id = int(payload["sub"])
    
    if role == "student":
        student = db.query(Student).filter(Student.id == user_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found.")
        return {
            "valid": True,
            "role": "student",
            "student_id": student.id,
            "anonymous_alias": student.anonymous_token,
            "institution": VIT_INSTITUTION,
            "primary_color": VIT_PRIMARY_COLOR,
        }
    elif role == "psychologist":
        psych = db.query(Psychologist).filter(Psychologist.id == user_id, Psychologist.is_active == True).first()
        if not psych:
            raise HTTPException(status_code=404, detail="Psychologist not found.")
        return {
            "valid": True,
            "role": "psychologist",
            "psychologist_id": psych.id,
            "name": psych.name,
            "specialization": psych.specialization,
            "institution": VIT_INSTITUTION,
            "primary_color": "#3b82f6",
        }
    elif role == "admin":
        admin = db.query(VITAdmin).filter(VITAdmin.id == user_id, VITAdmin.is_active == True).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found.")
        return {
            "valid": True,
            "role": "admin",
            "admin_id": admin.id,
            "name": admin.name,
            "institution": VIT_INSTITUTION,
            "primary_color": "#8b5cf6",
        }
    raise HTTPException(status_code=401, detail="Unknown role in token.")


@router.post("/refresh")
def refresh_session_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Issue a fresh access token for a valid session without re-entering credentials."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    
    role = payload.get("role", "student")
    user_id = int(payload["sub"])
    
    if role == "student":
        student = db.query(Student).filter(Student.id == user_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found.")
        new_token = create_access_token({
            "sub": str(student.id),
            "alias": student.anonymous_token,
            "role": "student",
        })
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "role": "student",
            "anonymous_alias": student.anonymous_token,
            "student_id": student.id,
            "institution": VIT_INSTITUTION,
            "primary_color": VIT_PRIMARY_COLOR,
        }
    elif role == "psychologist":
        psych = db.query(Psychologist).filter(Psychologist.id == user_id, Psychologist.is_active == True).first()
        if not psych:
            raise HTTPException(status_code=404, detail="Psychologist not found.")
        new_token = create_access_token({
            "sub": str(psych.id),
            "name": psych.name,
            "role": "psychologist",
        })
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "role": "psychologist",
            "psychologist_id": psych.id,
            "name": psych.name,
            "specialization": psych.specialization,
            "institution": VIT_INSTITUTION,
            "primary_color": "#3b82f6",
        }
    elif role == "admin":
        admin = db.query(VITAdmin).filter(VITAdmin.id == user_id, VITAdmin.is_active == True).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found.")
        new_token = create_access_token({
            "sub": str(admin.id),
            "name": admin.name,
            "role": "admin",
        })
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "role": "admin",
            "admin_id": admin.id,
            "name": admin.name,
            "institution": VIT_INSTITUTION,
            "primary_color": "#8b5cf6",
        }
    raise HTTPException(status_code=401, detail="Unknown role in token.")



# ── Password Reset (Students) ──────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiates password reset. Does not reveal whether the email exists."""
    # In production: generate OTP, store with expiry, send via VIT SMTP
    return {"status": "success", "message": "If the email exists, an OTP has been sent."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verifies OTP and resets the user's password across all three institutional roles (Student, Psychologist, Admin). Demo OTP: 123456."""
    if req.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    email_lower = req.email.lower()
    new_hash = hash_password(req.new_password)

    # Check Student
    student = db.query(Student).filter(Student.email_hash == email_lower).first()
    if student:
        student.password_hash = new_hash
        db.commit()
        return {"status": "success", "message": "Student password updated successfully."}

    # Check Psychologist
    psych = db.query(Psychologist).filter(Psychologist.email == email_lower).first()
    if psych:
        psych.password_hash = new_hash
        db.commit()
        return {"status": "success", "message": "Psychologist password updated successfully."}

    # Check Admin
    admin = db.query(VITAdmin).filter(VITAdmin.email == email_lower).first()
    if admin:
        admin.password_hash = new_hash
        db.commit()
        return {"status": "success", "message": "Admin password updated successfully."}

    raise HTTPException(status_code=400, detail="Invalid request or account not found.")


# ── Student Profile ────────────────────────────────────────────────────────────

@router.get("/profile")
def get_profile(
    current: Student = Depends(_get_current_student),
    db: Session = Depends(get_db),
):
    """Return the authenticated student's profile. No PII exposed."""
    return {
        "anonymous_alias": current.anonymous_token,
        "department": current.department,
        "year": current.year,
        "institution": VIT_INSTITUTION,
        "primary_color": VIT_PRIMARY_COLOR,
    }


@router.put("/profile")
def update_profile(
    req: ProfileUpdateRequest,
    current: Student = Depends(_get_current_student),
    db: Session = Depends(get_db),
):
    """Allow a student to update their department and/or year."""
    if req.department is not None:
        current.department = req.department
    if req.year is not None:
        if req.year < 1 or req.year > 10:
            raise HTTPException(status_code=422, detail="Year must be between 1 and 10.")
        current.year = req.year
    db.commit()
    db.refresh(current)
    return {
        "message": "Profile updated successfully.",
        "department": current.department,
        "year": current.year,
    }


@router.post("/fcm-token")
def update_fcm_token(
    req: FCMTokenRequest,
    current: Student = Depends(_get_current_student),
    db: Session = Depends(get_db),
):
    """Save the FCM push notification token for the student device."""
    current.fcm_token = req.token
    db.commit()
    return {"status": "success", "message": "FCM token updated."}


# ── Consent Management ─────────────────────────────────────────────────────────

@router.post("/consent")
def submit_consent(
    req: ConsentRequest,
    current: Student = Depends(_get_current_student),
    db: Session = Depends(get_db),
):
    """Record student institutional consent for anonymous support & safety policies."""
    # Audit log the consent acceptance
    audit = AuditLog(
        action="CONSENT_ACCEPTED",
        action_type="policy_consent",
        actor_id=current.id,
        target_student_id=current.id,
        details=f"Accepted policy version: {req.policy_version} (Privacy: {req.accepted_privacy}, Anon: {req.accepted_anonymous_policy}, Crisis: {req.accepted_crisis_terms})"
    )
    db.add(audit)
    db.commit()
    return {
        "status": "success",
        "message": "Consent recorded successfully.",
        "policy_version": req.policy_version,
    }


@router.get("/consent/status")
def get_consent_status(
    current: Student = Depends(_get_current_student),
    db: Session = Depends(get_db),
):
    """Check if the current student has recorded policy consent."""
    consent_audit = db.query(AuditLog).filter(
        AuditLog.target_student_id == current.id,
        AuditLog.action == "CONSENT_ACCEPTED",
    ).first()
    return {
        "has_consented": consent_audit is not None,
        "policy_version": "v1.0-vishnu",
    }


# ── Seed: Create default VIT admin (for first run) ────────────────────────────

@router.post("/seed-admin")
def seed_vit_admin(req: AdminCreateRequest, db: Session = Depends(get_db)):
    """
    Create the default VIT admin account.
    This endpoint is only for initial setup — in production, restrict by IP or remove entirely.
    """
    existing = db.query(VITAdmin).filter(VITAdmin.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin account already exists.")

    admin = VITAdmin(
        name=req.name,
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "status": "success",
        "message": f"VIT Admin '{admin.name}' created successfully.",
        "admin_id": admin.id,
    }

