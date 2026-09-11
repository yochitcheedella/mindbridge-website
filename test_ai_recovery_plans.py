import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.models.user import Student
from app.models.plan import AIFollowUpPlan, AIFollowUpTask

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

def test_ai_recovery_plan_and_task_completion():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        # 1. Register and authenticate a student
        reg_res = client.post("/api/auth/register", json={
            "name": "Meera VIT Student",
            "phone": "+919877665544",
            "alias": "Lavender #606",
            "email": "meera@vishnu.edu.in",
            "password": "SecurePassword123!",
            "department": "EEE",
            "year": 1
        })
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Verify no active recovery plans initially
        active_res_1 = client.get("/api/plans/active", headers=headers)
        assert active_res_1.status_code == 200
        assert active_res_1.json() is None

        # 3. Request AI Recovery Plan Generation
        gen_res = client.post("/api/plans/generate", headers=headers)
        assert gen_res.status_code == 200, f"Plan generation failed: {gen_res.text}"
        plan_data = gen_res.json()
        assert plan_data["status"] == "active"
        assert len(plan_data["tasks"]) > 0, "AI failed to generate daily action items!"
        print(f"[PASS] AI Recovery Plan generated: '{plan_data['title']}' with {len(plan_data['tasks'])} action tasks.")

        # 4. Fetch Active Plan via GET /api/plans/active
        active_res_2 = client.get("/api/plans/active", headers=headers)
        assert active_res_2.status_code == 200
        active_data = active_res_2.json()
        assert active_data["id"] == plan_data["id"]
        assert active_data["status"] == "active"

        # 5. Complete each daily action item sequentially
        tasks = active_data["tasks"]
        for i, t in enumerate(tasks):
            t_id = t["id"]
            comp_res = client.post(f"/api/plans/tasks/{t_id}/complete", headers=headers)
            assert comp_res.status_code == 200, f"Task completion failed: {comp_res.text}"
            comp_data = comp_res.json()
            assert comp_data["task_completed"] is True
            
            # If it's the very last task, the entire plan should transition to 'completed'
            if i == len(tasks) - 1:
                assert comp_data["plan_status"] == "completed"
                print("[PASS] All tasks checked off; recovery plan status transitioned automatically to 'completed'!")
            else:
                assert comp_data["plan_status"] == "active"

        print("\nTEST PASSED: AI-generated personalized recovery plans and daily task habit tracking verified!")
    finally:
        app.dependency_overrides.clear()

if __name__ == "__main__":
    test_ai_recovery_plan_and_task_completion()
