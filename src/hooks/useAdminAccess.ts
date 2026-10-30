import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { adminPermissions, type AdminAccess } from "@/lib/admin-permissions";

export function useAdminAccess() {
  const { user } = useAuth();
  const [access, setAccess] = useState<AdminAccess>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setAccess(null); setLoading(true);
    if (!user) { setLoading(false); return; }
    supabase.from("admin_access").select("access_level").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!active) return;
      const tier = data?.access_level;
      setAccess(tier === "owner" || tier === "team" || tier === "judge" ? tier : null);
      setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);
  return { access, loading, ...adminPermissions(access) };
}