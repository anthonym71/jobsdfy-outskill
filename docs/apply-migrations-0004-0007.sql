-- JobsDFY migrations 0004 to 0007, in order. Every statement is additive and idempotent (IF NOT EXISTS).
-- Run in the Supabase SQL editor (or apply via your migration tool) BEFORE deploying the edge functions.

-- ===== 0004_verdict_evidence.sql =====
-- Verdict engine v2: keep the AI's quoted evidence on the job, and store a quote + state per checked limit.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS extraction jsonb,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.job_blockers
  ADD COLUMN IF NOT EXISTS limit_key text,
  ADD COLUMN IF NOT EXISTS state text CHECK (state IN ('pass', 'fail', 'unknown')),
  ADD COLUMN IF NOT EXISTS quote text,
  ADD COLUMN IF NOT EXISTS soft boolean NOT NULL DEFAULT false;

-- ===== 0005_india_limits.sql =====
-- India-ready hard limits: notice period, office days per week, spoken languages, time zone.
ALTER TABLE public.user_non_negotiables
  ADD COLUMN IF NOT EXISTS notice_period_days integer CHECK (notice_period_days IS NULL OR notice_period_days BETWEEN 0 AND 365),
  ADD COLUMN IF NOT EXISTS max_office_days integer CHECK (max_office_days IS NULL OR max_office_days BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS utc_offset numeric CHECK (utc_offset IS NULL OR utc_offset BETWEEN -12 AND 14);

-- ===== 0006_posting_risk.sql =====
-- Posting risk check: warning signs found in a posting, saved with the job.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS risk jsonb;

-- ===== 0007_pack_traceability.sql =====
-- Application pack traceability: which profile record each claim came from, stored with the resume asset.
ALTER TABLE public.application_assets ADD COLUMN IF NOT EXISTS trace jsonb;

