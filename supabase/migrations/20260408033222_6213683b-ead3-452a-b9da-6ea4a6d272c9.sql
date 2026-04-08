
-- 1. Recruiter: remove broad SELECT that exposes contact info on raw table
DROP POLICY IF EXISTS "Anyone can view active recruiter posts" ON public.recruiter_job_posts;

-- 2. Companies: create public view without sensitive columns
CREATE OR REPLACE VIEW public.companies_public WITH (security_barrier = true) AS
SELECT id, name, domain, logo_url, description, industry,
       location, size, website_url, is_verified, created_at, updated_at
FROM public.companies
WHERE is_verified = true;

GRANT SELECT ON public.companies_public TO anon, authenticated;

-- Drop overly broad SELECT policy on raw companies table
DROP POLICY IF EXISTS "Anyone can view verified companies" ON public.companies;

-- 3. Support tickets: update user query to use existing view
-- The view support_tickets_user_view already exists and excludes admin_notes.
-- Drop the user SELECT policy on the base table so users must use the view.
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
