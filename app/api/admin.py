"""
MindBridge AI — Admin API
VIT Administration: anonymous analytics, psychologist management, audit logs.
Admins CANNOT view student identities, chat, journals, or session notes.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.core.security import hash_password
from app.models.psychologist import Psychologist
from app.models.admin import VITAdmin
from app.models.appointment import Appointment
from app.models.user import Student
from app.models.mood import MoodLog
from app.models.chat import ChatMessage
from app.models.alert import RiskAlert
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class PsychologistCreate(BaseModel):
    name: str
    specialization: str
    email: str
    password: str


class PsychologistUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    is_active: Optional[bool] = None


class PsychologistResponse(BaseModel):
    id: int
    name: str
    specialization: Optional[str]
    email: Optional[str]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ── Campus Analytics ───────────────────────────────────────────────────────────

@router.get("/analytics")
def get_campus_analytics(
    admin: VITAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Anonymous campus wellbeing analytics for VIT administration.
    NO individual student identity, chat, or journal data is returned.
    """
    total_students = db.query(func.count(Student.id)).scalar() or 0
    avg_risk = db.query(func.avg(Student.risk_score)).scalar() or 0.0
    high_risk_count = db.query(func.count(Student.id)).filter(Student.risk_score >= 0.7).scalar() or 0
    medium_risk_count = db.query(func.count(Student.id)).filter(
        Student.risk_score >= 0.4, Student.risk_score < 0.7
    ).scalar() or 0
    low_risk_count = db.query(func.count(Student.id)).filter(Student.risk_score < 0.4).scalar() or 0

    avg_mood_raw = db.query(func.avg(MoodLog.score)).scalar()
    avg_mood = round(float(avg_mood_raw), 2) if avg_mood_raw else 0.0

    avg_burnout = db.query(func.avg(Student.burnout_probability)).scalar() or 0.0

    total_sessions = db.query(func.count(ChatMessage.id)).scalar() or 0
    total_appointments = db.query(func.count(Appointment.id)).scalar() or 0
    active_appointments = db.query(func.count(Appointment.id)).filter(
        Appointment.status == "confirmed"
    ).scalar() or 0
    active_alerts = db.query(func.count(RiskAlert.id)).filter(RiskAlert.status == "active").scalar() or 0

    # Department wellbeing breakdown
    dept_stats = (
        db.query(
            Student.department,
            func.count(Student.id).label("count"),
            func.avg(Student.risk_score).label("avg_risk"),
        )
        .filter(Student.department != None)
        .group_by(Student.department)
        .all()
    )
    department_data = [
        {
            "name": d.department,
            "student_count": d.count,
            "stress_index": round(float(d.avg_risk) * 100),
            "wellbeing_score": max(0, round((1 - float(d.avg_risk)) * 100)),
        }
        for d in dept_stats
    ]
    department_data.sort(key=lambda x: x["stress_index"], reverse=True)

    # Year-wise breakdown
    year_stats = (
        db.query(
            Student.year,
            func.count(Student.id).label("count"),
            func.avg(Student.risk_score).label("avg_risk"),
        )
        .filter(Student.year != None)
        .group_by(Student.year)
        .order_by(Student.year)
        .all()
    )
    year_data = [
        {
            "year": f"Year {y.year}",
            "student_count": y.count,
            "stress_index": round(float(y.avg_risk) * 100),
        }
        for y in year_stats
    ]

    return {
        "institution": "Vishnu Institute of Technology",
        "total_students": total_students,
        "campus_wellbeing_percent": max(0, round((1 - float(avg_risk)) * 100)),
        "average_risk_score": round(float(avg_risk), 3),
        "high_risk_count": high_risk_count,
        "medium_risk_count": medium_risk_count,
        "low_risk_count": low_risk_count,
        "active_alerts": active_alerts,
        "average_mood_score": avg_mood,
        "average_burnout_probability": round(float(avg_burnout), 3),
        "total_ai_sessions": total_sessions,
        "total_appointments": total_appointments,
        "active_appointments": active_appointments,
        "department_data": department_data,
        "year_data": year_data,
    }


@router.get("/stats")
def get_platform_stats(
    admin: VITAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Quick stats summary for the admin dashboard header."""
    return {
        "total_students": db.query(func.count(Student.id)).scalar() or 0,
        "total_psychologists": db.query(func.count(Psychologist.id)).filter(Psychologist.is_active == True).scalar() or 0,
        "total_appointments": db.query(func.count(Appointment.id)).scalar() or 0,
        "active_alerts": db.query(func.count(RiskAlert.id)).filter(RiskAlert.status == "active").scalar() or 0,
    }


# ── Psychologist Management ────────────────────────────────────────────────────

@router.get("/psychologists", response_model=List[PsychologistResponse])
def get_all_psychologists(
    admin: VITAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List all VIT psychologists."""
    return db.query(Psychologist).all()


@router.post("/psychologists", response_model=PsychologistResponse)
def add_psychologist(
    req: PsychologistCreate,
    admin: VITAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add a new VIT psychologist with login credentials."""
    existing = db.query(Psychologist).filter(Psychologist.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A psychologist with this email already exists.")

    psych = Psychologist(
        name=req.name,
        specialization=req.specialization,
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        is_active=True,
    )
    db.add(psych)
    db.commit()
    db.refresh(psych)

    # Audit log
    log = AuditLog(
        action_type="psychologist_added",
        actor_id=admin.id,
        target_id=psych.id,
        details=f"Admin '{admin.name}' added psychologist '{psych.name}' ({req.email})",
    )
    db.add(log)
    db.commit()

    return psych


@router.put("/psychologists/{psych_id}", response_model=PsychologistResponse)
def update_psychologist(
    psych_id: int,
    req: PsychologistUpdate,
    admin: VITAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update a psychologist's details or active status."""
    psych = db.query(Psychologist).filter(Psychologist.id == psych_id).first()
    if not psych:
        raise HTTPException(status_code=404, detail="Psychologist not found")

    if req.name is not None:
        psych.name = req.name
    if req.specialization is not None:
        psych.specialization = req.specialization
    if req.is_active is not None:
        psych.is_active = req.is_active

    db.commit()
    db.refresh(psych)
    return psych


@router.delete("/psychologists/{psych_id}")
def remove_psychologist(
    psych_id: int,
    admin: VITAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Deactivate a psychologist (soft delete — preserves historical case data)."""
    psych = db.query(Psychologist).filter(Psychologist.id == psych_id).first()
    if not psych:
        raise HTTPException(status_code=404, detail="Psychologist not found")

    psych.is_active = False
    db.commit()

    log = AuditLog(
        action_type="psychologist_deactivated",
        actor_id=admin.id,
        target_id=psych_id,
        details=f"Admin '{admin.name}' deactivated psychologist '{psych.name}'",
    )
    db.add(log)
    db.commit()

    return {"status": "success", "message": f"Psychologist '{psych.name}' deactivated."}


# ── Audit Logs ─────────────────────────────────────────────────────────────────

@router.get("/audit-logs")
def get_audit_logs(
    admin: VITAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    """Return recent audit log entries for admin review."""
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "action_type": log.action_type,
            "actor_id": log.actor_id,
            "target_id": log.target_id,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


# ── Report Data ────────────────────────────────────────────────────────────────

@router.get("/reports/wellbeing")
def get_wellbeing_report(
    admin: VITAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Anonymized campus wellbeing report suitable for download.
    Contains NO individual student data.
    """
    total_students = db.query(func.count(Student.id)).scalar() or 0
    avg_risk = db.query(func.avg(Student.risk_score)).scalar() or 0.0
    high_risk = db.query(func.count(Student.id)).filter(Student.risk_score >= 0.7).scalar() or 0
    total_appts = db.query(func.count(Appointment.id)).scalar() or 0

    dept_stats = (
        db.query(Student.department, func.count(Student.id).label("n"), func.avg(Student.risk_score).label("avg"))
        .group_by(Student.department)
        .all()
    )

    return {
        "report_title": "Vishnu Institute of Technology — Campus Wellbeing Report",
        "generated_by": admin.name,
        "summary": {
            "total_enrolled_students_on_platform": total_students,
            "campus_wellbeing_score": max(0, round((1 - float(avg_risk)) * 100)),
            "high_risk_students_percent": round((high_risk / total_students * 100) if total_students else 0, 1),
            "total_counseling_appointments": total_appts,
        },
        "department_breakdown": [
            {
                "department": d.department,
                "students": d.n,
                "avg_stress_score": round(float(d.avg) * 100),
                "wellbeing_score": max(0, round((1 - float(d.avg)) * 100)),
            }
            for d in dept_stats if d.department
        ],
        "note": "All data is anonymized. No individual student identity is included.",
    }
