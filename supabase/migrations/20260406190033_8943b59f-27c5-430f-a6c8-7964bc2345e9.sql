
-- Prevent duplicate one-time credit rewards
CREATE UNIQUE INDEX idx_unique_onetime_credit ON credit_transactions (user_id, reason)
WHERE action = 'earned' AND reason IN (
  'profile_basic', 'profile_preferences', 'profile_skills', 'profile_nonneg',
  'first_job_check', 'complete_assessment', 'add_social_links',
  'streak_7', 'streak_30'
);

-- Update earn_credits function with duplicate check
CREATE OR REPLACE FUNCTION public.earn_credits(_user_id uuid, _reason text, _credits integer, _xp integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _allowed_reasons text[] := ARRAY[
    'profile_basic','profile_preferences','profile_skills','profile_nonneg',
    'first_job_check','complete_assessment','daily_login','referral_signup',
    'add_social_links','streak_7','streak_30'
  ];
  _expires_at timestamptz;
  _onetime_reasons text[] := ARRAY[
    'profile_basic','profile_preferences','profile_skills','profile_nonneg',
    'first_job_check','complete_assessment','add_social_links',
    'streak_7','streak_30'
  ];
BEGIN
  IF _user_id != auth.uid() THEN
    RETURN false;
  END IF;

  IF NOT (_reason = ANY(_allowed_reasons)) THEN
    RETURN false;
  END IF;

  IF _credits < 0 OR _credits > 50 OR _xp < 0 OR _xp > 500 THEN
    RETURN false;
  END IF;

  -- For one-time rewards, check if already claimed
  IF _reason = ANY(_onetime_reasons) THEN
    IF EXISTS (SELECT 1 FROM credit_transactions WHERE user_id = _user_id AND reason = _reason AND action = 'earned') THEN
      RETURN false;
    END IF;
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
$function$;
