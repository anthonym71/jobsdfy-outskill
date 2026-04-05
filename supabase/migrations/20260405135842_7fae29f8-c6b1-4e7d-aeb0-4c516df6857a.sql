
-- User Groups table (admin-managed)
CREATE TABLE public.user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage groups" ON public.user_groups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User Group Members table
CREATE TABLE public.user_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group members" ON public.user_group_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Knowledgebase entries table
CREATE TABLE public.knowledgebase_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_name TEXT DEFAULT '',
  is_relevant BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledgebase_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own knowledgebase" ON public.knowledgebase_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledgebase" ON public.knowledgebase_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledgebase" ON public.knowledgebase_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledgebase" ON public.knowledgebase_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add email column to user_profiles for admin visibility
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
