-- ==============================================================================
-- MindBridge AI: Production PostgreSQL Database Schema & Row-Level Security (RLS)
-- Institutional Deployment: Vishnu Institute of Technology (VIT) / Vishnu College
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (Tied to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'psychologist', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Vault (Encrypted PII at Rest)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    anonymous_alias VARCHAR(60) NOT NULL UNIQUE, -- e.g., 'Blue Sparrow #4821'
    email_hash VARCHAR(128) NOT NULL UNIQUE,     -- Lowercase hashed email
    encrypted_real_name TEXT NOT NULL,           -- AES-256 Fernet ciphertext
    encrypted_phone TEXT,                        -- AES-256 Fernet ciphertext
    encrypted_email TEXT,                        -- AES-256 Fernet ciphertext
    department VARCHAR(50) NOT NULL DEFAULT 'General',
    year INT NOT NULL DEFAULT 1,
    risk_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (risk_score BETWEEN 0.00 AND 100.00),
    burnout_probability NUMERIC(5,2) DEFAULT 0.00 CHECK (burnout_probability BETWEEN 0.00 AND 1.00),
    daily_wellness_score INT DEFAULT 100 CHECK (daily_wellness_score BETWEEN 0 AND 100),
    is_anonymous_mode BOOLEAN DEFAULT TRUE,
    share_mood_with_counselor BOOLEAN DEFAULT FALSE,
    share_journal_with_counselor BOOLEAN DEFAULT FALSE,
    fcm_device_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Psychologists
CREATE TABLE IF NOT EXISTS psychologists (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    specialization VARCHAR(120) NOT NULL DEFAULT 'Student Counseling',
    department VARCHAR(60) DEFAULT 'Counseling Center',
    is_active BOOLEAN DEFAULT TRUE,
    fcm_device_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Administrators (Zero-PII Access)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    department VARCHAR(60) DEFAULT 'Campus Administration',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Student Mood Logs
CREATE TABLE IF NOT EXISTS mood_logs (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    stress_level INT CHECK (stress_level BETWEEN 1 AND 10),
    energy_level INT CHECK (energy_level BETWEEN 1 AND 10),
    sleep_hours NUMERIC(3,1),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Student Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_shared_with_counselor BOOLEAN NOT NULL DEFAULT FALSE,
    sentiment_tag VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Conversations & Messages (Safety Filtered)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(150) DEFAULT 'Emotional Support Session',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    sender VARCHAR(15) NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    risk_classification VARCHAR(20) DEFAULT 'LOW' CHECK (risk_classification IN ('LOW', 'MILD', 'MODERATE', 'HIGH', 'CRITICAL')),
    risk_score NUMERIC(5,2) DEFAULT 0.00,
    requires_alert BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Counseling Cases & Appointments
CREATE TABLE IF NOT EXISTS counseling_cases (
    id VARCHAR(30) PRIMARY KEY, -- e.g. "MB-2026-00124"
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    psychologist_id UUID REFERENCES psychologists(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'ESCALATED', 'CLOSED')),
    risk_tier VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (risk_tier IN ('NORMAL', 'MODERATE', 'HIGH', 'CRITICAL')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    case_id VARCHAR(30) REFERENCES counseling_cases(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Clinical SOAP Notes (Confidential to Psychologist)
CREATE TABLE IF NOT EXISTS psychologist_notes (
    id BIGSERIAL PRIMARY KEY,
    case_id VARCHAR(30) NOT NULL REFERENCES counseling_cases(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Direct Psychologist-Student Secure Messaging
CREATE TABLE IF NOT EXISTS clinical_messages (
    id BIGSERIAL PRIMARY KEY,
    case_id VARCHAR(30) NOT NULL REFERENCES counseling_cases(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'psychologist')),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Immutable Audit Logs & De-anonymization Trail
CREATE TABLE IF NOT EXISTS identity_reveal_logs (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id),
    revealed_to UUID NOT NULL REFERENCES profiles(id),
    reason TEXT NOT NULL,
    risk_score NUMERIC(5,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    authorized_by VARCHAR(100) NOT NULL,
    ip_address_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID NOT NULL REFERENCES profiles(id),
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(60) NOT NULL,
    target_id VARCHAR(120) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Student Policy Consents
CREATE TABLE IF NOT EXISTS consents (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    policy_version VARCHAR(30) NOT NULL DEFAULT 'v1.0-vishnu',
    accepted_privacy BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_anonymous_policy BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_crisis_terms BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_reveal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = auth_user_id OR auth.uid() = id);

-- 2. Students Policies
CREATE POLICY "Students can view and edit own record" ON students
    FOR ALL USING (id = auth.uid());

CREATE POLICY "Psychologists can view assigned student aliases" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM counseling_cases cc
            WHERE cc.student_id = students.id
            AND cc.psychologist_id = auth.uid()
        )
    );

-- 3. Mood Logs Policies
CREATE POLICY "Students own mood logs" ON mood_logs
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Psychologists view mood logs only if shared or assigned" ON mood_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            JOIN counseling_cases cc ON cc.student_id = s.id
            WHERE s.id = mood_logs.student_id
            AND cc.psychologist_id = auth.uid()
            AND s.share_mood_with_counselor = TRUE
        )
    );

-- 4. Journal Entries Policies
CREATE POLICY "Students own private journals" ON journal_entries
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Psychologists read shared journals only" ON journal_entries
    FOR SELECT USING (
        is_shared_with_counselor = TRUE AND
        EXISTS (
            SELECT 1 FROM counseling_cases cc
            WHERE cc.student_id = journal_entries.student_id
            AND cc.psychologist_id = auth.uid()
        )
    );

-- 5. AI Conversations Policies
CREATE POLICY "Students own AI chats" ON ai_conversations
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Students own AI messages" ON ai_messages
    FOR ALL USING (student_id = auth.uid());

-- 6. Counseling Cases Policies
CREATE POLICY "Students can view own case status" ON counseling_cases
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Psychologists manage assigned cases" ON counseling_cases
    FOR ALL USING (psychologist_id = auth.uid());

-- 7. Appointments Policies
CREATE POLICY "Students manage own appointments" ON appointments
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Psychologists manage scheduled appointments" ON appointments
    FOR ALL USING (psychologist_id = auth.uid());

-- 8. Psychologist Notes Policies (Confidential to Clinician)
CREATE POLICY "Psychologists manage own SOAP notes" ON psychologist_notes
    FOR ALL USING (psychologist_id = auth.uid());

-- 9. Clinical Messaging Policies
CREATE POLICY "Case participants access messages" ON clinical_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM counseling_cases cc
            WHERE cc.id = clinical_messages.case_id
            AND (cc.student_id = auth.uid() OR cc.psychologist_id = auth.uid())
        )
    );

-- 10. Audit & Reveal Logs (Read-only for authorized roles, insert-only during events)
CREATE POLICY "Authorized read on identity reveal logs" ON identity_reveal_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'psychologist')
        )
    );

CREATE POLICY "Admin audit log inspection" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );
