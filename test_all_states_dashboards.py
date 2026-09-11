"""
Comprehensive Test Suite for MindBridge AI
Tests every state, role, and dashboard:
1. Student Dashboard & all Student states (Auth, Consent, Mood, Journal, Habits, Sleep, CBT, Assessments, Appointments, Community, SOS, Audio Call token)
2. Psychologist Dashboard & Clinical states (Triage Queue, Case View, SOAP Notes, Alerts, Follow-ups, Identity Reveal Audit)
3. Admin Dashboard & Governance states (Campus Analytics, Psychologist Management, Audit Trail, Reports Export)
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import json

from app.main import app
from app.core.database import SessionLocal
from app.models.user import Student
from app.models.psychologist import Psychologist
from app.models.admin import VITAdmin
from app.models.appointment import Appointment

client = TestClient(app)


def test_health_check():
    """Verify backend system health and API readiness."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "student" in data["user_levels"]
    assert "psychologist" in data["user_levels"]
    assert "admin" in data["user_levels"]


def test_student_complete_dashboard_and_features():
    """Verify all Student states and dashboard workflows."""
    ts = int(datetime.utcnow().timestamp())
    email = f"student_{ts}@vishnu.edu.in"
    password = "Password@123"

    # 1. Registration
    reg_res = client.post("/api/auth/register", json={
        "name": f"Student {ts}",
        "phone": "9876543210",
        "alias": f"Emerald Heron #{ts % 10000}",
        "email": email,
        "password": password,
        "department": "Information Technology",
        "year": 3
    })
    assert reg_res.status_code in (200, 201), reg_res.text
    reg_data = reg_res.json()
    student_token = reg_data["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    student_alias = reg_data.get("anonymous_alias")
    assert student_alias is not None

    # 2. Login verification
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    assert login_res.json()["role"] == "student"

    # 3. Consent check and update
    consent_status_res = client.get("/api/auth/consent/status", headers=student_headers)
    assert consent_status_res.status_code == 200
    
    consent_post_res = client.post("/api/auth/consent", headers=student_headers, json={
        "policy_version": "v1.0-vishnu",
        "accepted_privacy": True,
        "accepted_anonymous_policy": True,
        "accepted_crisis_terms": True
    })
    assert consent_post_res.status_code == 200

    # 4. Profile settings read & update
    profile_res = client.get("/api/auth/profile", headers=student_headers)
    assert profile_res.status_code == 200

    update_profile_res = client.put("/api/auth/profile", headers=student_headers, json={
        "department": "Information Technology",
        "year": 4
    })
    assert update_profile_res.status_code in (200, 204)

    # 5. Mood tracking state
    mood_log_res = client.post("/api/mood/log", headers=student_headers, json={
        "score": 4,
        "note": "Feeling calm after algorithm class"
    })
    assert mood_log_res.status_code in (200, 201)

    today_mood_res = client.get("/api/mood/today", headers=student_headers)
    assert today_mood_res.status_code == 200
    assert today_mood_res.json().get("score") == 4

    history_mood_res = client.get("/api/mood/history", headers=student_headers)
    assert history_mood_res.status_code == 200
    assert len(history_mood_res.json()) >= 1

    # 6. Digital Diary / Journal state
    journal_create_res = client.post("/api/journal", headers=student_headers, json={
        "title": "Semester Preparation Reflections",
        "content": "Practiced dynamic programming and stayed mindful during deadlines.",
        "mood_tag": "Focused",
        "is_shared_with_counselor": False
    })
    assert journal_create_res.status_code in (200, 201), journal_create_res.text
    entry_id = journal_create_res.json()["id"]

    # Read journal list
    journal_list_res = client.get("/api/journal", headers=student_headers)
    assert journal_list_res.status_code == 200
    entries = journal_list_res.json()
    assert any(e["id"] == entry_id for e in entries)

    # Share journal entry with counselor
    share_res = client.patch(f"/api/journal/{entry_id}/share", headers=student_headers, json={
        "is_shared": True
    })
    assert share_res.status_code == 200

    # 7. Habit tracker state
    habits_payload = [{
        "id": "walk_sunlight",
        "name": "15 Min Campus Sunlight Walk",
        "emoji": "☀️",
        "category": "Mindfulness",
        "streak": 1,
        "completions": [datetime.utcnow().strftime("%Y-%m-%d")]
    }]
    habit_sync_res = client.post("/api/habits", headers=student_headers, json=habits_payload)
    assert habit_sync_res.status_code == 200

    habits_list_res = client.get("/api/habits", headers=student_headers)
    assert habits_list_res.status_code == 200
    assert len(habits_list_res.json()) >= 1

    # 8. Sleep tracker state
    sleep_log_res = client.post("/api/sleep", headers=student_headers, json={
        "hours": 7.5,
        "quality": "Good",
        "notes": "Fell asleep with 4-7-8 breathwork"
    })
    assert sleep_log_res.status_code in (200, 201)

    sleep_list_res = client.get("/api/sleep", headers=student_headers)
    assert sleep_list_res.status_code == 200
    assert len(sleep_list_res.json()) >= 1

    # 9. Clinical Self-Assessments (PHQ-9, GAD-7)
    phq9_res = client.post("/api/clinical/assessment", headers=student_headers, json={
        "assessment_type": "PHQ-9",
        "score": 4,
        "severity": "Minimal depression",
        "responses": {"q1": 1, "q2": 1, "q3": 0, "q4": 1, "q5": 0, "q6": 0, "q7": 1, "q8": 0, "q9": 0}
    })
    assert phq9_res.status_code in (200, 201)

    assessments_history = client.get("/api/clinical/assessments", headers=student_headers)
    assert assessments_history.status_code == 200
    assert len(assessments_history.json()) >= 1

    # 10. AI Chat Companion
    chat_res = client.post("/api/chat/message", headers=student_headers, json={
        "message": "I have been experiencing mild exam anxiety before my database finals."
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "response" in chat_data or "reply" in chat_data

    # 11. AI Recovery & Follow-up Plan
    plan_res = client.get("/api/plan", headers=student_headers)
    assert plan_res.status_code == 200

    # 12. Appointment Booking & Anonymous Audio Call Token
    slots_res = client.get("/api/appointments/slots", headers=student_headers)
    assert slots_res.status_code == 200
    slots = slots_res.json()
    assert len(slots) > 0
    slot_to_book = slots[0]

    book_res = client.post("/api/appointments/book", headers=student_headers, json={
        "psychologist_id": slot_to_book["psychologist_id"],
        "slot_time": slot_to_book["slot_time"],
        "notes": "Discussing semester academic pacing"
    })
    assert book_res.status_code in (200, 201)
    appt_id = book_res.json()["id"]

    my_appts_res = client.get("/api/appointments/mine", headers=student_headers)
    assert my_appts_res.status_code == 200
    assert any(a["id"] == appt_id for a in my_appts_res.json())

    # Call token generation for student
    call_token_res = client.post(f"/api/appointments/{appt_id}/call-token", headers=student_headers)
    assert call_token_res.status_code == 200
    assert "call_token" in call_token_res.json()

    # 13. Anonymous Community Forum
    post_create_res = client.post("/api/community/posts", headers=student_headers, json={
        "title": "Study Group for Machine Learning at VIT Central Library",
        "content": "Looking for fellow students to form a distraction-free evening revision group."
    })
    assert post_create_res.status_code in (200, 201)
    comm_post_id = post_create_res.json()["id"]

    posts_res = client.get("/api/community/posts", headers=student_headers)
    assert posts_res.status_code == 200
    assert any(p["id"] == comm_post_id for p in posts_res.json())

    upvote_res = client.post(f"/api/community/posts/{comm_post_id}/upvote", headers=student_headers)
    assert upvote_res.status_code == 200

    reply_res = client.post(f"/api/community/posts/{comm_post_id}/replies", headers=student_headers, json={
        "content": "Count me in! I will join around 6 PM."
    })
    assert reply_res.status_code in (200, 201)

    # 14. Emergency Response & SOS
    contacts_res = client.get("/api/emergency/contacts", headers=student_headers)
    assert contacts_res.status_code == 200
    assert len(contacts_res.json()) >= 1

    sos_res = client.post("/api/emergency/trigger", headers=student_headers, json={
        "latitude": 16.5449,
        "longitude": 81.5212,
        "message": "Automated verification test of student crisis safeguard"
    })
    assert sos_res.status_code in (200, 201)

    # 15. Privacy Personal Data Export
    export_res = client.get("/api/privacy/export", headers=student_headers)
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert "profile" in export_data
    assert "mood_logs" in export_data
    assert "sleep_logs" in export_data
    assert "journals" in export_data

    # 16. Privacy Account Deletion (Right to be Forgotten)
    delete_res = client.delete("/api/privacy/account", headers=student_headers)
    assert delete_res.status_code == 200
    assert delete_res.json()["status"] == "success"

    # Confirm login is no longer possible after account deletion
    deleted_login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert deleted_login_res.status_code in (400, 401)


def test_psychologist_dashboard_and_clinical_features():
    """Verify all Psychologist states and clinical triage workflows."""
    # 1. Psychologist Login using seeded credentials
    login_res = client.post("/api/auth/login", json={
        "email": "dr.sarah.mehta@vishnu.edu.in",
        "password": "Psych@VIT2024"
    })
    assert login_res.status_code == 200, login_res.text
    psych_token = login_res.json()["access_token"]
    psych_headers = {"Authorization": f"Bearer {psych_token}"}
    assert login_res.json()["role"] == "psychologist"

    # 2. Risk Triage Queue
    queue_res = client.get("/api/risk/queue", headers=psych_headers)
    assert queue_res.status_code == 200
    queue_data = queue_res.json()
    assert isinstance(queue_data, list)

    # 3. Active Risk Alerts
    alerts_res = client.get("/api/risk/alerts", headers=psych_headers)
    assert alerts_res.status_code == 200

    # 4. Multi-Signal Risk Engine Evaluation
    eval_res = client.post("/api/risk/evaluate", headers=psych_headers, json={
        "user_message": "I am feeling quite stressed about placements but trying my best to stay grounded.",
        "self_assessment_score": 5.0
    })
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert "risk_score" in eval_data
    assert "risk_level" in eval_data

    # 5. Psychologist Appointments View
    psych_id = login_res.json().get("psychologist_id")
    appts_res = client.get("/api/appointments/psychologist", headers=psych_headers)
    assert appts_res.status_code == 200
    psych_appts = appts_res.json()
    assert isinstance(psych_appts, list)

    db = SessionLocal()
    student = db.query(Student).first()
    target_appt = db.query(Appointment).filter(Appointment.psychologist_id == psych_id).first()
    if not target_appt and student:
        target_appt = Appointment(
            student_id=student.id,
            psychologist_id=psych_id,
            slot_time=datetime.utcnow() + timedelta(days=1),
            status="confirmed",
            notes="Clinical test session"
        )
        db.add(target_appt)
        db.commit()
        db.refresh(target_appt)
    appt_id = target_appt.id if target_appt else (psych_appts[0]["id"] if psych_appts else None)
    db.close()

    if appt_id:
        status_update = client.put(f"/api/appointments/{appt_id}/status", headers=psych_headers, json={
            "status": "confirmed"
        })
        assert status_update.status_code == 200

        # Psychologist joins call - generate audio token
        call_tok_res = client.post(f"/api/appointments/{appt_id}/call-token", headers=psych_headers)
        assert call_tok_res.status_code == 200
        assert "call_token" in call_tok_res.json()

    # 6. Patient Case View without PII
    if len(queue_data) > 0:
        from urllib.parse import quote
        target_alias = queue_data[0]["anonymous_id"]
        target_enc = quote(target_alias, safe='')
        case_res = client.get(f"/api/psychologist/student/{target_enc}", headers=psych_headers)
        assert case_res.status_code == 200
        case_data = case_res.json()
        assert "email" not in case_data  # PII isolation verification
        assert "real_name" not in case_data

        # Add clinical case note
        note_res = client.post(f"/api/psychologist/student/{target_enc}/notes", headers=psych_headers, json={
            "content": "Conducted supportive check-in. Student demonstrates good insight."
        })
        assert note_res.status_code in (200, 201)

    # 7. Clinical SOAP Notes Records
    db = SessionLocal()
    student = db.query(Student).first()
    student_alias = student.anonymous_token if student else "Student #4821"
    db.close()

    soap_create_res = client.post("/api/clinical/soap", headers=psych_headers, json={
        "student_alias": student_alias,
        "risk_level": "Moderate",
        "subjective": "Student reports mild sleep disruption during project submission week.",
        "objective": "Alert, cooperative, speech normal rate and rhythm.",
        "assessment": "Adjustment reaction with mild academic anxiety.",
        "plan": "Introduce box breathing protocol, follow up in one week."
    })
    assert soap_create_res.status_code in (200, 201)

    soap_get_res = client.get("/api/clinical/soap", headers=psych_headers)
    assert soap_get_res.status_code == 200


def test_admin_dashboard_and_governance_features():
    """Verify all Admin states and institutional analytics workflows."""
    # 1. Admin Login using seeded credentials
    login_res = client.post("/api/auth/login", json={
        "email": "admin@vishnu.edu.in",
        "password": "Admin@VIT2024"
    })
    assert login_res.status_code == 200, login_res.text
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    assert login_res.json()["role"] == "admin"

    # 2. Campus Wellbeing Analytics
    analytics_res = client.get("/api/admin/analytics", headers=admin_headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert "total_students" in analytics_data
    assert "average_risk_score" in analytics_data
    assert "campus_wellbeing_percent" in analytics_data
    assert "department_data" in analytics_data

    # 3. Psychologist Management
    psych_list_res = client.get("/api/admin/psychologists", headers=admin_headers)
    assert psych_list_res.status_code == 200
    psychs = psych_list_res.json()
    assert len(psychs) >= 1

    # Add new psychologist
    ts = int(datetime.utcnow().timestamp())
    new_psych_email = f"counselor_{ts}@vishnu.edu.in"
    add_psych_res = client.post("/api/admin/psychologists", headers=admin_headers, json={
        "name": f"Dr. Counselor {ts}",
        "specialization": "Cognitive Behavioral Therapy & Trauma Care",
        "email": new_psych_email,
        "password": "Counselor@123"
    })
    assert add_psych_res.status_code in (200, 201)
    new_psych_id = add_psych_res.json()["id"]

    # Toggle status
    toggle_res = client.put(f"/api/admin/psychologists/{new_psych_id}", headers=admin_headers, json={
        "is_active": False
    })
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # 4. Institutional Audit Logs (Privacy & Security Verification)
    audit_res = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert isinstance(logs, list)

    # 5. Institutional Wellbeing Report Export
    report_res = client.get("/api/admin/reports/wellbeing", headers=admin_headers)
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert "report_title" in report_data
    assert "department_breakdown" in report_data
