import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.user import Student
from app.api.risk import get_risk_queue

# Create an independent in-memory SQLite database for test isolation
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_risk_queue_triage_ordering():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. Create students with varying risk scores, including newly registered students with score 0.0
    s1 = Student(anonymous_token="Alias-High-001", department="CSE", year=3, risk_score=0.89)
    s2 = Student(anonymous_token="Alias-New-002", department="AI&ML", year=1, risk_score=0.00)  # New student
    s3 = Student(anonymous_token="Alias-Mod-003", department="ECE", year=2, risk_score=0.45)
    s4 = Student(anonymous_token="Alias-Crit-004", department="CIVIL", year=4, risk_score=0.95)
    s5 = Student(anonymous_token="Alias-Low-005", department="EEE", year=3, risk_score=0.15)
    
    db.add_all([s1, s2, s3, s4, s5])
    db.commit()
    
    # 2. Call the clinical triage queue function
    queue = get_risk_queue(db)
    
    # 3. Verify results and order
    assert len(queue) == 5, f"All 5 students should appear in triage queue (including risk_score=0.0), got {len(queue)}"
    
    # Check descending sort order by risk score
    scores = [item["risk_score"] for item in queue]
    assert scores == [0.95, 0.89, 0.45, 0.15, 0.0], f"Queue is not ordered correctly by descending risk score: {scores}"
    assert queue[0]["anonymous_id"] == "Alias-Crit-004", "Highest risk student should be first"
    assert queue[4]["anonymous_id"] == "Alias-New-002", "New 0.0 score student should appear last for baseline review"
    
    db.close()
    print("\nTEST PASSED: Clinical triage risk queue correctly returns all registered students sorted from highest risk to lowest!")

if __name__ == "__main__":
    test_risk_queue_triage_ordering()
