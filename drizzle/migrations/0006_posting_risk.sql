-- Posting risk check: warning signs found in a posting, saved with the job.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS risk jsonb;
