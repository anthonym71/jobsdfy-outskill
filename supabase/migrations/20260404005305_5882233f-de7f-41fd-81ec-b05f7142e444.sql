
-- Recruiter job posts table
CREATE TABLE public.recruiter_job_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Core
  title text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  work_model text NOT NULL DEFAULT 'onsite', -- remote, onsite, hybrid
  travel_required boolean NOT NULL DEFAULT false,
  travel_percent integer DEFAULT 0,
  
  -- Classification
  job_level text NOT NULL DEFAULT '', -- C-Suite, Director, Manager, Supervisor, Senior, Mid, Junior, Intern
  job_category text NOT NULL DEFAULT '', -- Sales, Marketing, Finance, IT, HR, etc.
  job_subcategory text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT 'full-time', -- full-time, part-time, contract, freelance
  
  -- Description
  description text NOT NULL DEFAULT '',
  requirements text NOT NULL DEFAULT '',
  employee_provides text DEFAULT '',
  employer_provides text DEFAULT '',
  
  -- Compensation
  salary_currency text NOT NULL DEFAULT 'USD',
  salary_basic integer DEFAULT 0,
  salary_ote integer DEFAULT 0,
  benefits text[] DEFAULT '{}',
  
  -- Other
  special_requirements text DEFAULT '',
  relocation_offered boolean DEFAULT false,
  language_primary text DEFAULT '',
  language_secondary text DEFAULT '',
  language_other text DEFAULT '',
  qualifications text DEFAULT '',
  
  -- Recruiter contact visibility
  show_email boolean NOT NULL DEFAULT false,
  show_phone boolean NOT NULL DEFAULT false,
  phone_type text DEFAULT 'mobile', -- mobile, landline
  phone_extension text DEFAULT '',
  recruiter_email text DEFAULT '',
  recruiter_phone text DEFAULT '',
  recruiter_name text DEFAULT '',
  
  -- Application
  application_url text DEFAULT '',
  application_email text DEFAULT ''
);

-- Enable RLS
ALTER TABLE public.recruiter_job_posts ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD own posts
CREATE POLICY "Users can view own recruiter posts" ON public.recruiter_job_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recruiter posts" ON public.recruiter_job_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recruiter posts" ON public.recruiter_job_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own recruiter posts" ON public.recruiter_job_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Anyone authenticated can view active posts (job board)
CREATE POLICY "Anyone can view active recruiter posts" ON public.recruiter_job_posts FOR SELECT TO authenticated USING (is_active = true);

-- Admins can view all
CREATE POLICY "Admins can view all recruiter posts" ON public.recruiter_job_posts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- User tags table for admin
CREATE TABLE public.user_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tag text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag)
);

ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

-- Only admins can manage tags
CREATE POLICY "Admins can view all user tags" ON public.user_tags FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert user tags" ON public.user_tags FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete user tags" ON public.user_tags FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin needs to read all user_profiles and user_credits
CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all credits" ON public.user_credits FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update any credits" ON public.user_credits FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert credit transactions" ON public.credit_transactions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
