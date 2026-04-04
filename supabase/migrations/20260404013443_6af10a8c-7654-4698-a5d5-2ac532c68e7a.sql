
-- Add new columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS photo_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hobbies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sports text[] DEFAULT '{}';

-- Work History
CREATE TABLE public.work_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT 'full-time',
  is_current boolean NOT NULL DEFAULT false,
  is_concurrent boolean NOT NULL DEFAULT false,
  start_month integer,
  start_year integer,
  end_month integer,
  end_year integer,
  location text DEFAULT '',
  location_type text DEFAULT 'onsite',
  description text DEFAULT '',
  awards text DEFAULT '',
  achievements text DEFAULT '',
  performance text DEFAULT '',
  skills text[] DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.work_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own work history" ON public.work_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work history" ON public.work_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work history" ON public.work_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own work history" ON public.work_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Work History Media
CREATE TABLE public.work_history_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_history_id uuid NOT NULL REFERENCES public.work_history(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_url text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.work_history_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own media" ON public.work_history_media FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own media" ON public.work_history_media FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own media" ON public.work_history_media FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- References
CREATE TABLE public.references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_history_id uuid REFERENCES public.work_history(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  consent_given boolean NOT NULL DEFAULT false,
  document_url text DEFAULT '',
  video_url text DEFAULT '',
  testimonial_text text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own references" ON public.references FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own references" ON public.references FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own references" ON public.references FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own references" ON public.references FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Education
CREATE TABLE public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  institution text NOT NULL DEFAULT '',
  degree text DEFAULT '',
  field text DEFAULT '',
  start_year integer,
  end_year integer,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own education" ON public.education FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own education" ON public.education FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own education" ON public.education FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own education" ON public.education FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  issuer text DEFAULT '',
  date_issued date,
  file_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own certificates" ON public.certificates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own certificates" ON public.certificates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Social Accounts
CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL DEFAULT '',
  url text DEFAULT '',
  followers integer DEFAULT 0,
  friends integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own socials" ON public.social_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own socials" ON public.social_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own socials" ON public.social_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own socials" ON public.social_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Events (admin-managed)
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  event_date timestamptz NOT NULL,
  location text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Event RSVPs
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'interested',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rsvps" ON public.event_rsvps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rsvps" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rsvps" ON public.event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own rsvps" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all rsvps" ON public.event_rsvps FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Test Results
CREATE TABLE public.test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  test_type text NOT NULL DEFAULT '',
  score numeric,
  completed_at timestamptz NOT NULL DEFAULT now(),
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own test results" ON public.test_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test results" ON public.test_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Interview Sessions
CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid,
  questions jsonb DEFAULT '[]',
  answers jsonb DEFAULT '[]',
  feedback jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.interview_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.interview_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.interview_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
