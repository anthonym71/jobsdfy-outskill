
-- Movies table
CREATE TABLE public.movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  genre text DEFAULT '',
  rating integer,
  comments text DEFAULT '',
  takeaway text DEFAULT '',
  watched_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own movies" ON public.movies FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recommended training table
CREATE TABLE public.recommended_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  provider text DEFAULT '',
  category text DEFAULT 'general',
  reason text DEFAULT '',
  recommended_by text DEFAULT 'ai',
  url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recommended_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own training" ON public.recommended_training FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add slug to affiliate_partners
ALTER TABLE public.affiliate_partners ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add slug to referral_codes
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS slug text UNIQUE;
