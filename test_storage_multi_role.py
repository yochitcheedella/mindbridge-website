import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.core.security import create_access_token

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

def test_storage_multi_role_upload():
    # 0. Initialize test tables and set dependency override inside test function
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        # 1. Register a test student and obtain token
        register_payload = {
            "name": "Bob VIT Student",
            "phone": "+919876543211",
            "alias": "Falcon #202",
            "email": "bob@vishnu.edu.in",
            "password": "SecurePassword123!",
            "department": "AI&DS",
            "year": 2
        }
        reg_res = client.post("/api/auth/register", json=register_payload)
        assert reg_res.status_code == 200, f"Student registration failed: {reg_res.text}"
        student_token = reg_res.json()["access_token"]
        
        # 2. Upload file as Student
        files_student = {"file": ("medical_cert.pdf", b"%PDF-1.4 sample content", "application/pdf")}
        res_student = client.post(
            "/api/storage/upload",
            files=files_student,
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res_student.status_code == 200, f"Student upload failed: {res_student.text}"
        data_student = res_student.json()
        assert data_student["status"] == "success"
        assert len(data_student["url"]) > 0, "Returned file path or public URL is empty!"
        print(f"[PASS] Student file uploaded successfully: {data_student['url']}")
        
        # 3. Test upload as Psychologist (using custom role JWT)
        psych_token = create_access_token(data={"sub": "101", "role": "psychologist"})
        files_psych = {"file": ("counseling_worksheet.png", b"\x89PNG\r\n\x1a\n sample image bytes", "image/png")}
        res_psych = client.post(
            "/api/storage/upload",
            files=files_psych,
            headers={"Authorization": f"Bearer {psych_token}"}
        )
        assert res_psych.status_code == 200, f"Psychologist upload failed: {res_psych.text}"
        data_psych = res_psych.json()
        assert data_psych["status"] == "success"
        assert "psychologist_101/" in data_psych["url"] or data_psych["url"].startswith("http")
        print(f"[PASS] Psychologist file uploaded successfully: {data_psych['url']}")
        
        # 4. Test upload as Campus Admin (using custom role JWT)
        admin_token = create_access_token(data={"sub": "1", "role": "admin"})
        files_admin = {"file": ("campus_announcement.txt", b"VIT Annual Wellbeing Seminar Agenda", "text/plain")}
        res_admin = client.post(
            "/api/storage/upload",
            files=files_admin,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_admin.status_code == 200, f"Admin upload failed: {res_admin.text}"
        data_admin = res_admin.json()
        assert data_admin["status"] == "success"
        print(f"[PASS] Admin file uploaded successfully: {data_admin['url']}")

        print("\nTEST PASSED: Multi-role Supabase / local fallback storage upload verified across Student, Psychologist, and Admin profiles!")
    finally:
        app.dependency_overrides.clear()

if __name__ == "__main__":
    test_storage_multi_role_upload()
