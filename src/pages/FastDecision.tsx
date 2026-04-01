import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FitScoreCard from "@/components/FitScoreCard";
import { ArrowRight, Bookmark, SkipForward, Lock } from "lucide-react";

const mockFit = {
  score: 6,
  confidence: "medium" as const,
  strengths: ["Strong React/TypeScript match", "Location aligned", "Experience level fits"],
  gaps: ["Salary below target", "Hybrid vs. remote preference", "German fluency may be tested"],
  recommendation: "This role has a moderate fit. The technical match is strong, but salary and work model may be blockers. Consider applying if you're flexible on hybrid.",
  salarySummary: "€45–55k vs. your €70k+ target",
  locationSummary: "Berlin — matches your preference",
};

const FastDecision = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Fit Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">How well this role matches your profile.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <FitScoreCard score={mockFit.score} confidence={mockFit.confidence} />

        <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Strengths */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-verdict-go mb-2">Top Strengths</h3>
            <ul className="space-y-1.5">
              {mockFit.strengths.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-verdict-go mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>

          {/* Gaps */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-verdict-review mb-2">Gaps to Consider</h3>
            <ul className="space-y-1.5">
              {mockFit.gaps.map((g, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-verdict-review mt-0.5">!</span>{g}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg bg-accent p-4">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-1">Recommendation</h3>
            <p className="text-sm text-muted-foreground">{mockFit.recommendation}</p>
          </div>

          {/* Quick summaries */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Salary</p>
              <p className="font-medium text-foreground">{mockFit.salarySummary}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="font-medium text-foreground">{mockFit.locationSummary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between rounded-xl border border-border bg-card p-5">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><SkipForward className="mr-1.5 h-4 w-4" />Skip</Button>
          <Button variant="outline" size="sm"><Bookmark className="mr-1.5 h-4 w-4" />Save</Button>
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
