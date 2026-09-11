from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_student
from app.models.user import Student
from app.models.alert import RiskAlert
from app.models.audit import AuditLog
from app.core.security import decrypt_data
from app.core.alert_manager import alert_manager
import asyncio

router = APIRouter(prefix="/api/emergency", tags=["emergency"])

class SOSTriggerRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    message: Optional[str] = None


@router.get("/contacts")
def get_emergency_contacts():
    """Return verified institutional and national crisis contacts."""
    return [
        {
            "name": "Vishnu Campus Emergency Security",
            "phone": "+91 8816-250864",
            "type": "Campus Security & Health Desk",
            "available": "24/7"
        },
        {
            "name": "Tele-MANAS National Helpline",
            "phone": "14416 / 1800-891-4416",
            "type": "Govt. of India Mental Health Crisis",
            "available": "24/7 Toll-Free"
        },
        {
            "name": "KIRAN Mental Health Helpline",
            "phone": "1800-599-0019",
            "type": "Early Crisis Intervention",
            "available": "24/7"
        },
        {
            "name": "Vishnu Health & Counseling Center",
            "location": "A-Block Ground Floor, VIT Campus",
            "type": "Walk-in Clinical Care",
            "available": "Mon-Sat 8:30 AM - 6:00 PM"
        }
    ]


@router.get("/status")
def get_sos_status(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Check if the student has an active emergency alert."""
    active_alert = db.query(RiskAlert).filter(
        RiskAlert.student_id == student.id,
        RiskAlert.status == "active"
    ).order_by(RiskAlert.created_at.desc()).first()

    return {
        "has_active_sos": active_alert is not None,
        "alert_id": active_alert.id if active_alert else None,
        "risk_level": active_alert.risk_level if active_alert else "normal"
    }


@router.post("/trigger")
@router.post("/sos")
def trigger_emergency_sos(
    req: Optional[SOSTriggerRequest] = None,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Instantly elevates the student's risk profile to maximum and creates an active crisis alert.
    """
    from app.services.notifications import send_push_notification

    # 1. Elevate risk score to maximum
    student.risk_score = 1.0

    # 2. Log the active alert
    alert = RiskAlert(
        student_id=student.id,
        risk_level="critical",
        triggered_by="user_sos",
        status="active"
    )
    
    db.add(alert)
    db.commit()

    # 3. Send Push Notification to Psychologist devices
    mock_psychologist_fcm_token = "placeholder-psychologist-fcm-token"
    send_push_notification(
        title="EMERGENCY SOS ALERT",
        body=f"Student {student.anonymous_token} has triggered an SOS.",
        fcm_token=mock_psychologist_fcm_token,
        data={"alert_id": str(alert.id), "student_id": str(student.id)}
    )
    
    # 4. Broadcast via WebSockets to live clinicians
    alert_manager.dispatch_alert({
        "type": "EMERGENCY_SOS",
        "alert_id": alert.id,
        "student_alias": student.anonymous_token,
        "timestamp": alert.created_at.isoformat() if alert.created_at else None,
        "message": f"Student {student.anonymous_token} triggered an SOS."
    })

    return {"status": "success", "message": "Emergency SOS dispatched."}

def require_emergency_auth(x_emergency_auth: Optional[str] = Header(None)):
    """Mock authorization for the emergency committee."""
    if x_emergency_auth != "super-secret-committee-token":
        raise HTTPException(status_code=403, detail="Forbidden. Emergency authorization required.")
    return "emergency_committee_member"

class DecryptRequest(BaseModel):
    reason: str

@router.post("/decrypt-identity/{anonymous_id}")
def decrypt_student_identity(
    anonymous_id: str,
    req: DecryptRequest,
    db: Session = Depends(get_db),
    committee_role: str = Depends(require_emergency_auth)
):
    """
    Emergency Protocol: Decrypts the real identity of a student in crisis.
    Requires strict authorization and is fully audited.
    """
    student = db.query(Student).filter(Student.anonymous_token == anonymous_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # 1. Decrypt data
    name = decrypt_data(student.encrypted_name) if student.encrypted_name else "Unknown"
    phone = decrypt_data(student.encrypted_phone) if student.encrypted_phone else "Unknown"
    email = decrypt_data(student.encrypted_email) if student.encrypted_email else "Unknown"
    
    # 2. Audit log
    audit_record = AuditLog(
        action="IDENTITY_DECRYPTED",
        target_student_id=student.id,
        requested_by=committee_role,
        reason=req.reason
    )
    db.add(audit_record)
    db.commit()
    
    return {
        "status": "success",
        "message": "Identity decrypted. Actions audited.",
        "identity": {
            "name": name,
            "phone": phone,
            "email": email,
            "alias": student.anonymous_token
        }
    }


class EscalateRequest(BaseModel):
    reason: str

@router.post("/{alert_id}/escalate")
def escalate_alert(
    alert_id: int,
    req: EscalateRequest,
    db: Session = Depends(get_db)
    # In reality, verify psychologist JWT here
):
    """
    Escalates an alert to campus security and breaks anonymity.
    """
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    student = db.query(Student).filter(Student.id == alert.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    alert.status = "escalated_to_security"
    
    # Decrypt data
    name = decrypt_data(student.encrypted_name) if student.encrypted_name else "Unknown"
    phone = decrypt_data(student.encrypted_phone) if student.encrypted_phone else "Unknown"
    email = decrypt_data(student.encrypted_email) if student.encrypted_email else "Unknown"

    audit_record = AuditLog(
        action="IDENTITY_DECRYPTED_ESCALATION",
        target_student_id=student.id,
        requested_by="psychologist",
        reason=req.reason
    )
    db.add(audit_record)
    db.commit()

    return {
        "status": "success",
        "message": "Alert escalated to Campus Security. Identity revealed.",
        "identity": {
            "name": name,
            "phone": phone,
            "email": email,
            "alias": student.anonymous_token
        }
    }
