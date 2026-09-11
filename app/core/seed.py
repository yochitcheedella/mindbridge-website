from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import hash_password, encrypt_data
from app.models.user import Student
from app.models.psychologist import Psychologist
from app.models.admin import VITAdmin

def seed_demo_accounts():
    db = SessionLocal()
    try:
        # 1. Student demo account
        student_email = "student@vishnu.edu.in"
        if not db.query(Student).filter(Student.email_hash == student_email).first():
            alias = "VIT Student #4821"
            # ensure alias is unique
            if not db.query(Student).filter(Student.anonymous_token == alias).first():
                demo_student = Student(
                    email_hash=student_email,
                    password_hash=hash_password("Student@VIT2024"),
                    encrypted_name=encrypt_data("Demo Student"),
                    encrypted_phone=encrypt_data("9876543210"),
                    encrypted_email=encrypt_data(student_email),
                    anonymous_token=alias,
                    department="CSE",
                    year=3,
                    risk_score=0.0,
                )
                db.add(demo_student)

        # 2. Official Vishnu Wellness Centre Counsellors
        official_counselors = [
            {
                "name": "RAM PRUDHVI TEJA",
                "specialization": "Senior Wellness Counsellor · Crisis Intervention & Cognitive Therapy",
                "email": "ram.sir@vishnu.edu.in",
                "password_hash": hash_password("Psych@VIT2024"),
                "institution": "VIT (Vishnu Institute of Technology)",
                "experience": "7+ Years",
                "avatar_url": "/counselors/ram_prudhvi_teja_head.jpg",
                "full_photo_url": "/counselors/ram_prudhvi_teja_full.jpg",
                "quote": "The best way to predict your future is to create it—not from the influences of your past experiences, but through the power of your imagination. ♡",
                "pillars": "Non judgemental • Evidence based • Solution based • Empathetic",
                "focus_areas": "Stress, anxiety & overthinking; Depression & emotional well-being; Academic stress & exam anxiety; Self-esteem; Anger management; Crisis intervention & psychological first aid",
                "message_to_students": "Seeking help is not a sign of weakness—it is a sign of courage. You don't have to carry every burden or suffer alone in silence.",
                "fun_facts": "Reading psychology books and novels, travelling, exploring new places, cricket enthusiast, passionate about continuous learning."
            },
            {
                "name": "SAHITHI CHALLA",
                "specialization": "Wellness Counsellor · Forensic Psychology & Emotional Wellness",
                "email": "sahithi.c@vishnu.edu.in",
                "password_hash": hash_password("Counselor@VIT2024"),
                "institution": "Vishnu School",
                "experience": "1 Year",
                "avatar_url": "/counselors/sahithi_challa_head.jpg",
                "full_photo_url": "/counselors/sahithi_challa_full.jpg",
                "quote": "A decision doesn't define you. Your commitment to it does. ♡",
                "pillars": "Empathetic • Curious • Practical tools",
                "focus_areas": "Anxiety & overthinking; Stress & burnout; Self-esteem & confidence; Relationship & family concerns; Life transitions",
                "message_to_students": "You don't have to carry every burden alone. Speaking up isn't a sign of weakness; it's the first step toward healing.",
                "fun_facts": "Background in Forensic Psychology (crime documentaries are homework!), comfort combo is books and biryani always."
            },
            {
                "name": "NAVYA SRI",
                "specialization": "Wellness Counsellor · Academic & Life Transitions",
                "email": "navya.sri@vishnu.edu.in",
                "password_hash": hash_password("Counselor@VIT2024"),
                "institution": "B.V. Raju College",
                "experience": "3 Years",
                "avatar_url": "/counselors/navya_sri_head.jpg",
                "full_photo_url": "/counselors/navya_sri_full.jpg",
                "quote": "Try, even if you fail, atleast you'll know what you can do differently next time ♡",
                "pillars": "Empathetic • Non-Judgemental • Supportive • Solution-Focused",
                "focus_areas": "Relationship & family concerns; Academic stress & pressure; Time management & procrastination; Emotional struggles",
                "message_to_students": "It's okay to be different. You don't have to think, feel or choose the same as everyone else. Respect others' choices, express your own thoughts.",
                "fun_facts": "Genuinely enjoys meaningful conversations, nature enthusiast, pets and little humans are instant mood-lifters."
            },
            {
                "name": "BANTU ANUMITHA",
                "specialization": "Wellness Counsellor · Strength-Based Coping & Resilience",
                "email": "bantu.anumitha@vishnu.edu.in",
                "password_hash": hash_password("Counselor@VIT2024"),
                "institution": "Smt. B. Seetha Polytechnic College",
                "experience": "1 Year",
                "avatar_url": "/counselors/bantu_anumitha_head.jpg",
                "full_photo_url": "/counselors/bantu_anumitha_full.jpg",
                "quote": "Healing isn't changing who you are; it's uncovering who you've always been ♡",
                "pillars": "Empathetic • Non-Judgemental • Strength-Based • Confidential",
                "focus_areas": "Adjustment to life changes; Overthinking & procrastination; Career confusion & decision making; Loneliness & emotional distress",
                "message_to_students": "You don't have to be perfect to be worthy, you are enough, even while you're growing. Asking for help means you are choosing to heal.",
                "fun_facts": "Believes empathy is the foundation of healing, loves reading about human behavior, celebrates every small step of progress."
            },
            {
                "name": "ANGEL BENNY",
                "specialization": "Wellness Counselor · Grief, Burnout & Holistic Well-being",
                "email": "angel.benny@vishnu.edu.in",
                "password_hash": hash_password("Counselor@VIT2024"),
                "institution": "VDC (Vishnu Dental College)",
                "experience": "4+ Years",
                "avatar_url": "/counselors/angel_benny_head.jpg",
                "full_photo_url": "/counselors/angel_benny_full.jpg",
                "quote": "Making space for the overthinking, the chaos and the 'I'm fine' that definitely isn't fine. Making space for all of it and maybe even make sense of it together. ♡",
                "pillars": "Confidential • Compassionate • Non judgemental • Patient",
                "focus_areas": "Anxiety & overthinking; Academic stress & burnout; Grief & loss; Exam anxiety; Family concerns; Goal setting & motivation",
                "message_to_students": "I hope that every student knows that no problem is too small to ask for help. There is a place where you can be heard without judgement.",
                "fun_facts": "Dogs > Cats > Everything else, avid reader of wizard/mystery novels, movie quotes and memes communicator."
            },
            {
                "name": "AKSHITHA SELVARAJ",
                "specialization": "Wellness Counsellor · Student Coping Strategies & Mental Health",
                "email": "akshitha.s@vishnu.edu.in",
                "password_hash": hash_password("Counselor@VIT2024"),
                "institution": "Sri Vishnu College of Pharmacy",
                "experience": "1 Year",
                "avatar_url": "/counselors/akshitha_selvaraj_head.jpg",
                "full_photo_url": "/counselors/akshitha_selvaraj_full.jpg",
                "quote": "Every conversation is a step toward healing, growth, and self-discovery ♡",
                "pillars": "Safe • Non-judgemental • Collaborative • Confidential",
                "focus_areas": "Interpersonal issues; Exam-related concerns & academic stress; Depression & negative thinking; Stress & overthinking; Personal growth",
                "message_to_students": "It's ok to ask for support, even when you simply need someone to listen. Seeking help is a sign of strength.",
                "fun_facts": "Designs interactive mental health awareness programs, believer in small consistent habits, coffee and good music lover."
            },
            {
                "name": "DEVIKA BABU",
                "specialization": "Wellness Counsellor · Trauma, Emotional Wellness & Career Clarity",
                "email": "devika.b@vishnu.edu.in",
                "password_hash": hash_password("Counselor@VIT2024"),
                "institution": "Vishnu Women's University",
                "experience": "3.5+ Years",
                "avatar_url": "/counselors/devika_babu_head.jpg",
                "full_photo_url": "/counselors/devika_babu_full.jpg",
                "quote": "Creating a space where you can be yourself and talk about the things that really matter to you ♡",
                "pillars": "Ethical • Compassionate • Empowering • Goal-oriented",
                "focus_areas": "Stress management & trauma related concerns; Depression, anxiety & emotional well-being; Relationship & interpersonal difficulties; Career clarity",
                "message_to_students": "The world is scary sometimes. You don't have to face it alone. I'm not here to judge you but to support you.",
                "fun_facts": "Walking encyclopedia for random trivia, loves good books/series, cold coffee devotee, rainy days > sunny days."
            }
        ]

        for c_data in official_counselors:
            existing_p = db.query(Psychologist).filter(Psychologist.email == c_data["email"]).first()
            if not existing_p:
                db.add(Psychologist(
                    name=c_data["name"],
                    specialization=c_data["specialization"],
                    email=c_data["email"],
                    password_hash=c_data["password_hash"],
                    institution=c_data["institution"],
                    experience=c_data["experience"],
                    avatar_url=c_data["avatar_url"],
                    full_photo_url=c_data["full_photo_url"],
                    quote=c_data["quote"],
                    pillars=c_data["pillars"],
                    focus_areas=c_data["focus_areas"],
                    message_to_students=c_data["message_to_students"],
                    fun_facts=c_data["fun_facts"],
                    is_active=True,
                    available="true"
                ))
            else:
                for k, v in c_data.items():
                    if k != "password_hash":
                        setattr(existing_p, k, v)
                existing_p.is_active = True
                existing_p.available = "true"

        # 3. Admin demo account
        admin_email = "admin@vishnu.edu.in"
        if not db.query(VITAdmin).filter(VITAdmin.email == admin_email).first():
            demo_admin = VITAdmin(
                name="VIT Chief Administrator",
                email=admin_email,
                password_hash=hash_password("Admin@VIT2024"),
                is_active=True,
            )
            db.add(demo_admin)

        db.commit()
    except Exception as e:
        print(f"Error during seeding demo accounts: {e}")
        db.rollback()
    finally:
        db.close()
