import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import date, datetime
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

def test_digital_diary_multiple_entries_flow():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        # 1. Register a student for testing
        register_payload = {
            "name": "Multi Diary Student",
            "phone": "+919876543277",
            "alias": "Falcon #202",
            "email": "multi_diary@vishnu.edu.in",
            "password": "SecurePassword123!",
            "department": "IT",
            "year": 2
        }
        reg_res = client.post("/api/auth/register", json=register_payload)
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        target_date = "2026-09-01"
        month_str = "2026-09"

        # 2. Initially empty
        date_res = client.get(f"/api/journal/date/{target_date}", headers=headers)
        assert date_res.status_code == 200
        assert date_res.json()["has_entry"] is False
        assert len(date_res.json()["entries"]) == 0

        # 3. Add First Entry (Morning reflection)
        entry1_payload = {
            "entry_date": target_date,
            "content": "Morning reflection: Ready for the machine learning lab.",
            "mood": "5",
            "mood_tag": "academic",
            "is_shared_with_counselor": False
        }
        create1 = client.post("/api/journal/entry", json=entry1_payload, headers=headers)
        assert create1.status_code == 200
        entry1_id = create1.json()["id"]

        # 4. Add Second Entry on the SAME date (Evening reflection)
        entry2_payload = {
            "entry_date": target_date,
            "content": "Evening reflection: Great discussion with professor about final year project.",
            "mood": "4",
            "mood_tag": "career",
            "is_shared_with_counselor": True
        }
        create2 = client.post("/api/journal/entry", json=entry2_payload, headers=headers)
        assert create2.status_code == 200
        entry2_id = create2.json()["id"]
        assert entry2_id != entry1_id

        # 5. Fetch date: verify BOTH entries are returned
        date_res2 = client.get(f"/api/journal/date/{target_date}", headers=headers)
        assert date_res2.status_code == 200
        data2 = date_res2.json()
        assert data2["has_entry"] is True
        assert data2["count"] == 2
        assert len(data2["entries"]) == 2
        assert data2["entries"][0]["id"] == entry1_id
        assert data2["entries"][1]["id"] == entry2_id

        # 6. Verify calendar aggregation shows entry_count == 2
        cal_res = client.get(f"/api/journal/calendar?month={month_str}", headers=headers)
        assert cal_res.status_code == 200
        cal_days = cal_res.json()["days"]
        target_day = next((d for d in cal_days if d["date"] == target_date), None)
        assert target_day is not None
        assert target_day["entry_count"] == 2
        assert target_day["has_entry"] is True

        # 7. Edit specific entry 1 by ID
        update_payload = {
            "id": entry1_id,
            "entry_date": target_date,
            "content": "Morning reflection updated: ML lab went smoothly.",
            "mood": "5",
            "mood_tag": "academic",
            "is_shared_with_counselor": False
        }
        update_res = client.post("/api/journal/entry", json=update_payload, headers=headers)
        assert update_res.status_code == 200
        assert update_res.json()["id"] == entry1_id
        assert update_res.json()["content"] == update_payload["content"]

        # 8. Delete entry 1 by ID
        del_single = client.delete(f"/api/journal/entry/{entry1_id}", headers=headers)
        assert del_single.status_code == 200

        # Verify only entry 2 remains
        date_res3 = client.get(f"/api/journal/date/{target_date}", headers=headers)
        assert date_res3.status_code == 200
        assert date_res3.json()["count"] == 1
        assert date_res3.json()["entries"][0]["id"] == entry2_id

        # 9. Delete by date (cleans up remaining entry)
        del_date = client.delete(f"/api/journal/date/{target_date}", headers=headers)
        assert del_date.status_code == 200

        # Verify 0 entries left
        date_res4 = client.get(f"/api/journal/date/{target_date}", headers=headers)
        assert date_res4.status_code == 200
        assert date_res4.json()["has_entry"] is False
        assert len(date_res4.json()["entries"]) == 0

    finally:
        app.dependency_overrides.clear()
