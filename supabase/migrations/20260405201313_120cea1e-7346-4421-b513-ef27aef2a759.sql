
-- Books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  author TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'to_read',
  category TEXT DEFAULT 'general',
  notes TEXT DEFAULT '',
  rating INTEGER DEFAULT NULL,
  started_at DATE DEFAULT NULL,
  completed_at DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own books" ON public.books FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Memory dump table (memes, quotes, learnings)
CREATE TABLE public.memory_dump (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'quote',
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  source TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.memory_dump ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own memory_dump" ON public.memory_dump FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Social media posts table
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'own',
  content TEXT DEFAULT '',
  image_urls TEXT[] DEFAULT '{}',
  platforms JSONB DEFAULT '[]',
  follow_up_task TEXT DEFAULT '',
  follow_up_done BOOLEAN DEFAULT false,
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own social_posts" ON public.social_posts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Profile gallery table
CREATE TABLE public.profile_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own gallery" ON public.profile_gallery FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Gallery storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-gallery', 'profile-gallery', true);
CREATE POLICY "Users can upload gallery images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view gallery images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-gallery');
CREATE POLICY "Users can delete own gallery images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);
