"""
Tests for MindBridge Anonymous Audio Call System:
- User-controlled unique alias collision handling (preserves alias + adds #tag)
- Appointment-verified call room token generation
- Authorization enforcement (403 when unassigned user attempts to get call token)
- Zero-PII shielding for psychologist
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.main import app
from app.core.database import SessionLocal
from app.models.user import Student
from app.models.psychologist import Psychologist
from app.models.appointment import Appointment
from app.core.security import hash_password, create_access_token

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def test_alias_collision_appends_tag(db):
    """If two students request the same alias, the first gets it clean and the second gets '#XXXX' appended."""
    ts = int(datetime.utcnow().timestamp())
    base_alias = f"Blue Sparrow {ts}"
    email1 = f"student1_{ts}@vishnu.edu.in"
    email2 = f"student2_{ts}@vishnu.edu.in"

    # Register first student
    res1 = client.post(
        "/api/auth/register",
        json={
            "name": "First Real Name",
            "phone": "+919876543210",
            "alias": base_alias,
            "email": email1,
            "password": "Password123!",
            "department": "CSE",
            "year": 2,
        },
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["anonymous_alias"] == base_alias

    # Register second student with the same alias
    res2 = client.post(
        "/api/auth/register",
        json={
            "name": "Second Real Name",
            "phone": "+919876543211",
            "alias": base_alias,
            "email": email2,
            "password": "Password123!",
            "department": "IT",
            "year": 3,
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    # Must preserve base_alias and append a #XXXX tag
    assert data2["anonymous_alias"].startswith(f"{base_alias} #")
    assert data2["anonymous_alias"] != base_alias


def test_appointment_call_token_authorization(db):
    """Only assigned student or assigned psychologist can obtain a call token."""
    # Create test psychologist
    psych = Psychologist(
        name="Dr. Ananya Sharma",
        email=f"ananya_{datetime.utcnow().timestamp()}@vishnu.edu.in",
        specialization="Clinical Psychology",
        is_active=True,
    )
    db.add(psych)
    db.commit()
    db.refresh(psych)

    # Create assigned student
    student_assigned = Student(
        email_hash=f"student_assigned_{datetime.utcnow().timestamp()}@vishnu.edu.in",
        password_hash=hash_password("Pass123!"),
        anonymous_token=f"Sapphire Falcon #{int(datetime.utcnow().timestamp()) % 10000}",
        department="AI&DS",
        year=2,
    )
    db.add(student_assigned)

    # Create unassigned student (attacker/bystander)
    student_other = Student(
        email_hash=f"student_other_{datetime.utcnow().timestamp()}@vishnu.edu.in",
        password_hash=hash_password("Pass123!"),
        anonymous_token=f"Emerald Wolf #{int(datetime.utcnow().timestamp()) % 10000}",
        department="MECH",
        year=1,
    )
    db.add(student_other)
    db.commit()
    db.refresh(student_assigned)
    db.refresh(student_other)

    # Create appointment
    appt = Appointment(
        student_id=student_assigned.id,
        psychologist_id=psych.id,
        slot_time=datetime.utcnow() + timedelta(days=1),
        status="confirmed",
        notes="Anxiety management",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    # Create tokens for auth
    token_assigned_student = create_access_token({"sub": str(student_assigned.id), "role": "student"})
    token_other_student = create_access_token({"sub": str(student_other.id), "role": "student"})
    token_psychologist = create_access_token({"sub": str(psych.id), "role": "psychologist"})

    # 1. Assigned student requests call token -> SUCCESS
    res_assigned = client.post(
        f"/api/appointments/{appt.id}/call-token",
        headers={"Authorization": f"Bearer {token_assigned_student}"},
    )
    assert res_assigned.status_code == 200
    data_assigned = res_assigned.json()
    assert "call_token" in data_assigned
    assert data_assigned["my_alias"] == student_assigned.anonymous_token
    assert data_assigned["peer_alias"] == psych.name

    # 2. Unassigned student requests call token -> 403 FORBIDDEN
    res_other = client.post(
        f"/api/appointments/{appt.id}/call-token",
        headers={"Authorization": f"Bearer {token_other_student}"},
    )
    assert res_other.status_code == 403
    assert "Access denied" in res_other.json()["detail"]

    # 3. Assigned psychologist requests call token -> SUCCESS with zero PII
    res_psych = client.post(
        f"/api/appointments/{appt.id}/call-token",
        headers={"Authorization": f"Bearer {token_psychologist}"},
    )
    assert res_psych.status_code == 200
    data_psych = res_psych.json()
    assert "call_token" in data_psych
    assert data_psych["my_alias"] == psych.name
    assert data_psych["peer_alias"] == student_assigned.anonymous_token
    # Verify no PII fields exist
    assert "encrypted_name" not in data_psych
    assert "real_name" not in data_psych
    assert "phone" not in data_psych
    assert "email" not in data_psych


def test_appointment_feedback_and_completion(db):
    """Student submits anonymous session feedback and marks appointment as completed."""
    # Create test student
    student = Student(
        email_hash=f"feedback_student_{datetime.utcnow().timestamp()}@vishnu.edu.in",
        password_hash=hash_password("Pass123!"),
        anonymous_token=f"Golden Horizon #{int(datetime.utcnow().timestamp()) % 10000}",
        department="CSE",
        year=4,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Create appointment
    appt = Appointment(
        student_id=student.id,
        slot_time=datetime.utcnow(),
        status="confirmed",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    token = create_access_token({"sub": str(student.id), "role": "student"})

    res = client.post(
        f"/api/appointments/{appt.id}/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "rating": 5,
            "tags": "Relieved 😌, 100% Safe & Anonymous, Empathetic & Warm",
            "comment": "The session was safe and I was not judged.",
        },
    )
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

    # Verify in DB
    db.refresh(appt)
    assert appt.status == "completed"
    assert appt.feedback_rating == 5
    assert "100% Safe & Anonymous" in appt.feedback_tags
    assert appt.feedback_comment == "The session was safe and I was not judged."

