
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  provider text DEFAULT '',
  category text DEFAULT 'general',
  status text NOT NULL DEFAULT 'to_start',
  certificate_url text DEFAULT '',
  grade text DEFAULT '',
  achievement_level text DEFAULT '',
  notes text DEFAULT '',
  started_at date,
  completed_at date,
  recommended_by text DEFAULT '',
  is_recommended boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own courses" ON public.courses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE TO authenticated USING (auth.uid() = user_id);
