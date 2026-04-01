import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import VerdictBadge, { type Verdict } from "@/components/VerdictBadge";
import BlockerCard from "@/components/BlockerCard";
import { ArrowRight, Bookmark, Eye, SkipForward, ShieldAlert } from "lucide-react";

// Mock dealbreaker result — replace with real AI analysis
const mockResult = {
  verdict: "stop" as Verdict,
  summary: "We found a likely dealbreaker before you waste time.",
  blockers: [
    { category: "Salary", status: "confirmed" as const, userValue: "€70,000+", jobValue: "€45,000 – €55,000", note: "Below your minimum acceptable salary." },
    { category: "Visa / Work Auth", status: "ok" as const, userValue: "EU citizen", jobValue: "EU work permit required" },
    { category: "Location", status: "ok" as const, userValue: "Berlin, Germany", jobValue: "Berlin, Germany" },
    { category: "Remote / Onsite", status: "unclear" as const, userValue: "Remote only", jobValue: "Hybrid (3 days onsite)", note: "Job requires hybrid. You prefer remote only." },
    { category: "Language", status: "ok" as const, userValue: "English, German B2+", jobValue: "English (fluent), German (B2+)" },
    { category: "Years of Experience", status: "ok" as const, userValue: "7 years", jobValue: "5+ years" },
  ],
  alignment: [
    { label: "Salary", aligned: false },
    { label: "Location", aligned: true },
    { label: "Work Auth", aligned: true },
    { label: "Language", aligned: true },
  ],
};

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

const DealbreakersCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { verdict, blockers, alignment } = mockResult;
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
          <Button variant="ghost" size="sm"><SkipForward className="mr-1.5 h-4 w-4" />Skip</Button>
          <Button variant="outline" size="sm"><Bookmark className="mr-1.5 h-4 w-4" />Save</Button>
          <Button variant="outline" size="sm"><Eye className="mr-1.5 h-4 w-4" />Investigate</Button>
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
