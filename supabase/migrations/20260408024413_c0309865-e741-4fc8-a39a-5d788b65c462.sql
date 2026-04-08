
-- Expand events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS area text DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_price numeric DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_name text DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_end_date timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_attendees integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Allow any authenticated user to create events (not just admins)
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Users can insert own events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Allow public (anon) to view active events
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Owners can view own events" ON public.events FOR SELECT TO authenticated USING (auth.uid() = created_by);

-- Event registrations table (with marketing consent)
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  consent_host_email boolean NOT NULL DEFAULT false,
  consent_host_sms boolean NOT NULL DEFAULT false,
  consent_platform_email boolean NOT NULL DEFAULT false,
  consent_platform_sms boolean NOT NULL DEFAULT false,
  ticket_code text,
  payment_status text DEFAULT 'free',
  stripe_payment_id text,
  amount_paid numeric DEFAULT 0,
  platform_fee numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own registrations" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own registrations" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Event owners can view registrations" ON public.event_registrations FOR SELECT TO authenticated USING (
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
);
CREATE POLICY "Admins can view all registrations" ON public.event_registrations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  logo_url text DEFAULT '',
  description text DEFAULT '',
  website_url text DEFAULT '',
  industry text DEFAULT '',
  size text DEFAULT '',
  location text DEFAULT '',
  is_verified boolean NOT NULL DEFAULT false,
  admin_user_id uuid NOT NULL,
  verification_token text,
  verified_at timestamptz,
  scraped_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified companies" ON public.companies FOR SELECT TO anon, authenticated USING (is_verified = true);
CREATE POLICY "Owners can view own companies" ON public.companies FOR SELECT TO authenticated USING (auth.uid() = admin_user_id);
CREATE POLICY "Users can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_user_id);
CREATE POLICY "Owners can update own companies" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = admin_user_id) WITH CHECK (auth.uid() = admin_user_id);
CREATE POLICY "Admins can manage all companies" ON public.companies FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
