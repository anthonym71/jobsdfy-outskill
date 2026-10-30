import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FitScoreCard from "@/components/FitScoreCard";
import { ArrowRight, Bookmark, SkipForward, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FitResult {
  score: number;
  confidence: "low" | "medium" | "high";
  strengths: string[];
  gaps: string[];
  recommendation: string;
  salarySummary: string;
  locationSummary: string;
}

const FastDecision = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fit, setFit] = useState<FitResult | null>(null);

  useEffect(() => {
    if (!id || !session) return;
    runFitAnalysis();
  }, [id, session]);

  const runFitAnalysis = async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-fit`,
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
        toast({ title: "Fit analysis failed", description: data.error || "Something went wrong.", variant: "destructive" });
        return;
      }
      setFit(data.data);
    } catch (err) {
      console.error("Fit analysis error:", err);
      toast({ title: "Error", description: "Could not run fit analysis.", variant: "destructive" });
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
        <p className="text-sm text-muted-foreground">Analyzing fit…</p>
      </div>
    );
  }

  if (!fit) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Fit analysis could not be completed.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Fit Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">How well this role matches your profile.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <FitScoreCard score={fit.score} confidence={fit.confidence} />

        <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <h3 className="font-heading text-sm font-semibold text-verdict-go mb-2">Top Strengths</h3>
            <ul className="space-y-1.5">
              {fit.strengths.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-verdict-go mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-verdict-review mb-2">Gaps to Consider</h3>
            <ul className="space-y-1.5">
              {fit.gaps.map((g, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-verdict-review mt-0.5">!</span>{g}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-accent p-4">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-1">Recommendation</h3>
            <p className="text-sm text-muted-foreground">{fit.recommendation}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Salary</p>
              <p className="font-medium text-foreground">{fit.salarySummary}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="font-medium text-foreground">{fit.locationSummary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {fit.score < 70 && <div className="rounded-xl border border-verdict-review bg-card p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-heading font-semibold text-foreground">Not a strong fit yet</h2><p className="text-sm text-muted-foreground">Would you like to tailor your CV now to show more relevant experience? Facts will not be invented.</p></div>
        <Button onClick={() => navigate(`/app/apply/${id}?tailor=1`)}>Tailor my CV now</Button>
      </div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between rounded-xl border border-border bg-card p-5">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")}><SkipForward className="mr-1.5 h-4 w-4" />Skip</Button>
          <Button variant="outline" size="sm" onClick={handleSave}><Bookmark className="mr-1.5 h-4 w-4" />Save</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Lock className="mr-1.5 h-4 w-4" />Deep Dive
            <span className="ml-1.5 text-xs text-muted-foreground">(Coming Soon)</span>
          </Button>
          <Button size="sm" onClick={() => navigate(`/app/apply/${id}`)}>
            Quick Apply
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FastDecision;
