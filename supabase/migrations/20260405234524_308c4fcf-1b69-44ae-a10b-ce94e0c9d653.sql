
-- Phase 1, Migration 1: Update initialize_user_credits to give 12 credits
CREATE OR REPLACE FUNCTION public.initialize_user_credits(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO user_credits (user_id, balance, lifetime_earned, xp, level, streak_days)
  VALUES (_user_id, 12, 12, 0, 1, 0)
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Phase 1, Migration 4: Add first_job_used column to user_credits
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS first_job_used boolean DEFAULT false;

-- Phase 1, Migration 3: Add referral_link column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_link text DEFAULT '';

-- Phase 1, Migration 2: Affiliate program tables
CREATE TABLE IF NOT EXISTS affiliate_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  referral_code text UNIQUE NOT NULL,
  total_signups integer DEFAULT 0,
  paying_signups integer DEFAULT 0,
  total_earned numeric DEFAULT 0,
  payout_method text DEFAULT '',
  payout_details text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate data" ON affiliate_partners
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate data" ON affiliate_partners
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate data" ON affiliate_partners
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliate data" ON affiliate_partners
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all affiliate data" ON affiliate_partners
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliate_partners(id),
  referred_user_id uuid NOT NULL,
  purchase_amount numeric DEFAULT 0,
  commission_rate numeric DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own conversions" ON affiliate_conversions
  FOR SELECT TO authenticated USING (
    affiliate_id IN (SELECT id FROM affiliate_partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all conversions" ON affiliate_conversions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage conversions" ON affiliate_conversions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Phase 4: Page views table for analytics
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT '',
  referrer text DEFAULT '',
  user_agent text DEFAULT '',
  ip_hash text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view page views" ON page_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
