
ALTER TABLE public.application_assets ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.application_assets ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT true;
ALTER TABLE public.application_assets ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone;
