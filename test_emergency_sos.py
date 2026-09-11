import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.models.user import Student
from app.models.audit import AuditLog

# Use an isolated in-memory SQLite database with StaticPool
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

def test_emergency_sos_and_decryption_protocol():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        # 1. Register a student via API
        reg_res = client.post("/api/auth/register", json={
            "name": "Priyanka VIT Student",
            "phone": "+919876543213",
            "alias": "Orchid #404",
            "email": "priyanka@vishnu.edu.in",
            "password": "SecurePassword123!",
            "department": "IT",
            "year": 4
        })
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Verify baseline risk score is low (< 0.8)
        db = TestingSessionLocal()
        student_db = db.query(Student).filter(Student.anonymous_token == "Orchid #404").first()
        assert student_db is not None
        assert student_db.risk_score < 0.8
        db.close()

        # 3. Trigger Emergency SOS
        sos_res = client.post("/api/emergency/sos", headers=headers)
        assert sos_res.status_code == 200, f"SOS call failed: {sos_res.text}"
        assert sos_res.json()["status"] == "success"
        print(f"[PASS] Emergency SOS triggered successfully: {sos_res.json()['message']}")

        # 4. Verify student risk score escalated instantly to 1.0 (Critical)
        db = TestingSessionLocal()
        student_escalated = db.query(Student).filter(Student.anonymous_token == "Orchid #404").first()
        assert student_escalated.risk_score == 1.0
        db.close()

        # 5. Test Unauthorized Identity Decryption Attempt (should block with HTTP 403)
        import urllib.parse
        encoded_alias = urllib.parse.quote("Orchid #404", safe="")
        decrypt_res_unauth = client.post(
            f"/api/emergency/decrypt-identity/{encoded_alias}",
            json={"reason": "Unauthorized check"},
            headers={"x-emergency-auth": "invalid-token"}
        )
        assert decrypt_res_unauth.status_code == 403, "Failed to block unauthorized identity reveal!"

        # 6. Test Authorized Identity Decryption by Emergency Committee
        decrypt_res_auth = client.post(
            f"/api/emergency/decrypt-identity/{encoded_alias}",
            json={"reason": "Severe suicide risk indicated by emergency SOS button broadcast"},
            headers={"x-emergency-auth": "super-secret-committee-token"}
        )
        assert decrypt_res_auth.status_code == 200, f"Authorized decryption failed: {decrypt_res_auth.text}"
        decrypted_data = decrypt_res_auth.json()["identity"]
        assert decrypted_data["name"] == "Priyanka VIT Student"
        assert decrypted_data["phone"] == "+919876543213"
        assert decrypted_data["email"] == "priyanka@vishnu.edu.in"
        print(f"[PASS] Emergency committee successfully decrypted student identity: {decrypted_data['name']}")

        # 7. Test Clinical Psychologist Emergency Identity Reveal Endpoint
        psych_reveal_res = client.post(
            f"/api/psychologist/student/{encoded_alias}/request-identity",
            json={"reason": "Critical score >= 0.8 triggered after SOS alert broadcast"}
        )
        assert psych_reveal_res.status_code == 200, f"Psychologist identity reveal failed: {psych_reveal_res.text}"
        psych_data = psych_reveal_res.json()
        assert psych_data["real_name"] == "Priyanka VIT Student"
        print(f"[PASS] Clinical counseling staff successfully requested emergency identity break for imminent intervention: {psych_data['real_name']}")

        # 8. Verify Immutable Audit Log Accountability in Database (SRS Section 16)
        db = TestingSessionLocal()
        logs = db.query(AuditLog).all()
        assert len(logs) >= 2, f"Expected at least 2 database AuditLog records for identity reveals, found {len(logs)}"
        actions = [log.action for log in logs]
        assert "IDENTITY_DECRYPTED" in actions, "Committee identity reveal not logged to AuditLog!"
        assert "CLINICAL_IDENTITY_REVEAL" in actions, "Clinical psychologist identity reveal not logged to AuditLog!"
        print(f"[PASS] Permanent Database AuditLog verification passed: {len(logs)} sensitive reveal actions immutably recorded.")
        db.close()

        print("\nTEST PASSED: Emergency SOS dispatch, risk score escalation, identity reveal RBAC, and permanent DB AuditLog protocol verified!")
    finally:
        app.dependency_overrides.clear()

if __name__ == "__main__":
    test_emergency_sos_and_decryption_protocol()
