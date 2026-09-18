import pytest
import re
from urllib.parse import quote
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.models.base import Base

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

def clean_phone_number(phone: str) -> str:
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        digits = f"91{digits}"
    elif len(digits) == 11 and digits.startswith("0"):
        digits = f"91{digits[1:]}"
    elif len(digits) == 13 and digits.startswith("910"):
        digits = f"91{digits[3:]}"
    elif len(digits) == 12 and digits.startswith("91"):
        return digits
    return digits

def get_whatsapp_url(phone: str, message: str) -> str:
    cleaned = clean_phone_number(phone)
    encoded = quote(message)
    if not cleaned or len(cleaned) < 10:
        return f"https://api.whatsapp.com/send?text={encoded}"
    return f"https://api.whatsapp.com/send?phone={cleaned}&text={encoded}"

def test_whatsapp_phone_cleaning_and_urls():
    """Verify telephone standardization for various Indian formats."""
    # 10-digit number
    assert clean_phone_number("9100972237") == "919100972237"
    # Formatted with spaces and +91
    assert clean_phone_number("+91 91009 72237") == "919100972237"
    # Starting with 0
    assert clean_phone_number("09100972237") == "919100972237"
    # With 910 extra zero
    assert clean_phone_number("+91 09100972237") == "919100972237"
    # Empty
    assert clean_phone_number("") == ""

    # URL generation with valid phone
    url1 = get_whatsapp_url("9100972237", "Test Msg")
    assert url1 == "https://api.whatsapp.com/send?phone=919100972237&text=Test%20Msg"

    # URL generation with empty phone (universal share link fallback)
    url2 = get_whatsapp_url("", "Test Msg")
    assert url2 == "https://api.whatsapp.com/send?text=Test%20Msg"
    assert "phone=" not in url2

def test_whatsapp_backend_booking_contract():
    """Verify backend returns official WhatsApp dispatcher phone 9100972237."""
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        # Register student
        reg = client.post("/api/auth/register", json={
            "name": "Ananya VIT Student",
            "phone": "+919876543211",
            "alias": "Courageous Dolphin",
            "email": "ananya.wa@vishnu.edu.in",
            "password": "Password123!",
            "department": "CSE",
            "year": 3
        })
        assert reg.status_code == 200
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch slots
        slots = client.get("/api/appointments/slots").json()
        assert len(slots) > 0
        slot = slots[0]

        # Book appointment
        booking = client.post("/api/appointments/book", json={
            "psychologist_id": slot["psychologist_id"],
            "slot_time": slot["slot_time"],
            "notes": "Academic workload anxiety"
        }, headers=headers)
        assert booking.status_code == 200
        data = booking.json()

        # Check official WhatsApp dispatcher helpline
        assert data.get("whatsapp_dispatcher") == "9100972237"
        assert data.get("whatsapp_reminder_status") == "dispatched"
        assert data.get("status") == "pending"
    finally:
        app.dependency_overrides.clear()
