import pytest
import json
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.models.user import Student
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


def test_ai_assistant_websocket_and_chat_flow(db: Session):
    """
    Test the MindBridge AI Assistant / AI Guide working state:
    1. Authenticated student connects to /api/chat/ws.
    2. Receives initial warm greeting from AI Guide.
    3. Sends message with stress/anxiety.
    4. AI analyzes emotion & risk, returning empathetic guidance and risk classification.
    5. Checks /api/chat/history to verify complete conversational memory.
    """
    ts = int(datetime.utcnow().timestamp())
    alias = f"Cosmic Otter #{ts % 10000}"

    student = Student(
        email_hash=f"ai_student_{ts}@vishnu.edu.in",
        password_hash=hash_password("Pass123!"),
        anonymous_token=alias,
        department="AI&DS",
        year=2,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    token = create_access_token({"sub": str(student.id), "role": "student"})

    # Test WebSocket connection
    with client.websocket_connect(f"/api/chat/ws?token={token}") as ws:
        # 1. Receive greeting
        greeting_raw = ws.receive_text()
        greeting_data = json.loads(greeting_raw)
        assert greeting_data["sender"] == "ai"
        assert "MindBridge Guide" in greeting_data["text"] or "safe" in greeting_data["text"].lower()
        assert greeting_data["risk_level"] == "green"

        # 2. Send student message
        user_msg = "I've been feeling really overwhelmed by my exams and assignments lately."
        ws.send_text(json.dumps({"text": user_msg, "language": "en-IN"}))

        # 3. Receive AI response
        reply_raw = ws.receive_text()
        reply_data = json.loads(reply_raw)
        assert reply_data["sender"] == "ai"
        assert len(reply_data["text"]) > 10
        assert "risk_level" in reply_data
        assert "risk_score" in reply_data
        assert reply_data["risk_level"] in ("green", "yellow", "orange", "red")

    # 4. Verify chat history via REST API
    res_hist = client.get(
        "/api/chat/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_hist.status_code == 200
    history = res_hist.json()
    assert len(history) >= 3  # greeting, user message, ai response
    senders = [m["sender"] for m in history]
    assert "user" in senders
    assert "ai" in senders
