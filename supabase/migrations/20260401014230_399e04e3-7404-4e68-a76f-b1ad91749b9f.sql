
-- User profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  location TEXT DEFAULT '',
  headline TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  years_of_experience INTEGER DEFAULT 0,
  top_skills TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  languages_spoken TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User non-negotiables table
CREATE TABLE public.user_non_negotiables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  min_salary INTEGER DEFAULT 0,
  salary_currency TEXT DEFAULT 'USD',
  allowed_countries TEXT[] DEFAULT '{}',
  remote_preference TEXT DEFAULT 'any',
  requires_visa_sponsorship BOOLEAN DEFAULT false,
  employment_type_preferences TEXT[] DEFAULT '{}',
  max_travel_percent INTEGER DEFAULT 100,
  industry_exclusions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_non_negotiables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own non-negotiables" ON public.user_non_negotiables FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own non-negotiables" ON public.user_non_negotiables FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own non-negotiables" ON public.user_non_negotiables FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Jobs table
CREATE TYPE public.job_verdict AS ENUM ('go', 'review', 'stop');
CREATE TYPE public.job_status AS ENUM ('new', 'blocked', 'reviewing', 'saved', 'applied', 'archived');
CREATE TYPE public.job_source_type AS ENUM ('url', 'text', 'screenshot', 'voice');

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  company TEXT DEFAULT '',
  location TEXT DEFAULT '',
  salary_min INTEGER DEFAULT 0,
  salary_max INTEGER DEFAULT 0,
  salary_currency TEXT DEFAULT 'USD',
  work_model TEXT DEFAULT '',
  employment_type TEXT DEFAULT '',
  visa_policy TEXT DEFAULT '',
  language_requirements TEXT DEFAULT '',
  recruiter_name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  requirements_summary TEXT DEFAULT '',
  application_url TEXT DEFAULT '',
  source_type public.job_source_type DEFAULT 'url',
  source_input TEXT DEFAULT '',
  verdict public.job_verdict,
  status public.job_status NOT NULL DEFAULT 'new',
  fit_score NUMERIC(3,1),
  fit_confidence NUMERIC(3,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Job blockers table
CREATE TYPE public.blocker_severity AS ENUM ('confirmed', 'likely', 'unclear');

CREATE TABLE public.job_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  severity public.blocker_severity NOT NULL DEFAULT 'unclear',
  job_value TEXT DEFAULT '',
  user_value TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_blockers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blockers" ON public.job_blockers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blockers" ON public.job_blockers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own blockers" ON public.job_blockers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Job matches (fit analysis) table
CREATE TABLE public.job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fit_score NUMERIC(3,1) NOT NULL DEFAULT 0,
  fit_confidence NUMERIC(3,1) DEFAULT 0,
  strengths TEXT[] DEFAULT '{}',
  gaps TEXT[] DEFAULT '{}',
  recommendation TEXT DEFAULT '',
  salary_summary TEXT DEFAULT '',
  location_summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON public.job_matches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own matches" ON public.job_matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own matches" ON public.job_matches FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Application assets table
CREATE TABLE public.application_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL,
  content TEXT DEFAULT '',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.application_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets" ON public.application_assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.application_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.application_assets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.application_assets FOR DELETE TO authenticated USING (auth.uid() = user_id);
