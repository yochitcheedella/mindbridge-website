from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.user import Student
from app.models.mood import MoodLog
from app.api.risk import get_campus_analytics
import json

# Create an independent in-memory SQLite database for test isolation
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. Create mock students across different departments
    s1 = Student(anonymous_token="a1", department="Computer Science", risk_score=0.8, burnout_probability=0.4)
    s2 = Student(anonymous_token="a2", department="Computer Science", risk_score=0.2, burnout_probability=0.1)
    s3 = Student(anonymous_token="a3", department="Medicine", risk_score=0.9, burnout_probability=0.7)
    s4 = Student(anonymous_token="a4", department="Engineering", risk_score=0.4, burnout_probability=0.2)
    s5 = Student(anonymous_token="a5", department="Engineering", risk_score=0.6, burnout_probability=0.3)
    
    db.add_all([s1, s2, s3, s4, s5])
    db.commit()
    
    # 2. Call the analytics function
    res = get_campus_analytics(db)
    
    # Print output
    print(json.dumps(res, indent=2))
    
    # Verify results
    assert len(res["department_data"]) == 3, f"Should have 3 departments, got {len(res['department_data'])}"
    assert res["department_data"][0]["name"] == "Medicine", "Medicine should have highest stress score"
    assert res["department_data"][0]["stress"] == 90
    assert res["total_students"] == 5
    
    db.close()
    print("TEST PASSED: Admin analytics successfully returns dynamic campus wellbeing & department data!")

if __name__ == "__main__":
    test()
