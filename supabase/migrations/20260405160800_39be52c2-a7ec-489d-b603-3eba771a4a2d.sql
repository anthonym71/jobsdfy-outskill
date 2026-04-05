
-- Add new job status values
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'listed';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'interview';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'pending_decision';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'lost';

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);
