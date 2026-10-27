-- ====================================================================
-- ClassTrack — Primary School Attendance Management System
-- Supabase PostgreSQL Database Schema & Row-Level Security (RLS)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom ENUM Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'teacher');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Late', 'Excused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'teacher',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. 'Primary 1', 'Primary 2'
  grade_level INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, name)
);

-- 6. Teacher-to-Class Assignments (Junction Table)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- 7. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  guardian_name TEXT,
  guardian_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Attendance Sessions Table (One register per class per day)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, date)
);

-- 9. Attendance Records Table (Per-student daily status)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'Present',
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);

-- ====================================================================
-- Security Helper Functions (SECURITY DEFINER for RLS evaluation)
-- ====================================================================

-- Get current authenticated user's school_id
CREATE OR REPLACE FUNCTION public.get_auth_school_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Get current authenticated user's role
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Check if current user is an active school administrator
CREATE OR REPLACE FUNCTION public.is_school_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

-- Check if the current user is an active teacher assigned to a given class
CREATE OR REPLACE FUNCTION public.is_teacher_assigned(target_class_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes tc
    JOIN public.profiles p ON p.id = tc.teacher_id
    WHERE tc.teacher_id = auth.uid()
      AND tc.class_id = target_class_id
      AND p.status = 'active'
  );
$$;

-- ====================================================================
-- Enable Row Level Security (RLS) on All Tables
-- ====================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS Policies: Schools
-- ====================================================================
CREATE POLICY "Users can view their own school"
  ON public.schools FOR SELECT
  USING (id = public.get_auth_school_id());

-- ====================================================================
-- RLS Policies: Profiles
-- ====================================================================
-- 1. Users can always view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- 2. Admins can view all profiles in their school
CREATE POLICY "Admins can view school profiles"
  ON public.profiles FOR SELECT
  USING (public.is_school_admin() AND school_id = public.get_auth_school_id());

-- 3. Admins can create and update profiles in their school
CREATE POLICY "Admins can manage school profiles"
  ON public.profiles FOR ALL
  USING (public.is_school_admin() AND school_id = public.get_auth_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.get_auth_school_id());

-- ====================================================================
-- RLS Policies: Classes
-- ====================================================================
-- 1. Admins have full access to classes
CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  USING (public.is_school_admin() AND school_id = public.get_auth_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.get_auth_school_id());

-- 2. Teachers can view ONLY their assigned classes
CREATE POLICY "Teachers can view assigned classes"
  ON public.classes FOR SELECT
  USING (public.is_teacher_assigned(id));

-- ====================================================================
-- RLS Policies: Teacher Classes (Class Assignments)
-- ====================================================================
-- 1. Admins have full access to assign and unassign classes
CREATE POLICY "Admins can manage teacher assignments"
  ON public.teacher_classes FOR ALL
  USING (public.is_school_admin() AND school_id = public.get_auth_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.get_auth_school_id());

-- 2. Teachers can view their own class assignments
CREATE POLICY "Teachers can view their own assignments"
  ON public.teacher_classes FOR SELECT
  USING (teacher_id = auth.uid());

-- ====================================================================
-- RLS Policies: Students
-- ====================================================================
-- 1. Admins have full access to manage students
CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  USING (public.is_school_admin() AND school_id = public.get_auth_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.get_auth_school_id());

-- 2. Teachers can ONLY VIEW students in their assigned classes
CREATE POLICY "Teachers can view assigned class students"
  ON public.students FOR SELECT
  USING (public.is_teacher_assigned(class_id));

-- ====================================================================
-- RLS Policies: Attendance Sessions & Records
-- ====================================================================
-- 1. Admins have full access to attendance
CREATE POLICY "Admins can manage attendance sessions"
  ON public.attendance_sessions FOR ALL
  USING (public.is_school_admin() AND school_id = public.get_auth_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.get_auth_school_id());

CREATE POLICY "Admins can manage attendance records"
  ON public.attendance_records FOR ALL
  USING (public.is_school_admin() AND school_id = public.get_auth_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.get_auth_school_id());

-- 2. Teachers can SELECT, INSERT, and UPDATE attendance for their assigned classes
CREATE POLICY "Teachers can view assigned attendance records"
  ON public.attendance_records FOR SELECT
  USING (public.is_teacher_assigned(class_id));

CREATE POLICY "Teachers can insert attendance for assigned classes"
  ON public.attendance_records FOR INSERT
  WITH CHECK (public.is_teacher_assigned(class_id));

CREATE POLICY "Teachers can update attendance for assigned classes"
  ON public.attendance_records FOR UPDATE
  USING (public.is_teacher_assigned(class_id))
  WITH CHECK (public.is_teacher_assigned(class_id));

-- ====================================================================
-- Automatic Profile Creation Trigger on Signup
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  default_school_id UUID;
BEGIN
  -- Default to Greenfield Primary School or first existing school
  SELECT id INTO default_school_id FROM public.schools LIMIT 1;
  
  -- Prevent privilege escalation: new signups are ALWAYS 'teacher' role by default
  INSERT INTO public.profiles (id, school_id, email, full_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(default_school_id, '00000000-0000-0000-0000-000000000000'::UUID),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'teacher',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ====================================================================
-- Initial Seed Data: Default Demo School & Standard Classes
-- ====================================================================
INSERT INTO public.schools (id, name, address)
VALUES ('11111111-1111-1111-1111-111111111111', 'Greenfield Primary School', '12 Greenfield Way')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.classes (school_id, name, grade_level) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Primary 1', 1),
  ('11111111-1111-1111-1111-111111111111', 'Primary 2', 2),
  ('11111111-1111-1111-1111-111111111111', 'Primary 3', 3),
  ('11111111-1111-1111-1111-111111111111', 'Primary 4', 4),
  ('11111111-1111-1111-1111-111111111111', 'Primary 5', 5),
  ('11111111-1111-1111-1111-111111111111', 'Primary 6', 6)
ON CONFLICT (school_id, name) DO NOTHING;
