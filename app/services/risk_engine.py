from sqlalchemy.orm import Session
from app.models.user import Student
from app.models.chat import ChatMessage
from app.models.mood import MoodLog
from app.models.journal import JournalEntry
from app.models.habit import Habit
from app.models.sleep import SleepLog
from datetime import datetime, timedelta, date

def calculate_multi_factor_risk(db: Session, student_id: int):
    """
    Calculates a multi-factor risk score and burnout probability.
    Factors:
    - Chat Risk (40%)
    - Mood Average (20%)
    - Journal Sentiment (20%)
    - Historical Baseline (20%)
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # 1. Chat Risk (Recent messages)
    recent_chats = db.query(ChatMessage).filter(
        ChatMessage.student_id == student_id,
        ChatMessage.sender == "user",
        ChatMessage.timestamp >= thirty_days_ago
    ).order_by(ChatMessage.timestamp.desc()).limit(20).all()
    
    chat_risk = 0.0
    if recent_chats:
        # Assuming sentiment_score is now used as risk_score for AI responses
        # Let's see if we have recent AI risk scores
        recent_ai_msgs = db.query(ChatMessage).filter(
            ChatMessage.student_id == student_id,
            ChatMessage.sender == "ai",
            ChatMessage.timestamp >= thirty_days_ago
        ).order_by(ChatMessage.timestamp.desc()).limit(5).all()
        
        if recent_ai_msgs:
            # Avg risk of recent interactions
            chat_risk = sum(msg.sentiment_score for msg in recent_ai_msgs if msg.sentiment_score) / len(recent_ai_msgs)
    
    # 2. Mood Average
    recent_moods = db.query(MoodLog).filter(
        MoodLog.student_id == student_id,
        MoodLog.created_at >= thirty_days_ago
    ).order_by(MoodLog.created_at.desc()).limit(14).all()
    
    mood_risk = 0.0
    if recent_moods:
        # Score 1 = Very Low (High Risk = 1.0), Score 5 = Excellent (Low Risk = 0.0)
        mood_sum = sum((5 - m.score) / 4.0 for m in recent_moods)
        mood_risk = mood_sum / len(recent_moods)
        
    # 3. Journal Sentiment
    recent_journals = db.query(JournalEntry).filter(
        JournalEntry.student_id == student_id,
        JournalEntry.created_at >= thirty_days_ago
    ).order_by(JournalEntry.created_at.desc()).limit(5).all()
    
    journal_risk = 0.0
    if recent_journals:
        scores = [getattr(j, 'sentiment_score', 0.0) for j in recent_journals if getattr(j, 'sentiment_score', None) is not None]
        if scores:
            journal_risk = sum((-s + 1) / 2.0 for s in scores) / len(scores)
        
    # 4. Baseline
    # We can use the existing student.risk_score as a rolling baseline
    baseline_risk = student.risk_score if student.risk_score else 0.0
    
    # 5. Habit Completion (Recent 7 days)
    habits = db.query(Habit).filter(Habit.student_id == student_id).all()
    habit_risk = 0.5 # Default neutral risk if no habits
    
    if habits:
        total_possible = len(habits) * 7
        total_completed = 0
        
        today = date.today()
        last_7_days = [(today - timedelta(days=i)).isoformat() for i in range(7)]
        
        for h in habits:
            completions = h.completions
            for d in last_7_days:
                if d in completions:
                    total_completed += 1
                    
        completion_rate = total_completed / total_possible
        # High completion rate -> Low risk. Low completion rate -> High risk.
        habit_risk = 1.0 - completion_rate
    
    # 6. Sleep Quality (Recent 7 days)
    recent_sleeps = db.query(SleepLog).filter(
        SleepLog.student_id == student_id,
        SleepLog.created_at >= thirty_days_ago
    ).order_by(SleepLog.created_at.desc()).limit(7).all()
    
    sleep_risk = 0.5 # Default if no sleep data
    if recent_sleeps:
        # Quality mapping: poor = 1.0 risk, excellent = 0.0 risk
        quality_map = {"poor": 1.0, "fair": 0.6, "good": 0.2, "excellent": 0.0}
        
        total_risk = 0.0
        for s in recent_sleeps:
            q_risk = quality_map.get(s.quality.lower(), 0.5)
            # Hours risk: < 5 hours is high risk, >= 7 is low risk
            h_risk = max(0.0, min(1.0, (7 - s.hours) / 3.0)) # 4h -> 1.0, 7h -> 0.0
            
            # Combine quality and hours risk
            total_risk += (q_risk * 0.5) + (h_risk * 0.5)
            
        sleep_risk = total_risk / len(recent_sleeps)
    
    # 1.5 Explicit Risk Escalation (Self-Harm & Panic)
    critical_keywords = ["kill myself", "suicide", "end it all", "want to die", "self harm", "no reason to live"]
    panic_keywords = ["panic attack", "can't breathe", "heart racing", "freaking out", "overwhelmed"]
    
    explicit_risk_penalty = 0.0
    for chat in recent_chats:
        text_lower = chat.text.lower()
        if any(kw in text_lower for kw in critical_keywords):
            explicit_risk_penalty = 1.0  # Instant critical risk
            break
        if any(kw in text_lower for kw in panic_keywords):
            explicit_risk_penalty = max(explicit_risk_penalty, 0.8) # High risk
            
    # Weighted calculation for general risk
    final_risk = (chat_risk * 0.30) + (mood_risk * 0.20) + (sleep_risk * 0.10) + (journal_risk * 0.15) + (habit_risk * 0.10) + (baseline_risk * 0.15)
    
    # Escalate if explicit keywords were detected
    final_risk = max(final_risk, explicit_risk_penalty)

    
    # Burnout Probability
    # Burnout is heavily tied to low mood, high anxiety/stress (chat risk), persistent negative journal sentiment, abandoning wellness habits, and lack of sleep.
    burnout_prob = (chat_risk * 0.25) + (mood_risk * 0.25) + (sleep_risk * 0.2) + (habit_risk * 0.2) + (journal_risk * 0.1)
    
    # Update Student Record
    student.risk_score = min(max(final_risk, 0.0), 1.0)
    student.burnout_probability = min(max(burnout_prob, 0.0), 1.0)
    
    # Calculate daily wellness score (inverse of burnout/risk mix)
    wellness = int((1.0 - burnout_prob) * 100)
    student.daily_wellness_score = max(min(wellness, 100), 0)
    
    db.commit()
    
    return {
        "risk_score": student.risk_score,
        "burnout_probability": student.burnout_probability,
        "daily_wellness_score": student.daily_wellness_score
    }
