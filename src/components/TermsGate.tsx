import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import TermsCheckbox from "@/components/TermsCheckbox";
import { hasCurrentTerms, TERMS_VERSION } from "@/lib/terms";

export default function TermsGate() {
  const { user, signOut } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setAccepted(false); setChecked(false); setLoading(true);
    if (!user) return;
    supabase.from("user_terms_acceptance").select("terms_version").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      setAccepted(!error && hasCurrentTerms(data));
      setError(error ? "Unable to check terms acceptance. Please try again." : "");
      setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);
  const accept = async () => {
    if (!checked) return;
    setSaving(true); setError("");
    const { error } = await supabase.rpc("accept_current_terms", { _version: TERMS_VERSION });
    if (error) setError("Unable to save acceptance. Please try again.");
    else setAccepted(true);
    setSaving(false);
  };
  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  if (accepted) return <Outlet />;
  return <main className="min-h-screen flex items-center justify-center bg-background px-6">
    <div className="max-w-md space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Terms &amp; Conditions</h1>
      <p className="text-muted-foreground">Please accept the current terms ({TERMS_VERSION}) before continuing to JobsDFY Outskill.</p>
      <TermsCheckbox checked={checked} onChange={setChecked} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3"><Button onClick={accept} disabled={!checked || saving}>{saving ? "Saving…" : "Accept and Continue"}</Button><Button variant="outline" onClick={signOut}>Sign Out</Button></div>
    </div>
  </main>;
}