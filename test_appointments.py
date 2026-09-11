import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta
from app.main import app
from app.core.database import get_db
from app.models.base import Base

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

def test_appointment_booking_flow():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        # 1. Register a student
        register_payload = {
            "name": "Karthik VIT Student",
            "phone": "+919876543212",
            "alias": "Jaguar #303",
            "email": "karthik@vishnu.edu.in",
            "password": "SecurePassword123!",
            "department": "IT",
            "year": 4
        }
        reg_res = client.post("/api/auth/register", json=register_payload)
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Check available counseling slots (this also auto-seeds default psychologists)
        slots_res = client.get("/api/appointments/slots")
        assert slots_res.status_code == 200, f"Get slots failed: {slots_res.text}"
        slots = slots_res.json()
        assert len(slots) > 0, "No counseling slots returned!"
        target_slot = slots[0]

        # 3. Book an appointment
        book_payload = {
            "psychologist_id": target_slot["psychologist_id"],
            "slot_time": target_slot["slot_time"],
            "notes": "Discussing semester placement stress."
        }
        book_res = client.post("/api/appointments/book", json=book_payload, headers=headers)
        assert book_res.status_code == 200, f"Booking failed: {book_res.text}"
        appt_data = book_res.json()
        assert appt_data["status"] == "pending"
        print(f"[PASS] Counseling session booked successfully with {target_slot['psychologist_name']}")

        # 4. Verify appointment shows up in student's schedule
        my_res = client.get("/api/appointments/mine", headers=headers)
        assert my_res.status_code == 200
        my_appts = my_res.json()
        assert any(a["id"] == appt_data["id"] for a in my_appts)
        assert my_appts[0]["psychologist_name"] == target_slot["psychologist_name"]

        # 5. Verify institutional master calendar view (/all)
        all_res = client.get("/api/appointments/all")
        assert all_res.status_code == 200
        all_appts = all_res.json()
        assert len(all_appts) >= 1

        print("\nTEST PASSED: Counseling slot retrieval, student session booking, and calendar scheduling verified!")
    finally:
        app.dependency_overrides.clear()

if __name__ == "__main__":
    test_appointment_booking_flow()
