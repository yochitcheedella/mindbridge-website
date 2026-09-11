import sqlite3
import os
import bcrypt

db_path = "mindbridge.db"

# Columns to add if missing
new_columns = [
    ("institution", "TEXT DEFAULT 'Vishnu Institute of Technology'"),
    ("experience", "TEXT"),
    ("avatar_url", "TEXT"),
    ("full_photo_url", "TEXT"),
    ("quote", "TEXT"),
    ("pillars", "TEXT"),
    ("focus_areas", "TEXT"),
    ("message_to_students", "TEXT"),
    ("fun_facts", "TEXT"),
]

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(psychologists)")
existing = [row[1] for row in cursor.fetchall()]

for col_name, col_def in new_columns:
    if col_name not in existing:
        try:
            cursor.execute(f"ALTER TABLE psychologists ADD COLUMN {col_name} {col_def}")
            print(f"Added column {col_name}")
        except Exception as e:
            print(f"Column {col_name} alter warning: {e}")

conn.commit()

# Default password for counsellors: "Counselor@VIT2024" or "Psych@VIT2024" for Ram Sir
pwd_hash_ram = bcrypt.hashpw(b"Psych@VIT2024", bcrypt.gensalt()).decode("utf-8")
pwd_hash_default = bcrypt.hashpw(b"Counselor@VIT2024", bcrypt.gensalt()).decode("utf-8")

counselors = [
    {
        "name": "RAM PRUDHVI TEJA",
        "specialization": "Senior Wellness Counsellor · Crisis Intervention & Cognitive Therapy",
        "email": "ram.sir@vishnu.edu.in",
        "password_hash": pwd_hash_ram,
        "institution": "VIT (Vishnu Institute of Technology)",
        "experience": "7+ Years",
        "avatar_url": "/counselors/ram_prudhvi_teja_head.jpg",
        "full_photo_url": "/counselors/ram_prudhvi_teja_full.jpg",
        "quote": "The best way to predict your future is to create it—not from the influences of your past experiences, but through the power of your imagination. ♡",
        "pillars": "Non judgemental • Evidence based • Solution based • Empathetic",
        "focus_areas": "Stress, anxiety & overthinking; Depression & emotional well-being; Academic stress & exam anxiety; Self-esteem; Anger management; Crisis intervention & psychological first aid; Mindfulness & healthy coping skills",
        "message_to_students": "Seeking help is not a sign of weakness—it is a sign of courage. You don't have to carry every burden or suffer alone in silence. Asking for support isn't giving up, it's choosing growth over struggle and hope over fear.",
        "fun_facts": "Reading psychology books and novels, travelling, exploring new places and cultures, cricket enthusiast, passionate about continuous learning."
    },
    {
        "name": "SAHITHI CHALLA",
        "specialization": "Wellness Counsellor · Forensic Psychology & Emotional Wellness",
        "email": "sahithi.c@vishnu.edu.in",
        "password_hash": pwd_hash_default,
        "institution": "Vishnu School",
        "experience": "1 Year",
        "avatar_url": "/counselors/sahithi_challa_head.jpg",
        "full_photo_url": "/counselors/sahithi_challa_full.jpg",
        "quote": "A decision doesn't define you. Your commitment to it does. ♡",
        "pillars": "Empathetic • Curious • Practical tools",
        "focus_areas": "Anxiety & overthinking; Stress & burnout; Self-esteem & confidence; Relationship & family concerns; Life transitions; Building healthier habits & boundaries",
        "message_to_students": "You don't have to carry every burden alone. Speaking up isn't a sign of weakness; it's the first step toward healing. Small conversations today can prevent bigger struggles tomorrow.",
        "fun_facts": "Background in Forensic Psychology (crime documentaries are homework!), comfort combo is books and biryani always, loves practical psychological tools."
    },
    {
        "name": "NAVYA SRI",
        "specialization": "Wellness Counsellor · Academic & Life Transitions",
        "email": "navya.sri@vishnu.edu.in",
        "password_hash": pwd_hash_default,
        "institution": "B.V. Raju College",
        "experience": "3 Years",
        "avatar_url": "/counselors/navya_sri_head.jpg",
        "full_photo_url": "/counselors/navya_sri_full.jpg",
        "quote": "Try, even if you fail, atleast you'll know what you can do differently next time ♡",
        "pillars": "Empathetic • Non-Judgemental • Supportive • Solution-Focused",
        "focus_areas": "Relationship & family concerns; Academic stress & pressure; Time management & procrastination; Emotional struggles & self doubt; Crisis situations",
        "message_to_students": "It's okay to be different. You don't have to think, feel or choose the same as everyone else. Respect others' choices, express your own thoughts, and stay open to new perspectives.",
        "fun_facts": "Genuinely enjoys meaningful conversations, nature enthusiast, pets and little humans are instant mood-lifters."
    },
    {
        "name": "BANTU ANUMITHA",
        "specialization": "Wellness Counsellor · Strength-Based Coping & Resilience",
        "email": "bantu.anumitha@vishnu.edu.in",
        "password_hash": pwd_hash_default,
        "institution": "Smt. B. Seetha Polytechnic College",
        "experience": "1 Year",
        "avatar_url": "/counselors/bantu_anumitha_head.jpg",
        "full_photo_url": "/counselors/bantu_anumitha_full.jpg",
        "quote": "Healing isn't changing who you are; it's uncovering who you've always been ♡",
        "pillars": "Empathetic • Non-Judgemental • Strength-Based • Confidential",
        "focus_areas": "Adjustment to life changes; Overthinking & procrastination; Career confusion & decision making; Loneliness & emotional distress; Interpersonal relationships",
        "message_to_students": "You don't have to be perfect to be worthy, you are enough, even while you're growing. Asking for help means you are choosing to heal in a healthier way.",
        "fun_facts": "Believes empathy is the foundation of healing, loves reading about human behavior, celebrates every small step of progress."
    },
    {
        "name": "ANGEL BENNY",
        "specialization": "Wellness Counselor · Grief, Burnout & Holistic Well-being",
        "email": "angel.benny@vishnu.edu.in",
        "password_hash": pwd_hash_default,
        "institution": "VDC (Vishnu Dental College)",
        "experience": "4+ Years",
        "avatar_url": "/counselors/angel_benny_head.jpg",
        "full_photo_url": "/counselors/angel_benny_full.jpg",
        "quote": "Making space for the overthinking, the chaos and the 'I'm fine' that definitely isn't fine. Making space for all of it and maybe even make sense of it together. ♡",
        "pillars": "Confidential • Compassionate • Non judgemental • Patient",
        "focus_areas": "Anxiety & overthinking; Academic stress & burnout; Grief & loss; Exam anxiety; Family concerns; Goal setting & motivation",
        "message_to_students": "I hope that every student knows that no problem is too small to ask for help. There is a place where you can be heard without judgement, seen with compassion and accepted as you are.",
        "fun_facts": "Dogs > Cats > Everything else, avid reader of wizard/mystery novels, movie quotes and memes communicator, water lover."
    },
    {
        "name": "AKSHITHA SELVARAJ",
        "specialization": "Wellness Counsellor · Student Coping Strategies & Mental Health",
        "email": "akshitha.s@vishnu.edu.in",
        "password_hash": pwd_hash_default,
        "institution": "Sri Vishnu College of Pharmacy",
        "experience": "1 Year",
        "avatar_url": "/counselors/akshitha_selvaraj_head.jpg",
        "full_photo_url": "/counselors/akshitha_selvaraj_full.jpg",
        "quote": "Every conversation is a step toward healing, growth, and self-discovery ♡",
        "pillars": "Safe • Non-judgemental • Collaborative • Confidential",
        "focus_areas": "Interpersonal issues; Exam-related concerns & academic stress; Depression & negative thinking; Stress & overthinking; Personal growth",
        "message_to_students": "It's ok to ask for support, even when you simply need someone to listen. Seeking help is a sign of strength. It's okay to make mistakes, take breaks, and grow forward.",
        "fun_facts": "Designs interactive mental health awareness programs, believer in small consistent habits, coffee and good music lover."
    },
    {
        "name": "DEVIKA BABU",
        "specialization": "Wellness Counsellor · Trauma, Emotional Wellness & Career Clarity",
        "email": "devika.b@vishnu.edu.in",
        "password_hash": pwd_hash_default,
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

for c in counselors:
    cursor.execute("SELECT id FROM psychologists WHERE email = ?", (c["email"],))
    row = cursor.fetchone()
    if row:
        cursor.execute("""
            UPDATE psychologists SET 
                name = ?, specialization = ?, institution = ?, experience = ?,
                avatar_url = ?, full_photo_url = ?, quote = ?, pillars = ?,
                focus_areas = ?, message_to_students = ?, fun_facts = ?,
                is_active = 1, available = 'true'
            WHERE id = ?
        """, (
            c["name"], c["specialization"], c["institution"], c["experience"],
            c["avatar_url"], c["full_photo_url"], c["quote"], c["pillars"],
            c["focus_areas"], c["message_to_students"], c["fun_facts"],
            row[0]
        ))
        print(f"Updated {c['name']} (ID {row[0]})")
    else:
        cursor.execute("""
            INSERT INTO psychologists (
                name, specialization, email, password_hash, institution,
                experience, avatar_url, full_photo_url, quote, pillars,
                focus_areas, message_to_students, fun_facts, is_active, available
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'true')
        """, (
            c["name"], c["specialization"], c["email"], c["password_hash"],
            c["institution"], c["experience"], c["avatar_url"], c["full_photo_url"],
            c["quote"], c["pillars"], c["focus_areas"], c["message_to_students"],
            c["fun_facts"]
        ))
        print(f"Inserted {c['name']}")

conn.commit()
conn.close()
print("All 7 official Vishnu Wellness Centre counselors synced successfully!")
