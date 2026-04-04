
-- ============================================================
-- 1. CREDIT SYSTEM: Create SECURITY DEFINER functions for all credit operations
-- ============================================================

-- Function to initialize credits for a new user (called from client)
CREATE OR REPLACE FUNCTION public.initialize_user_credits(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance, lifetime_earned, xp, level, streak_days)
  VALUES (_user_id, 3, 3, 0, 1, 0)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function to earn credits (validates reason against allowed list)
CREATE OR REPLACE FUNCTION public.earn_credits(_user_id uuid, _reason text, _credits int, _xp int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _allowed_reasons text[] := ARRAY[
    'profile_basic','profile_preferences','profile_skills','profile_nonneg',
    'first_job_check','complete_assessment','daily_login','referral_signup',
    'add_social_links','streak_7','streak_30'
  ];
  _expires_at timestamptz;
BEGIN
  -- Only allow the authenticated user to earn for themselves
  IF _user_id != auth.uid() THEN
    RETURN false;
  END IF;

  -- Validate reason
  IF NOT (_reason = ANY(_allowed_reasons)) THEN
    RETURN false;
  END IF;

  -- Validate amounts
  IF _credits < 0 OR _credits > 50 OR _xp < 0 OR _xp > 500 THEN
    RETURN false;
  END IF;

  _expires_at := now() + interval '30 days';

  INSERT INTO credit_transactions (user_id, amount, action, reason, expires_at)
  VALUES (_user_id, _credits, 'earned', _reason, _expires_at);

  UPDATE user_credits SET
    balance = balance + _credits,
    lifetime_earned = lifetime_earned + _credits,
    xp = xp + _xp,
    level = GREATEST(1, (
      SELECT count(*) FROM unnest(ARRAY[0,100,300,600,1000,1500,2200,3000,4000,5500,7500,10000]) t(v)
      WHERE (xp + _xp) >= t.v
    )),
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN true;
END;
$$;

-- Function to spend credits
CREATE OR REPLACE FUNCTION public.spend_credits(_user_id uuid, _amount int, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_balance int;
BEGIN
  IF _user_id != auth.uid() THEN
    RETURN false;
  END IF;

  IF _amount <= 0 OR _amount > 100 THEN
    RETURN false;
  END IF;

  SELECT balance INTO _current_balance FROM user_credits WHERE user_id = _user_id FOR UPDATE;

  IF _current_balance IS NULL OR _current_balance < _amount THEN
    RETURN false;
  END IF;

  INSERT INTO credit_transactions (user_id, amount, action, reason)
  VALUES (_user_id, -_amount, 'spent', _reason);

  UPDATE user_credits SET balance = balance - _amount, updated_at = now()
  WHERE user_id = _user_id;

  RETURN true;
END;
$$;

-- Remove direct user INSERT/UPDATE on user_credits (keep SELECT and admin policies)
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;

-- Remove direct user INSERT on credit_transactions (keep SELECT and admin policies)
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;

-- ============================================================
-- 2. REFERRAL CODES: Replace blanket anon SELECT with a validation function
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read referral codes by code" ON referral_codes;

CREATE OR REPLACE FUNCTION public.validate_referral_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM referral_codes WHERE code = _code);
$$;

-- ============================================================
-- 3. RECRUITER CONTACT: Create a view that hides contact when flags are off
-- ============================================================

CREATE OR REPLACE VIEW public.recruiter_job_posts_public AS
SELECT
  id, user_id, title, company, country, city, work_model, travel_required, travel_percent,
  job_level, job_category, job_subcategory, employment_type, description, requirements,
  employee_provides, employer_provides, salary_currency, salary_basic, salary_ote,
  benefits, special_requirements, relocation_offered, language_primary, language_secondary,
  language_other, qualifications, application_url, application_email,
  show_email, show_phone,
  CASE WHEN show_email = true THEN recruiter_email ELSE NULL END AS recruiter_email,
  CASE WHEN show_email = true THEN recruiter_name ELSE NULL END AS recruiter_name,
  CASE WHEN show_phone = true THEN recruiter_phone ELSE NULL END AS recruiter_phone,
  CASE WHEN show_phone = true THEN phone_type ELSE NULL END AS phone_type,
  CASE WHEN show_phone = true THEN phone_extension ELSE NULL END AS phone_extension,
  is_active, created_at, updated_at
FROM recruiter_job_posts
WHERE is_active = true;

-- ============================================================
-- 4. SUPPORT TICKETS: Create a view excluding admin_notes for users
-- ============================================================

CREATE OR REPLACE VIEW public.support_tickets_user_view AS
SELECT id, user_id, subject, description, category, status, created_at, updated_at
FROM support_tickets;
