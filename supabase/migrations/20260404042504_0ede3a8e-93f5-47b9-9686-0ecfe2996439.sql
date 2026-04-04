CREATE TABLE public.cv_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  version_name TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  ats_keywords JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cv_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cv versions" ON public.cv_versions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cv versions" ON public.cv_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cv versions" ON public.cv_versions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cv versions" ON public.cv_versions FOR DELETE TO authenticated USING (auth.uid() = user_id);