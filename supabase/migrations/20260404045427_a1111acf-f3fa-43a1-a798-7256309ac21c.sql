CREATE TABLE public.generated_artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  artifact_type TEXT NOT NULL,
  version_label TEXT DEFAULT '',
  output_json JSONB DEFAULT '{}'::jsonb,
  credit_cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own artifacts" ON public.generated_artifacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own artifacts" ON public.generated_artifacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own artifacts" ON public.generated_artifacts FOR DELETE TO authenticated USING (auth.uid() = user_id);