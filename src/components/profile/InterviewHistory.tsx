import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { interviewAnalytics } from "@/lib/interviewAnalytics";

export default function InterviewHistory({ refreshKey, onOpen }: { refreshKey: number; onOpen: (session: any) => void }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    supabase.from("interview_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data, error }) => { setSessions(data || []); setError(error ? "Could not load saved interviews. Please try again." : ""); });
  }, [user?.id, refreshKey]);
  return <section className="space-y-3 border-t border-border pt-6">
    <h3 className="font-heading text-base font-semibold text-foreground">Saved interviews & progress</h3>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!error && sessions.length === 0 && <p className="text-sm text-muted-foreground">No saved interviews yet.</p>}
    {sessions.map(session => {
      const result = interviewAnalytics(session.feedback);
      return <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3">
        <div><p className="text-sm font-medium text-foreground">{new Date(session.created_at).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{result.answered} scored answers · {result.average === null ? "Not scored yet" : `${result.average}/10 average`}</p></div>
        <Button size="sm" variant="outline" onClick={() => onOpen(session)}>Review interview</Button>
      </div>;
    })}
  </section>;
}