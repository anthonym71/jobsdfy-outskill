CREATE TABLE public.user_terms_acceptance (user_id uuid PRIMARY KEY, terms_accepted_at timestamptz NOT NULL DEFAULT now(), terms_version text NOT NULL);
GRANT SELECT ON public.user_terms_acceptance TO authenticated;
GRANT ALL ON public.user_terms_acceptance TO service_role;
ALTER TABLE public.user_terms_acceptance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own acceptance" ON public.user_terms_acceptance FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.admin_access (user_id uuid PRIMARY KEY, access_level text NOT NULL CHECK (access_level IN ('owner','team','judge')));
GRANT SELECT ON public.admin_access TO authenticated;
GRANT ALL ON public.admin_access TO service_role;
ALTER TABLE public.admin_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own admin access" ON public.admin_access FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = _user_id AND access_level = 'owner') $$;
CREATE OR REPLACE FUNCTION public.is_read_only_admin(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = _user_id AND access_level = 'judge') $$;
CREATE OR REPLACE FUNCTION public.can_write_admin(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.has_role(_user_id, 'admin') AND EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = _user_id AND access_level IN ('owner','team')) $$;
CREATE OR REPLACE FUNCTION public.accept_current_terms(_version text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF; IF _version <> '2026-10-30' OR _version IS NULL THEN RAISE EXCEPTION 'Current terms version required'; END IF; INSERT INTO public.user_terms_acceptance(user_id, terms_version, terms_accepted_at) VALUES(auth.uid(), _version, now()) ON CONFLICT(user_id) DO UPDATE SET terms_version = EXCLUDED.terms_version, terms_accepted_at = EXCLUDED.terms_accepted_at; END $$;
REVOKE ALL ON FUNCTION public.accept_current_terms(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_current_terms(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.outskill_signup_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE tier text; BEGIN
 IF TG_OP = 'INSERT' THEN
  IF COALESCE(new.raw_user_meta_data->>'terms_version','') <> '2026-10-30' OR COALESCE(new.raw_user_meta_data->>'terms_accepted','false') <> 'true' THEN RAISE EXCEPTION 'Please accept the current Terms & Conditions'; END IF;
  INSERT INTO public.user_terms_acceptance(user_id, terms_version) VALUES(new.id,'2026-10-30') ON CONFLICT DO NOTHING;
 END IF;
 IF new.email_confirmed_at IS NOT NULL THEN
  tier := CASE lower(new.email) WHEN 'anthony@ifactoryusa.com' THEN 'owner' WHEN 'judges@jobsdfy.com' THEN 'judge' WHEN 'anthony@fflipi.com' THEN 'team' WHEN 'skshsn@gmail.com' THEN 'team' WHEN 'sshimoga@gmail.com' THEN 'team' WHEN 'shahnomaan1@gmail.com' THEN 'team' WHEN 'sajvindersingh8@gmail.com' THEN 'team' WHEN 'saikishore.g.5@gmail.com' THEN 'team' ELSE NULL END;
  IF tier IS NOT NULL THEN
   INSERT INTO public.admin_access(user_id,access_level) VALUES(new.id,tier) ON CONFLICT(user_id) DO UPDATE SET access_level=EXCLUDED.access_level;
   INSERT INTO public.user_roles(user_id,role) SELECT new.id,'admin' WHERE NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=new.id AND role='admin');
  END IF;
 END IF;
 RETURN new;
 END $$;
CREATE TRIGGER outskill_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.outskill_signup_access();
CREATE TRIGGER outskill_user_verified AFTER UPDATE OF email_confirmed_at,email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.outskill_signup_access();
INSERT INTO public.admin_access(user_id,access_level) SELECT id, CASE WHEN lower(email)='anthony@ifactoryusa.com' THEN 'owner' WHEN lower(email)='judges@jobsdfy.com' THEN 'judge' ELSE 'team' END FROM auth.users WHERE email_confirmed_at IS NOT NULL AND lower(email) IN ('anthony@ifactoryusa.com','judges@jobsdfy.com','anthony@fflipi.com','skshsn@gmail.com','sshimoga@gmail.com','shahnomaan1@gmail.com','sajvindersingh8@gmail.com','saikishore.g.5@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles(user_id,role) SELECT a.user_id,'admin' FROM public.admin_access a WHERE NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=a.user_id AND r.role='admin');
DO $$ DECLARE p record; q text; c text; t record; BEGIN
 FOR p IN SELECT * FROM pg_policies WHERE schemaname='public' AND (cmd IN ('INSERT','UPDATE','DELETE','ALL')) AND (COALESCE(qual,'') LIKE '%has_role%' OR COALESCE(with_check,'') LIKE '%has_role%') LOOP
  q := p.qual; c := p.with_check;
  IF p.tablename IN ('user_roles','app_settings') THEN q := replace(q,'has_role(auth.uid(), ''admin''::app_role)','is_owner(auth.uid())'); c := replace(c,'has_role(auth.uid(), ''admin''::app_role)','is_owner(auth.uid())');
  ELSE q := replace(q,'has_role(auth.uid(), ''admin''::app_role)','can_write_admin(auth.uid())'); c := replace(c,'has_role(auth.uid(), ''admin''::app_role)','can_write_admin(auth.uid())'); END IF;
  EXECUTE format('ALTER POLICY %I ON public.%I %s %s', p.policyname,p.tablename,CASE WHEN q IS NOT NULL THEN 'USING ('||q||')' ELSE '' END,CASE WHEN c IS NOT NULL THEN 'WITH CHECK ('||c||')' ELSE '' END);
  IF p.cmd='ALL' THEN EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))','Outskill admin read',p.tablename); END IF;
 END LOOP;
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('user_terms_acceptance','admin_access') LOOP
  EXECUTE format('CREATE POLICY "Outskill judges no insert" ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_read_only_admin(auth.uid()))',t.tablename);
  EXECUTE format('CREATE POLICY "Outskill judges no update" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_read_only_admin(auth.uid())) WITH CHECK (NOT public.is_read_only_admin(auth.uid()))',t.tablename);
  EXECUTE format('CREATE POLICY "Outskill judges no delete" ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (NOT public.is_read_only_admin(auth.uid()))',t.tablename);
 END LOOP;
END $$;
CREATE POLICY "Owner only role insert" ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.is_owner(auth.uid()));
CREATE POLICY "Owner only role update" ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.is_owner(auth.uid())) WITH CHECK(public.is_owner(auth.uid()));
CREATE POLICY "Owner only role delete" ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated USING(public.is_owner(auth.uid()));
CREATE POLICY "Owner only settings insert" ON public.app_settings AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.is_owner(auth.uid()));
CREATE POLICY "Owner only settings update" ON public.app_settings AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.is_owner(auth.uid())) WITH CHECK(public.is_owner(auth.uid()));
CREATE POLICY "Owner only settings delete" ON public.app_settings AS RESTRICTIVE FOR DELETE TO authenticated USING(public.is_owner(auth.uid()));
CREATE POLICY "Owner only user deletion" ON public.user_profiles AS RESTRICTIVE FOR DELETE TO authenticated USING(public.is_owner(auth.uid()));