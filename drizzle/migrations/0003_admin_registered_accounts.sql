CREATE OR REPLACE FUNCTION public.admin_list_registered_users()
RETURNS TABLE (user_id uuid, full_name text, email text, phone_number text, location text, headline text, created_at timestamptz, status text, status_reason text, user_type text, has_profile boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT u.id, COALESCE(NULLIF(p.full_name, ''), NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
    u.email::text, p.phone_number, p.location, p.headline, u.created_at,
    COALESCE(p.status, 'active'), p.status_reason,
    CASE WHEN a.access_level = 'owner' THEN 'Owner' WHEN a.access_level = 'team' THEN 'Team Admin' WHEN a.access_level = 'judge' THEN 'Judge' WHEN public.has_role(u.id, 'admin') THEN 'Admin' ELSE 'User' END,
    p.id IS NOT NULL
  FROM auth.users u LEFT JOIN public.user_profiles p ON p.user_id = u.id
  LEFT JOIN public.admin_access a ON a.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_registered_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_registered_users() TO authenticated;