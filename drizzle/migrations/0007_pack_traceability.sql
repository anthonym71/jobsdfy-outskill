-- Application pack traceability: which profile record each claim came from, stored with the resume asset.
ALTER TABLE public.application_assets ADD COLUMN IF NOT EXISTS trace jsonb;
