
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status_reason text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status_updated_at timestamp with time zone;

-- Allow admins to update any user profile (for editing name/phone/email and suspending)
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
