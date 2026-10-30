CREATE OR REPLACE FUNCTION public.guard_outskill_writes() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
 IF public.is_read_only_admin(auth.uid()) THEN RAISE EXCEPTION 'Judges have read-only access'; END IF;
 IF TG_TABLE_NAME='user_profiles' AND TG_OP='UPDATE' AND new.status='cancelled' AND old.status IS DISTINCT FROM new.status AND NOT public.is_owner(auth.uid()) AND auth.uid() IS DISTINCT FROM new.user_id THEN RAISE EXCEPTION 'Only the owner may cancel another user'; END IF;
 IF TG_OP='DELETE' THEN RETURN old; END IF; RETURN new;
 END $$;
DO $$ DECLARE t record; BEGIN FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('user_terms_acceptance','admin_access') LOOP EXECUTE format('CREATE TRIGGER outskill_guard_writes BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_outskill_writes()',t.tablename); END LOOP; END $$;
CREATE OR REPLACE FUNCTION public.revoke_unverified_admin_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF new.email_confirmed_at IS NULL OR lower(new.email) NOT IN ('anthony@ifactoryusa.com','judges@jobsdfy.com','anthony@fflipi.com','skshsn@gmail.com','sshimoga@gmail.com','shahnomaan1@gmail.com','sajvindersingh8@gmail.com','saikishore.g.5@gmail.com') THEN
  IF EXISTS(SELECT 1 FROM public.admin_access WHERE user_id=new.id) THEN
   DELETE FROM public.admin_access WHERE user_id=new.id;
   DELETE FROM public.user_roles WHERE user_id=new.id AND role='admin';
  END IF;
 END IF; RETURN new;
 END $$;
CREATE TRIGGER outskill_revoke_admin AFTER UPDATE OF email,email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.revoke_unverified_admin_access();