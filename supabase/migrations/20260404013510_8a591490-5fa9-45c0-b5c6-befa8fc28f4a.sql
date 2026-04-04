
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-uploads', 'cv-uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('work-media', 'work-media', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonial-videos', 'testimonial-videos', false);

-- RLS for profile-photos (public read, auth upload/delete own)
CREATE POLICY "Anyone can view profile photos" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Users can upload profile photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update profile photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete profile photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS for cv-uploads
CREATE POLICY "Users can view own cvs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can upload cvs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own cvs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS for work-media
CREATE POLICY "Users can view own work media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'work-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can upload work media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'work-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own work media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'work-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS for certificates
CREATE POLICY "Users can view own certificates" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can upload certificates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own certificates" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS for testimonial-videos
CREATE POLICY "Users can view own testimonials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'testimonial-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can upload testimonials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'testimonial-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own testimonials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'testimonial-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
