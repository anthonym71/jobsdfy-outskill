ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS to_be_posted boolean NOT NULL DEFAULT false;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS due_date date;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS source_id uuid;