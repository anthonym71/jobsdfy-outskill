import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import VerdictView from "@/components/VerdictView";
import { createJobTasks } from "@/lib/followups";
import type { RiskResult } from "@/lib/risk";
import type { VerdictResponse } from "../../supabase/functions/_shared/present";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DealbreakersCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerdictResponse | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [jobRef, setJobRef] = useState<{ id: string; title?: string | null; company?: string | null } | null>(null);

  useEffect(() => {
    if (!id || !session) return;
    runAnalysis();
  }, [id, session]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-dealbreakers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({ jobId: id }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast({ title: "Analysis failed", description: data.error || "Something went wrong.", variant: "destructive" });
        return;
      }

      setResult(data.data);
      const { data: jobRow } = await supabase.from("jobs").select("risk, title, company").eq("id", id!).single();
      setRisk((jobRow?.risk as unknown as RiskResult | null) ?? null);
      const ref = { id: id!, title: jobRow?.title, company: jobRow?.company };
      setJobRef(ref);
      // A REVIEW verdict means the posting is silent or vague on something that matters: remind the user to ask.
      if (data.data.verdict === "review") {
        const unclear = (data.data as VerdictResponse).blockers.filter((b) => b.state === "unknown").map((b) => b.category);
        await createJobTasks(supabase, session!.user.id, "needs_checking", ref, { unclear });
      }
    } catch (err) {
      console.error("Analysis error:", err);
      toast({ title: "Error", description: "Could not run dealbreaker analysis.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Logs the user's disagreement so wrong results can be added to the eval set.
  const reportWrong = async (limit?: string) => {
    await supabase.functions.invoke("log-event", {
      body: {
        action: limit ? "verdict_field_wrong" : "verdict_disagree",
        description: limit ? `User says the ${limit} result is wrong` : "User disagrees with the verdict",
        metadata: { jobId: id, verdict: result?.verdict, limit: limit ?? null },
      },
    });
    toast({ title: "Thanks, noted", description: "We will use this to check the verdict." });
  };

  const handleSave = async () => {
    await supabase.from("jobs").update({ status: "saved" }).eq("id", id!);
    const made = await createJobTasks(supabase, session!.user.id, "saved", jobRef ?? { id: id! });
    toast({ title: "Job saved", description: made ? "We added a task to decide on it in two days." : undefined });
  };

  const handleSkip = async () => {
    await supabase.from("jobs").update({ status: "archived" }).eq("id", id!);
    toast({ title: "Skipped", description: "Moved to your archive. You can find it under Jobs." });
    navigate("/app");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Checking the posting against your limits…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <p className="text-muted-foreground">The check could not be completed. Please try again.</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={runAnalysis}>Try again</Button>
          <Button variant="outline" onClick={() => navigate("/app")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <VerdictView
      result={result}
      risk={risk}
      onBack={() => navigate(-1)}
      onSave={handleSave}
      onSkip={handleSkip}
      onContinue={() => navigate(`/app/decision/${id}`)}
      onReportWrong={reportWrong}
    />
  );
};

export default DealbreakersCheck;
