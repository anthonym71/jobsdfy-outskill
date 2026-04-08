-- Remove the overly permissive INSERT policy on audit_logs
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

-- Create a SECURITY DEFINER function for audit logging (service_role only)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_user_email text,
  p_user_name text,
  p_action text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, user_email, user_name, action, description, metadata)
  VALUES (p_user_id, p_user_email, p_user_name, p_action, p_description, p_metadata);
END;
$$;

-- Restrict to service_role only (edge functions use service_role key)
REVOKE ALL ON FUNCTION public.log_audit_event FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_audit_event FROM authenticated;
REVOKE ALL ON FUNCTION public.log_audit_event FROM anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO service_role;