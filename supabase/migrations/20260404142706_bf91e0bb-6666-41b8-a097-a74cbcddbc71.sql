
-- Fix views to use SECURITY INVOKER
DROP VIEW IF EXISTS public.recruiter_job_posts_public;
DROP VIEW IF EXISTS public.support_tickets_user_view;

CREATE VIEW public.recruiter_job_posts_public
WITH (security_invoker = true)
AS
SELECT
  id, user_id, title, company, country, city, work_model, travel_required, travel_percent,
  job_level, job_category, job_subcategory, employment_type, description, requirements,
  employee_provides, employer_provides, salary_currency, salary_basic, salary_ote,
  benefits, special_requirements, relocation_offered, language_primary, language_secondary,
  language_other, qualifications, application_url, application_email,
  show_email, show_phone,
  CASE WHEN show_email = true THEN recruiter_email ELSE NULL END AS recruiter_email,
  CASE WHEN show_email = true THEN recruiter_name ELSE NULL END AS recruiter_name,
  CASE WHEN show_phone = true THEN recruiter_phone ELSE NULL END AS recruiter_phone,
  CASE WHEN show_phone = true THEN phone_type ELSE NULL END AS phone_type,
  CASE WHEN show_phone = true THEN phone_extension ELSE NULL END AS phone_extension,
  is_active, created_at, updated_at
FROM recruiter_job_posts
WHERE is_active = true;

CREATE VIEW public.support_tickets_user_view
WITH (security_invoker = true)
AS
SELECT id, user_id, subject, description, category, status, created_at, updated_at
FROM support_tickets;
