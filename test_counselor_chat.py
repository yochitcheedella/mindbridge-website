import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import get_db, SessionLocal
from app.models.user import Student
from app.models.psychologist import Psychologist
from app.models.appointment import Appointment
from app.models.chat import ChatMessage
from app.core.security import hash_password, create_access_token

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def test_student_counselor_private_chat_and_risk_triage(db: Session):
    """
    Test End-to-End Student ↔ Psychologist Private Chat:
    1. Student registers with unique anonymous alias 'Blue Sparrow #4821'.
    2. Student sends message with academic stress.
    3. AI safety & risk triage tags the message with clinical concern.
    4. Counselor fetches student case with zero PII, sees student alias only and AI triage level.
    5. Counselor sends reply to student.
    6. Student receives counselor reply in conversation thread.
    """
    ts = int(datetime.utcnow().timestamp())
    alias = f"Blue Sparrow #{ts % 10000}"

    # Create Psychologist
    psych = Psychologist(
        name="Dr. Ananya Sharma",
        email=f"ananya_{ts}@vishnu.edu.in",
        password_hash=hash_password("DocPass123!"),
        specialization="Clinical Psychology",
    )
    db.add(psych)
    db.commit()
    db.refresh(psych)

    # Create Student with Anonymous Alias
    student = Student(
        email_hash=f"student_chat_{ts}@vishnu.edu.in",
        password_hash=hash_password("Pass123!"),
        anonymous_token=alias,
        department="CSE",
        year=3,
        risk_score=0.1,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Create Confirmed Appointment linking student and psychologist
    appt = Appointment(
        student_id=student.id,
        psychologist_id=psych.id,
        slot_time=datetime.utcnow() + timedelta(days=1),
        status="confirmed",
        notes="Academic stress and exam anxiety",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    # Auth tokens
    student_token = create_access_token({"sub": str(student.id), "role": "student"})
    psych_token = create_access_token({"sub": str(psych.id), "role": "psychologist"})

    # 1. Student queries initial counselor chat history
    res_hist = client.get(
        "/api/chat/counselor/history",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_hist.status_code == 200
    hist_data = res_hist.json()
    assert hist_data["student_alias"] == alias
    assert hist_data["counselor"]["name"] == "Dr. Ananya Sharma"
    assert hist_data["counselor"]["appointment_id"] == appt.id

    # 2. Student sends message: "I'm feeling very stressed about my academics lately."
    res_send = client.post(
        "/api/chat/counselor/send",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "text": "I'm feeling very stressed about my academics lately and having trouble concentrating.",
            "appointment_id": appt.id,
        },
    )
    assert res_send.status_code == 200
    send_data = res_send.json()
    assert send_data["sender"] == "user"
    assert "stressed" in send_data["text"]
    assert send_data["clinical_concern"] in ("elevated", "low", "high_concern")

    from urllib.parse import quote
    encoded_alias = quote(alias, safe="")

    # 3. Psychologist fetches case details using ONLY anonymous_id
    res_case = client.get(f"/api/psychologist/student/{encoded_alias}")
    assert res_case.status_code == 200
    case_data = res_case.json()
    assert case_data["student"]["anonymous_id"] == alias
    assert case_data["active_appointment_id"] == appt.id
    assert "clinical_concern_level" in case_data["student"]
    # Verify zero PII
    assert "real_name" not in case_data["student"]
    assert "email" not in case_data["student"]
    assert "phone" not in case_data["student"]

    # 4. Psychologist sends reply: "I understand. Tell me what's been happening."
    res_reply = client.post(
        f"/api/psychologist/student/{encoded_alias}/chat",
        headers={"Authorization": f"Bearer {psych_token}"},
        json={"text": "I understand. Tell me what's been happening."},
    )
    assert res_reply.status_code == 200

    # 5. Student queries updated history and sees both messages
    res_updated = client.get(
        "/api/chat/counselor/history",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_updated.status_code == 200
    updated_data = res_updated.json()
    msgs = updated_data["messages"]
    assert len(msgs) == 2
    assert msgs[0]["sender"] == "user"
    assert msgs[0]["text"] == "I'm feeling very stressed about my academics lately and having trouble concentrating."
    assert msgs[1]["sender"] == "counselor"
    assert msgs[1]["text"] == "I understand. Tell me what's been happening."
