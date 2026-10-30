CREATE OR REPLACE FUNCTION public.guard_outskill_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF public.is_read_only_admin(auth.uid()) THEN RAISE EXCEPTION 'Judges have read-only access'; END IF;
 IF TG_TABLE_NAME = 'user_profiles' AND TG_OP = 'UPDATE' THEN
  IF to_jsonb(new)->>'status' = 'cancelled' AND (to_jsonb(old)->>'status') IS DISTINCT FROM 'cancelled'
     AND NOT public.is_owner(auth.uid()) AND auth.uid() IS DISTINCT FROM new.user_id THEN
   RAISE EXCEPTION 'Only the owner may cancel another user';
  END IF;
 END IF;
 IF TG_OP = 'DELETE' THEN RETURN old; END IF;
 RETURN new;
END $$;