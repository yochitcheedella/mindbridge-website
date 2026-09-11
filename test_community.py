import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.models.base import Base

# Use an isolated in-memory SQLite database with StaticPool to persist across requests in tests
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

def test_create_and_fetch_post():
    # 0. Initialize test tables and set dependency override inside test function
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        # 1. Register a test student to get authentication token
        register_payload = {
            "name": "Alice VIT Student",
            "phone": "+919876543210",
            "alias": "Phoenix #101",
            "email": "alice@vishnu.edu.in",
            "password": "SecurePassword123!",
            "department": "CSE",
            "year": 3
        }
        reg_res = client.post("/api/auth/register", json=register_payload)
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create a community post
        post_res = client.post(
            "/api/community/posts",
            json={"title": "Midterm Stress Support", "content": "How is everyone preparing for the upcoming VIT semester exams?"},
            headers=headers
        )
        assert post_res.status_code == 200, f"Create post failed: {post_res.text}"
        post_id = post_res.json()["id"]
        
        # 3. Fetch posts
        get_res = client.get("/api/community/posts", headers=headers)
        assert get_res.status_code == 200
        posts = get_res.json()
        assert any(p["id"] == post_id for p in posts)
        
        # 4. Upvote post
        upvote_res = client.post(f"/api/community/posts/{post_id}/upvote", headers=headers)
        assert upvote_res.status_code == 200
        assert upvote_res.json()["upvotes"] >= 1
        
        # 5. Add reply to post
        reply_res = client.post(
            f"/api/community/posts/{post_id}/replies",
            json={"content": "Taking short walking breaks around the campus pond helps a lot!"},
            headers=headers
        )
        assert reply_res.status_code == 200
        
        # 6. Fetch single post and verify reply count and strict zero-PII privacy isolation
        single_res = client.get(f"/api/community/posts/{post_id}", headers=headers)
        assert single_res.status_code == 200
        post_data = single_res.json()
        assert len(post_data["replies"]) >= 1
        assert post_data["replies"][0]["content"] == "Taking short walking breaks around the campus pond helps a lot!"
        
        # 7. Assert Zero PII Leakage (SRS Section 15 & 18 Compliance)
        response_str = str(post_data)
        assert "Alice" not in response_str, "CRITICAL PRIVACY VIOLATION: Student real name found in community response!"
        assert "+919876543210" not in response_str, "CRITICAL PRIVACY VIOLATION: Student phone number found in community response!"
        assert "alice@vishnu.edu.in" not in response_str, "CRITICAL PRIVACY VIOLATION: Student email found in community response!"
        print("[PASS] Zero PII Leakage Verified: Forum responses maintain strict peer anonymity.")
        
        print("\n[PASS] TEST PASSED: Student registration, anonymous community posting, upvoting, replying, and privacy isolation verified!")
    finally:
        app.dependency_overrides.clear()

if __name__ == "__main__":
    test_create_and_fetch_post()
