-- India-ready hard limits: notice period, office days per week, spoken languages, time zone.
ALTER TABLE public.user_non_negotiables
  ADD COLUMN IF NOT EXISTS notice_period_days integer CHECK (notice_period_days IS NULL OR notice_period_days BETWEEN 0 AND 365),
  ADD COLUMN IF NOT EXISTS max_office_days integer CHECK (max_office_days IS NULL OR max_office_days BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS utc_offset numeric CHECK (utc_offset IS NULL OR utc_offset BETWEEN -12 AND 14);
