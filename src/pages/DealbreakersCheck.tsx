import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import VerdictBadge, { type Verdict } from "@/components/VerdictBadge";
import BlockerCard from "@/components/BlockerCard";
import { ArrowRight, Bookmark, Eye, SkipForward, ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const verdictStyles: Record<Verdict, { banner: string; text: string }> = {
  go: { banner: "verdict-banner-go", text: "text-verdict-go" },
  review: { banner: "verdict-banner-review", text: "text-verdict-review" },
  stop: { banner: "verdict-banner-stop", text: "text-verdict-stop" },
};

const verdictMessages: Record<Verdict, string> = {
  go: "This role looks like a strong match. No hard blockers detected.",
  review: "Some details are unclear or partially mismatched. Worth investigating before applying.",
  stop: "We found a likely dealbreaker before you waste time.",
};

interface AnalysisResult {
  verdict: Verdict;
  summary: string;
  blockers: Array<{
    category: string;
    status: "confirmed" | "ok" | "unclear";
    severity: "confirmed" | "likely" | "unclear";
    userValue: string;
    jobValue: string;
    note?: string;
  }>;
  alignment: Array<{ label: string; aligned: boolean }>;
}

const DealbreakersCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!id || !session) return;
    runAnalysis();
  }, [id, session]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-dealbreakers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session!.access_token}`,
          },
          body: JSON.stringify({ jobId: id }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        toast({ title: "Analysis failed", description: data.error || "Something went wrong.", variant: "destructive" });
        return;
      }

      setResult(data.data);
    } catch (err) {
      console.error("Analysis error:", err);
      toast({ title: "Error", description: "Could not run dealbreaker analysis.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await supabase.from("jobs").update({ status: "saved" }).eq("id", id!);
    toast({ title: "Job saved" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analyzing dealbreakers…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Analysis could not be completed. Please try again.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { verdict, blockers, alignment } = result;
  const vs = verdictStyles[verdict];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Verdict Banner */}
      <div className={`rounded-xl border p-6 md:p-8 ${vs.banner}`}>
        <div className="flex flex-col items-center text-center gap-4">
          <ShieldAlert className={`h-10 w-10 ${vs.text}`} />
          <VerdictBadge verdict={verdict} size="lg" />
          <p className={`text-sm font-medium ${vs.text} max-w-md`}>
            {verdictMessages[verdict]}
          </p>
        </div>
      </div>

      {/* Alignment Summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-base font-semibold text-foreground mb-4">Quick Alignment</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {alignment.map((a) => (
            <div key={a.label} className={`rounded-lg p-3 text-center text-sm font-medium ${a.aligned ? "bg-verdict-go-bg text-verdict-go" : "bg-verdict-stop-bg text-verdict-stop"}`}>
              {a.aligned ? "✓" : "✗"} {a.label}
            </div>
          ))}
        </div>
      </div>

      {/* Blocker Cards */}
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground mb-4">Detailed Breakdown</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {blockers.map((b, i) => (
            <BlockerCard key={i} {...b} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between rounded-xl border border-border bg-card p-5">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")}><SkipForward className="mr-1.5 h-4 w-4" />Skip</Button>
          <Button variant="outline" size="sm" onClick={handleSave}><Bookmark className="mr-1.5 h-4 w-4" />Save</Button>
        </div>
        <Button size="sm" onClick={() => navigate(`/app/decision/${id}`)}>
          Continue Anyway
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DealbreakersCheck;
