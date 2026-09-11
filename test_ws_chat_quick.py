import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import Student
from app.core.security import hash_password, create_access_token

client = TestClient(app)
def test_ws_chat_quick():
    db = SessionLocal()
    student = db.query(Student).filter_by(email_hash='student@vishnu.edu.in').first()
    db.close()

    assert student is not None, "Demo student should exist"
    token = create_access_token({"sub": str(student.id), "role": "student"})

    with client.websocket_connect(f"/api/chat/ws?token={token}") as ws:
        greeting_raw = ws.receive_text()
        greeting = json.loads(greeting_raw)
        assert greeting["sender"] == "ai", f"Expected 'ai', got {greeting['sender']}"
        assert greeting["risk_level"] == "green", f"Expected 'green', got {greeting['risk_level']}"

        ws.send_text(json.dumps({"text": "I am anxious about my final exams and feel like giving up.", "language": "en-IN"}))
        reply_raw = ws.receive_text()
        reply = json.loads(reply_raw)
        assert reply["sender"] == "ai"
        assert "risk_level" in reply

    # Also verify REST fallback endpoint
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    rest_resp = client.post(
        "/api/chat/message",
        json={"message": "Help me with time management techniques.", "language": "en-IN"},
        headers=headers
    )
    assert rest_resp.status_code == 200
    rest_data = rest_resp.json()
    assert rest_data["sender"] == "ai"
    assert "risk_level" in rest_data

