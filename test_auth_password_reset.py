import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.models.user import Student
from app.models.psychologist import Psychologist
from app.models.admin import VITAdmin
from app.core.security import hash_password

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

def test_multi_role_password_reset():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        # 1. Seed a Psychologist and Admin in the in-memory test DB
        db = TestingSessionLocal()
        psych = Psychologist(
            email="counselor@vishnu.edu.in",
            name="Dr. Anita VIT",
            specialization="Stress Management",
            password_hash=hash_password("OldPsychPassword!"),
            is_active=True
        )
        admin = VITAdmin(
            email="superadmin@vishnu.edu.in",
            name="Principal Admin",
            password_hash=hash_password("OldAdminPassword!"),
            is_active=True
        )
        db.add(psych)
        db.add(admin)
        db.commit()
        db.close()

        # 2. Register a Student via API
        reg_res = client.post("/api/auth/register", json={
            "name": "Arun VIT Student",
            "phone": "+919811223344",
            "alias": "Falcon #505",
            "email": "arun@vishnu.edu.in",
            "password": "OldStudentPassword!",
            "department": "CSE",
            "year": 2
        })
        assert reg_res.status_code == 200, f"Student registration failed: {reg_res.text}"

        # 3. Test Forgot Password initiation
        forgot_res = client.post("/api/auth/forgot-password", json={"email": "arun@vishnu.edu.in"})
        assert forgot_res.status_code == 200
        assert "OTP has been sent" in forgot_res.json()["message"]

        # 4. Test Student Password Reset & Login with New Password
        reset_stud = client.post("/api/auth/reset-password", json={
            "email": "arun@vishnu.edu.in",
            "otp": "123456",
            "new_password": "NewSecureStudentPassword2026!"
        })
        assert reset_stud.status_code == 200, f"Student password reset failed: {reset_stud.text}"
        
        login_stud = client.post("/api/auth/login", json={
            "email": "arun@vishnu.edu.in",
            "password": "NewSecureStudentPassword2026!",
            "role": "student"
        })
        assert login_stud.status_code == 200, "Student failed to login with reset password!"
        print("[PASS] Student password reset verified.")

        # 5. Test Psychologist Password Reset & Login with New Password
        reset_psych = client.post("/api/auth/reset-password", json={
            "email": "counselor@vishnu.edu.in",
            "otp": "123456",
            "new_password": "NewSecurePsychPassword2026!"
        })
        assert reset_psych.status_code == 200, f"Psychologist password reset failed: {reset_psych.text}"

        login_psych = client.post("/api/auth/login", json={
            "email": "counselor@vishnu.edu.in",
            "password": "NewSecurePsychPassword2026!",
            "role": "psychologist"
        })
        assert login_psych.status_code == 200, "Psychologist failed to login with reset password!"
        print("[PASS] Psychologist password reset verified.")

        # 6. Test Admin Password Reset & Login with New Password
        reset_admin = client.post("/api/auth/reset-password", json={
            "email": "superadmin@vishnu.edu.in",
            "otp": "123456",
            "new_password": "NewSecureAdminPassword2026!"
        })
        assert reset_admin.status_code == 200, f"Admin password reset failed: {reset_admin.text}"

        login_admin = client.post("/api/auth/login", json={
            "email": "superadmin@vishnu.edu.in",
            "password": "NewSecureAdminPassword2026!",
            "role": "admin"
        })
        assert login_admin.status_code == 200, "Admin failed to login with reset password!"
        print("[PASS] Admin password reset verified.")

        # 7. Test Invalid OTP check
        invalid_otp_res = client.post("/api/auth/reset-password", json={
            "email": "arun@vishnu.edu.in",
            "otp": "999999",
            "new_password": "HackerAttemptPassword123!"
        })
        assert invalid_otp_res.status_code == 400
        assert "Invalid OTP" in invalid_otp_res.json()["detail"]

        print("\nTEST PASSED: Unified multi-role OTP password reset verified across Student, Psychologist, and Admin levels!")
    finally:
        app.dependency_overrides.clear()

if __name__ == "__main__":
    test_multi_role_password_reset()
