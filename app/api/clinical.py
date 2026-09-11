from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json

from app.core.database import get_db
from app.models.clinical import ClinicalAssessment, SOAPRecord
from app.models.user import Student
from app.core.deps import get_current_user_any_role as get_current_user

router = APIRouter(prefix="/api/clinical", tags=["clinical-ehr"])

class AssessmentSubmitRequest(BaseModel):
    test_type: Optional[str] = None
    assessment_type: Optional[str] = None
    score: int
    severity_label: Optional[str] = None
    severity: Optional[str] = None
    answers: Optional[Dict[str, Any]] = None
    responses: Optional[Dict[str, Any]] = None

class SOAPNoteSubmitRequest(BaseModel):
    student_alias: str
    risk_level: str
    subjective: str
    objective: str
    assessment: str
    plan: str


@router.post("/assessments", status_code=status.HTTP_201_CREATED)
@router.post("/assessment", status_code=status.HTTP_201_CREATED)
async def create_assessment(
    req: AssessmentSubmitRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Records a clinical psychometric questionnaire score (PHQ-9, GAD-7, MBI-Student Burnout).
    Automatically recalculates the anonymous student's baseline clinical risk indicator.
    """
    student_id = current_user.get("user_id") if current_user.get("role") == "student" else None

    t_type = (req.test_type or req.assessment_type or "phq9").lower()
    s_label = req.severity_label or req.severity or "Minimal"
    ans = req.answers or req.responses

    assessment_record = ClinicalAssessment(
        student_id=student_id,
        test_type=t_type,
        score=req.score,
        severity_label=s_label,
        answers_json=json.dumps(ans) if ans else None
    )
    db.add(assessment_record)

    # Elevate student risk score if severity reaches clinical concern
    if student_id and t_type in ["phq9", "gad7", "burnout", "mbi-s", "mbi"]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if student:
            if "Severe" in s_label or "Critical" in s_label:
                student.risk_score = max(student.risk_score or 0.0, 0.75)
            elif "Moderate" in s_label:
                student.risk_score = max(student.risk_score or 0.0, 0.45)
            db.add(student)

    db.commit()
    db.refresh(assessment_record)
    return {"status": "success", "id": assessment_record.id, "severity_label": s_label}


@router.get("/assessments")
@router.get("/assessment")
async def get_my_assessments(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves chronological assessment diagnostic logs for trend visualization.
    """
    student_id = current_user.get("user_id")
    if current_user.get("role") != "student" or not student_id:
        # For counselors/admins, fetch recent campus screenings anonymously
        records = db.query(ClinicalAssessment).order_by(ClinicalAssessment.created_at.desc()).limit(30).all()
    else:
        records = db.query(ClinicalAssessment).filter(ClinicalAssessment.student_id == student_id).order_by(ClinicalAssessment.created_at.desc()).limit(25).all()

    return [
        {
            "id": r.id,
            "test_type": r.test_type,
            "score": r.score,
            "severity_label": r.severity_label,
            "date": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]


@router.post("/soap-notes", status_code=status.HTTP_201_CREATED)
@router.post("/soap", status_code=status.HTTP_201_CREATED)
async def save_soap_note(
    req: SOAPNoteSubmitRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stores an encrypted SOAP therapeutic evaluation record created by campus psychologists.
    """
    if current_user.get("role") not in ["psychologist", "admin"]:
        raise HTTPException(status_code=403, detail="Only licensed counselors can author SOAP records")

    soap_entry = SOAPRecord(
        student_alias=req.student_alias,
        psychologist_id=current_user.get("user_id"),
        risk_level=req.risk_level,
        subjective=req.subjective,
        objective=req.objective,
        assessment=req.assessment,
        plan=req.plan
    )
    db.add(soap_entry)

    # Adjust student risk indicator based on clinician judgment
    student = db.query(Student).filter(Student.anonymous_token == req.student_alias).first()
    if student:
        if req.risk_level == "Critical":
            student.risk_score = max(student.risk_score or 0.0, 0.9)
        elif req.risk_level == "High":
            student.risk_score = max(student.risk_score or 0.0, 0.7)
        db.add(student)

    db.commit()
    db.refresh(soap_entry)
    return {"status": "success", "note_id": soap_entry.id}


@router.get("/soap-notes")
@router.get("/soap")
async def get_soap_notes(
    student_alias: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches clinical SOAP notes for counseling reviews and case handoffs.
    """
    if current_user.get("role") not in ["psychologist", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to confidential EHR records")

    query = db.query(SOAPRecord)
    if student_alias:
        query = query.filter(SOAPRecord.student_alias == student_alias)

    notes = query.order_by(SOAPRecord.created_at.desc()).limit(50).all()
    return [
        {
            "id": n.id,
            "studentAlias": n.student_alias,
            "riskLevel": n.risk_level,
            "subjective": n.subjective,
            "objective": n.objective,
            "assessment": n.assessment,
            "plan": n.plan,
            "date": n.created_at.isoformat() if n.created_at else None
        }
        for n in notes
    ]
