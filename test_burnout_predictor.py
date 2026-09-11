from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.user import Student
from app.models.habit import Habit
from app.services.risk_engine import calculate_multi_factor_risk
from datetime import date, timedelta
import random
import string

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    random_id = "".join(random.choices(string.ascii_letters, k=8))
    # 1. Create a dummy student in isolated test DB
    student = Student(anonymous_token=f"Test Student {random_id}")
    db.add(student)
    db.commit()
    db.refresh(student)
    
    print(f"Created student {student.anonymous_token} with ID {student.id}")
    
    # Calculate baseline burnout probability
    res1 = calculate_multi_factor_risk(db, student.id)
    print(f"Baseline Burnout Probability: {res1['burnout_probability']}")
    
    # 2. Add habits with 100% completion over the last 7 days
    today = date.today()
    last_7_days = [(today - timedelta(days=i)).isoformat() for i in range(7)]
    
    h1 = Habit(student_id=student.id, habit_id="h1", name="Sleep 8 Hours", category="Health")
    h1.completions = last_7_days
    
    h2 = Habit(student_id=student.id, habit_id="h2", name="Morning Exercise", category="Health")
    h2.completions = last_7_days
    
    db.add(h1)
    db.add(h2)
    db.commit()
    
    # 3. Recalculate burnout probability
    res2 = calculate_multi_factor_risk(db, student.id)
    print(f"Burnout Probability after consistent habit completion: {res2['burnout_probability']}")
    
    assert res2['burnout_probability'] < res1['burnout_probability'], "Burnout probability should decrease with healthy habits!"
    db.close()
    print("TEST PASSED: Habit tracking successfully integrated into Multi-Factor Risk Engine!")

if __name__ == "__main__":
    test()
