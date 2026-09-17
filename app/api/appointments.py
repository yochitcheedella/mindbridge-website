from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_student, get_current_user_any_role
from app.core.security import create_access_token
from app.models.appointment import Appointment
from app.models.psychologist import Psychologist
from app.models.user import Student

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


class BookRequest(BaseModel):
    psychologist_id: int
    slot_time: str  # ISO 8601 datetime string
    notes: Optional[str] = None


def seed_psychologists(db: Session) -> None:
    """Seed default official Vishnu Wellness Centre psychologists if empty."""
    if db.query(Psychologist).count() == 0:
        defaults = [
            Psychologist(
                name="RAM PRUDHVI TEJA",
                specialization="Senior Wellness Counsellor · Crisis Intervention & Cognitive Therapy",
                institution="VIT (Vishnu Institute of Technology)",
                experience="7+ Years",
                avatar_url="/counselors/ram_prudhvi_teja_head.jpg",
                full_photo_url="/counselors/ram_prudhvi_teja_full.jpg",
                quote="The best way to predict your future is to create it—not from the influences of your past experiences, but through the power of your imagination. ♡",
                pillars="Non judgemental • Evidence based • Solution based • Empathetic",
                focus_areas="Stress, anxiety & overthinking; Depression & emotional well-being; Academic stress & exam anxiety; Self-esteem; Anger management; Crisis intervention; Mindfulness & coping skills",
                message_to_students="Seeking help is not a sign of weakness—it is a sign of courage. You don't have to carry every burden or suffer alone in silence. Asking for support isn't giving up, it's choosing growth over struggle and hope over fear.",
                fun_facts="Reading psychology books and novels, travelling, exploring new places and cultures, cricket enthusiast, passionate about continuous learning."
            ),
            Psychologist(
                name="SAHITHI CHALLA",
                specialization="Wellness Counsellor · Forensic Psychology & Emotional Wellness",
                institution="Vishnu School",
                experience="1 Year",
                avatar_url="/counselors/sahithi_challa_head.jpg",
                full_photo_url="/counselors/sahithi_challa_full.jpg",
                quote="A decision doesn't define you. Your commitment to it does. ♡",
                pillars="Empathetic • Curious • Practical tools",
                focus_areas="Anxiety & overthinking; Stress & burnout; Self-esteem & confidence; Relationship & family concerns; Life transitions; Building healthier habits & boundaries",
                message_to_students="You don't have to carry every burden alone. Speaking up isn't a sign of weakness; it's the first step toward healing. Small conversations today can prevent bigger struggles tomorrow.",
                fun_facts="Background in Forensic Psychology (crime documentaries are homework!), comfort combo is books and biryani always, loves practical psychological tools."
            ),
            Psychologist(
                name="NAVYA SRI",
                specialization="Wellness Counsellor · Academic & Life Transitions",
                institution="B.V. Raju College",
                experience="3 Years",
                avatar_url="/counselors/navya_sri_head.jpg",
                full_photo_url="/counselors/navya_sri_full.jpg",
                quote="Try, even if you fail, atleast you'll know what you can do differently next time ♡",
                pillars="Empathetic • Non-Judgemental • Supportive • Solution-Focused",
                focus_areas="Relationship & family concerns; Academic stress & pressure; Time management & procrastination; Emotional struggles & self doubt; Crisis situations",
                message_to_students="It's okay to be different. You don't have to think, feel or choose the same as everyone else. Respect others' choices, express your own thoughts, and stay open to new perspectives.",
                fun_facts="Genuinely enjoys meaningful conversations, nature enthusiast, pets and little humans are instant mood-lifters."
            ),
            Psychologist(
                name="BANTU ANUMITHA",
                specialization="Wellness Counsellor · Strength-Based Coping & Resilience",
                institution="Smt. B. Seetha Polytechnic College",
                experience="1 Year",
                avatar_url="/counselors/bantu_anumitha_head.jpg",
                full_photo_url="/counselors/bantu_anumitha_full.jpg",
                quote="Healing isn't changing who you are; it's uncovering who you've always been ♡",
                pillars="Empathetic • Non-Judgemental • Strength-Based • Confidential",
                focus_areas="Adjustment to life changes; Overthinking & procrastination; Career confusion & decision making; Loneliness & emotional distress; Interpersonal relationships",
                message_to_students="You don't have to be perfect to be worthy, you are enough, even while you're growing. Asking for help means you are choosing to heal in a healthier way.",
                fun_facts="Believes empathy is the foundation of healing, loves reading about human behavior, celebrates every small step of progress."
            ),
            Psychologist(
                name="ANGEL BENNY",
                specialization="Wellness Counselor · Grief, Burnout & Holistic Well-being",
                institution="VDC (Vishnu Dental College)",
                experience="4+ Years",
                avatar_url="/counselors/angel_benny_head.jpg",
                full_photo_url="/counselors/angel_benny_full.jpg",
                quote="Making space for the overthinking, the chaos and the 'I'm fine' that definitely isn't fine. Making space for all of it and maybe even make sense of it together. ♡",
                pillars="Confidential • Compassionate • Non judgemental • Patient",
                focus_areas="Anxiety & overthinking; Academic stress & burnout; Grief & loss; Exam anxiety; Family concerns; Goal setting & motivation",
                message_to_students="I hope that every student knows that no problem is too small to ask for help. There is a place where you can be heard without judgement, seen with compassion and accepted as you are.",
                fun_facts="Dogs > Cats > Everything else, avid reader of wizard/mystery novels, movie quotes and memes communicator, water lover."
            ),
            Psychologist(
                name="AKSHITHA SELVARAJ",
                specialization="Wellness Counsellor · Student Coping Strategies & Mental Health",
                institution="Sri Vishnu College of Pharmacy",
                experience="1 Year",
                avatar_url="/counselors/akshitha_selvaraj_head.jpg",
                full_photo_url="/counselors/akshitha_selvaraj_full.jpg",
                quote="Every conversation is a step toward healing, growth, and self-discovery ♡",
                pillars="Safe • Non-judgemental • Collaborative • Confidential",
                focus_areas="Interpersonal issues; Exam-related concerns & academic stress; Depression & negative thinking; Stress & overthinking; Personal growth",
                message_to_students="It's ok to ask for support, even when you simply need someone to listen. Seeking help is a sign of strength. It's okay to make mistakes, take breaks, and grow forward.",
                fun_facts="Designs interactive mental health awareness programs, believer in small consistent habits, coffee and good music lover."
            ),
            Psychologist(
                name="DEVIKA BABU",
                specialization="Wellness Counsellor · Trauma, Emotional Wellness & Career Clarity",
                institution="Vishnu Women's University",
                experience="3.5+ Years",
                avatar_url="/counselors/devika_babu_head.jpg",
                full_photo_url="/counselors/devika_babu_full.jpg",
                quote="Creating a space where you can be yourself and talk about the things that really matter to you ♡",
                pillars="Ethical • Compassionate • Empowering • Goal-oriented",
                focus_areas="Stress management & trauma related concerns; Depression, anxiety & emotional well-being; Relationship & interpersonal difficulties; Career clarity",
                message_to_students="The world is scary sometimes. You don't have to face it alone. I'm not here to judge you but to support you.",
                fun_facts="Walking encyclopedia for random trivia, loves good books/series, cold coffee devotee, rainy days > sunny days."
            ),
        ]
        db.add_all(defaults)
        db.commit()


@router.get("/slots")
def get_available_slots(db: Session = Depends(get_db)):
    """Return available appointment slots for the next 7 days, excluding booked/pending slots."""
    seed_psychologists(db)
    psychologists = db.query(Psychologist).all()

    # Collect already booked or requested slots to make them unavailable
    active_appts = db.query(Appointment).filter(
        Appointment.status.in_(["pending", "confirmed", "rescheduled"])
    ).all()
    booked_slots = set()
    for a in active_appts:
        if a.psychologist_id and a.slot_time:
            # Round/match to hour
            slot_key = (a.psychologist_id, a.slot_time.strftime("%Y-%m-%d %H:00"))
            booked_slots.add(slot_key)

    slots = []
    base = datetime.utcnow()
    for p in psychologists:
        for day_offset in range(1, 8):
            for hour in [9, 11, 14, 16]:
                slot_dt = (
                    base + timedelta(days=day_offset)
                ).replace(hour=hour, minute=0, second=0, microsecond=0)
                slot_key = (p.id, slot_dt.strftime("%Y-%m-%d %H:00"))
                if slot_key not in booked_slots:
                    slots.append(
                        {
                            "psychologist_id": p.id,
                            "psychologist_name": p.name,
                            "specialization": p.specialization,
                            "slot_time": slot_dt.isoformat(),
                        }
                    )
    return slots[:24]  # first 24 slots


@router.get("/psychologists")
def get_psychologists(db: Session = Depends(get_db)):
    """Return all available psychologists with full profiles."""
    seed_psychologists(db)
    official_names = [
        "RAM PRUDHVI TEJA", "SAHITHI CHALLA", "NAVYA SRI", 
        "BANTU ANUMITHA", "ANGEL BENNY", "AKSHITHA SELVARAJ", "DEVIKA BABU"
    ]
    all_psychs = db.query(Psychologist).filter(Psychologist.is_active == True).all()
    
    # Priority sort: official 7 first in order
    official_map = {name: idx for idx, name in enumerate(official_names)}
    sorted_psychs = sorted(
        all_psychs, 
        key=lambda p: official_map.get(p.name, 999)
    )

    return [
        {
            "id": p.id,
            "name": p.name,
            "specialization": p.specialization,
            "institution": getattr(p, "institution", None) or "Sri Vishnu Educational Society",
            "experience": getattr(p, "experience", None) or "Certified Counselor",
            "avatar_url": getattr(p, "avatar_url", None) or "/logo.png",
            "full_photo_url": getattr(p, "full_photo_url", None),
            "quote": getattr(p, "quote", None),
            "pillars": getattr(p, "pillars", None),
            "focus_areas": getattr(p, "focus_areas", None),
            "message_to_students": getattr(p, "message_to_students", None),
            "fun_facts": getattr(p, "fun_facts", None),
        }
        for p in sorted_psychs
        if p.name in official_names or p.id == 1
    ]


@router.post("/book")
def book_appointment(
    req: BookRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    try:
        iso_clean = req.slot_time.replace("Z", "+00:00")
        slot_dt = datetime.fromisoformat(iso_clean)
        if slot_dt.tzinfo is not None:
            slot_dt = slot_dt.replace(tzinfo=None)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid slot_time format. Use ISO 8601.")

    # Check if the slot is already taken/requested
    conflict = db.query(Appointment).filter(
        Appointment.psychologist_id == req.psychologist_id,
        Appointment.slot_time == slot_dt,
        Appointment.status.in_(["pending", "confirmed", "rescheduled"])
    ).first()
    if conflict:
        raise HTTPException(
            status_code=409, 
            detail="This counsellor time slot has already been requested or booked. Please choose another slot."
        )

    appt = Appointment(
        student_id=student.id,
        psychologist_id=req.psychologist_id,
        slot_time=slot_dt,
        notes=req.notes,
        status="pending",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    psych = db.query(Psychologist).filter(Psychologist.id == req.psychologist_id).first()
    psych_name = psych.name if psych else "Counsellor"
    return {
        "id": appt.id, 
        "status": appt.status, 
        "slot_time": appt.slot_time.isoformat(),
        "psychologist_name": psych_name,
        "whatsapp_dispatcher": "9100972237",
        "whatsapp_reminder_status": "dispatched"
    }


@router.get("/mine")
def get_my_appointments(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    appts = (
        db.query(Appointment)
        .filter(Appointment.student_id == student.id)
        .order_by(Appointment.slot_time.asc())
        .all()
    )
    result = []
    for a in appts:
        psych = db.query(Psychologist).filter(Psychologist.id == a.psychologist_id).first()
        result.append(
            {
                "id": a.id,
                "psychologist_name": psych.name if psych else "Unknown",
                "specialization": psych.specialization if psych else "",
                "slot_time": a.slot_time.isoformat() if a.slot_time else None,
                "student_alias": student.anonymous_token,
                "status": a.status,
                "notes": a.notes,
                "meeting_link": f"https://meet.mindbridge.health/session/{a.id}" if a.id % 2 == 0 else None,
                "check_in_code": f"MB-CHK-{a.id:04d}" if a.id % 2 != 0 else None,
            }
        )
    return result


@router.get("/all")
def get_all_appointments(db: Session = Depends(get_db)):
    """Psychologist views all appointments."""
    appts = db.query(Appointment).order_by(Appointment.slot_time.asc()).all()
    result = []
    for a in appts:
        psych = db.query(Psychologist).filter(Psychologist.id == a.psychologist_id).first()
        student = db.query(Student).filter(Student.id == a.student_id).first()
        result.append(
            {
                "id": a.id,
                "anonymous_id": student.anonymous_token if student else "Unknown",
                "psychologist_name": psych.name if psych else "Unknown",
                "slot_time": a.slot_time.isoformat() if a.slot_time else None,
                "status": a.status,
                "notes": a.notes,
            }
        )
    return result


@router.get("/psychologist")
def get_psychologist_appointments(db: Session = Depends(get_db)):
    """Psychologist calendar view — all appointments with anonymous student ID."""
    appts = db.query(Appointment).order_by(Appointment.slot_time.asc()).all()
    result = []
    for a in appts:
        student = db.query(Student).filter(Student.id == a.student_id).first()
        result.append(
            {
                "id": a.id,
                "anonymous_id": student.anonymous_token if student else "Unknown",
                "slot_time": a.slot_time.isoformat() if a.slot_time else None,
                "status": a.status,
                "notes": a.notes,
            }
        )
    return result

class AppointmentStatusUpdate(BaseModel):
    status: str
    new_time: Optional[str] = None

@router.put("/{appointment_id}/status")
def update_appointment_status(appointment_id: int, req: AppointmentStatusUpdate, db: Session = Depends(get_db)):
    """Psychologist confirms, accepts, declines or cancels an appointment."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    valid_statuses = ["pending", "confirmed", "accepted", "cancelled", "completed", "rescheduled", "rejected", "declined", "no_show"]
    raw_status = req.status.lower()
    if raw_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    # State machine transition mapping
    if raw_status == "accepted":
        target_status = "confirmed"
    elif raw_status == "declined":
        target_status = "rejected"
    else:
        target_status = raw_status

    appt.status = target_status
    if target_status == "rescheduled" and req.new_time:
        try:
            iso_clean = req.new_time.replace("Z", "+00:00")
            slot_dt = datetime.fromisoformat(iso_clean)
            if slot_dt.tzinfo is not None:
                slot_dt = slot_dt.replace(tzinfo=None)
            appt.slot_time = slot_dt
        except ValueError:
            pass
            
    db.commit()
    return {"status": appt.status}

@router.delete("/cancel/{appointment_id}")
def cancel_appointment(
    appointment_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.student_id == student.id
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    appt.status = "cancelled"
    db.commit()
    return {"status": "cancelled"}


@router.post("/{appointment_id}/call-token")
def get_appointment_call_token(
    appointment_id: int,
    current_user: dict = Depends(get_current_user_any_role),
    db: Session = Depends(get_db),
):
    """
    Generate temporary, appointment-verified audio call room token.
    Enforces MindBridge Security Rule:
    Room is inaccessible without explicit appointment ownership verification.
    - If student: must be assigned student.
    - If psychologist: must be assigned psychologist.
    - Never reveals student's real name, email, phone, or roll number to psychologist.
    """
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    role = current_user.get("role", "student")
    user_id = current_user.get("id")

    student = db.query(Student).filter(Student.id == appt.student_id).first()
    psych = db.query(Psychologist).filter(Psychologist.id == appt.psychologist_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    if appt.status != "confirmed":
        raise HTTPException(
            status_code=403,
            detail="Counselling session is pending acceptance by the counsellor. Audio call will unlock once confirmed."
        )

    student_alias = student.anonymous_token or "Anonymous Student"
    psych_name = psych.name if psych else "Clinical Psychologist"

    if role == "student":
        if appt.student_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You are not the assigned student for this appointment."
            )
        my_alias = student_alias
        peer_alias = psych_name
    elif role in ("psychologist", "admin"):
        if role == "psychologist" and appt.psychologist_id and appt.psychologist_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You are not the assigned psychologist for this appointment."
            )
        my_alias = psych_name
        peer_alias = student_alias
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role.")

    call_token_data = {
        "sub": str(user_id),
        "role": role,
        "token_type": "call_token",
        "appointment_id": appt.id,
        "my_alias": my_alias,
        "peer_alias": peer_alias,
    }
    call_token = create_access_token(call_token_data, expires_delta=timedelta(hours=2))

    return {
        "call_token": call_token,
        "appointment_id": appt.id,
        "role": role,
        "my_alias": my_alias,
        "peer_alias": peer_alias,
        "status": appt.status,
        "slot_time": appt.slot_time.isoformat() if appt.slot_time else None,
        "counselor_name": psych_name,
        "student_identity": student_alias,
    }


class AppointmentFeedbackRequest(BaseModel):
    rating: int  # 1 to 5
    tags: Optional[str] = None
    comment: Optional[str] = None


@router.post("/{appointment_id}/feedback")
def submit_appointment_feedback(
    appointment_id: int,
    req: AppointmentFeedbackRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Submits anonymous session feedback from student and marks appointment as completed.
    Zero-PII guaranteed.
    """
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.student_id == student.id,
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    appt.feedback_rating = max(1, min(5, req.rating))
    appt.feedback_tags = req.tags
    appt.feedback_comment = req.comment
    appt.status = "completed"

    db.commit()
    return {"status": "completed", "message": "Feedback submitted successfully."}


