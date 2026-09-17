-- ==============================================================================
-- MindBridge AI: Supabase Auth Single Identity Key Architecture (auth.uid())
-- Institutional Deployment: Vishnu Institute of Technology (Autonomous), Bhimavaram
-- Single Identity Key: auth.uid() (auth.users.id)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create public.profiles table referencing auth.users(id)
-- Real name is strictly a display attribute. auth.uid() is the single identity key.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    real_name TEXT,
    alias TEXT DEFAULT 'StarlightSeeker',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'counsellor', 'psychologist', 'admin', 'super_admin')),
    college_name TEXT DEFAULT 'Vishnu Institute of Technology (VIT)',
    department TEXT DEFAULT 'General',
    year TEXT DEFAULT '1st Year',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Automatic Profile Creation Trigger on auth.users insert
-- When a user signs up via supabase.auth.signUp({ options: { data: { real_name, role, alias, ... } } }),
-- this trigger automatically provisions their profile row tied to new.id (auth.uid()).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        real_name,
        alias,
        role,
        college_name,
        department,
        year,
        phone
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'real_name', 'Student User'),
        COALESCE(NEW.raw_user_meta_data->>'alias', 'StarlightSeeker'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'college_name', 'Vishnu Institute of Technology (VIT)'),
        COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
        COALESCE(NEW.raw_user_meta_data->>'year', '1st Year'),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        real_name = COALESCE(EXCLUDED.real_name, public.profiles.real_name),
        alias = COALESCE(EXCLUDED.alias, public.profiles.alias),
        updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Bind Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Bookings / Appointments Table
-- Always references public.profiles(id) via student_id UUID, NEVER by student real_name.
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    counsellor_id TEXT NOT NULL,
    counsellor_name TEXT NOT NULL,
    booking_date TIMESTAMPTZ NOT NULL,
    time_slot TEXT NOT NULL,
    session_type TEXT DEFAULT 'chat' CHECK (session_type IN ('chat', 'audio', 'in_person', 'video')),
    issue_description TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 5. Student Journal Entries Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    mood_emoji TEXT,
    sentiment_tag TEXT,
    is_shared_with_counselor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_student_id ON public.journal_entries(student_id);

-- 6. Student Mood Logs Table
CREATE TABLE IF NOT EXISTS public.mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    stress_level INT CHECK (stress_level BETWEEN 1 AND 10),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_student_id ON public.mood_logs(student_id);

-- 7. Row-Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- ── PROFILES POLICIES ──
-- Users can view their own profile; Admins / Counsellors can view profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'counsellor', 'psychologist')
        )
    );

-- Users can update only their own profile display attributes (role modification strictly prevented)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Ensure non-admins cannot elevate their own role
        AND (
            role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
            )
        )
    );

-- ── BOOKINGS POLICIES ──
-- Students can insert bookings ONLY for their own student_id
DROP POLICY IF EXISTS "Students can create own bookings" ON public.bookings;
CREATE POLICY "Students can create own bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Students can read only their own bookings; Staff and Admins can view all bookings
DROP POLICY IF EXISTS "Students can view own bookings" ON public.bookings;
CREATE POLICY "Students can view own bookings"
    ON public.bookings FOR SELECT
    USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'counsellor', 'psychologist')
        )
    );

-- Students can cancel/update only their own bookings
DROP POLICY IF EXISTS "Students can update own bookings" ON public.bookings;
CREATE POLICY "Students can update own bookings"
    ON public.bookings FOR UPDATE
    USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'counsellor', 'psychologist')
        )
    );

-- ── JOURNAL POLICIES ──
DROP POLICY IF EXISTS "Students own their journal entries" ON public.journal_entries;
CREATE POLICY "Students own their journal entries"
    ON public.journal_entries FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- ── MOOD LOGS POLICIES ──
DROP POLICY IF EXISTS "Students own their mood logs" ON public.mood_logs;
CREATE POLICY "Students own their mood logs"
    ON public.mood_logs FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- 8. Helper Function: Get User Role Server-side
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
