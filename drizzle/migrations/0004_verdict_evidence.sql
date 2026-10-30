-- Verdict engine v2: keep the AI's quoted evidence on the job, and store a quote + state per checked limit.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS extraction jsonb,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.job_blockers
  ADD COLUMN IF NOT EXISTS limit_key text,
  ADD COLUMN IF NOT EXISTS state text CHECK (state IN ('pass', 'fail', 'unknown')),
  ADD COLUMN IF NOT EXISTS quote text,
  ADD COLUMN IF NOT EXISTS soft boolean NOT NULL DEFAULT false;
