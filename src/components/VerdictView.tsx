import { ArrowLeft, ArrowRight, Bookmark, Check, HelpCircle, ShieldAlert, ShieldCheck, ShieldQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import VerdictBadge from "@/components/VerdictBadge";
import BlockerCard from "@/components/BlockerCard";
import RiskPanel from "@/components/RiskPanel";
import type { RiskResult } from "@/lib/risk";
import type { VerdictResponse } from "../../supabase/functions/_shared/present";

const BANNER = {
  go: { box: "verdict-banner-go", text: "text-verdict-go", icon: ShieldCheck, next: "Nothing in your way. Next step: apply." },
  review: { box: "verdict-banner-review", text: "text-verdict-review-foreground", icon: ShieldQuestion, next: "Ask about the unclear items before you spend time on this one." },
  stop: { box: "verdict-banner-stop", text: "text-verdict-stop", icon: ShieldAlert, next: "This breaks a limit you set. You can skip it, or continue anyway." },
} as const;

interface Props {
  result: VerdictResponse;
  risk: RiskResult | null;
  onBack: () => void;
  onSave: () => void;
  onSkip: () => void;
  onContinue: () => void;
  /** Called with a limit key when one card is reported wrong, or with nothing for the whole verdict. */
  onReportWrong: (limit?: string) => void;
}

/** The verdict screen: what breaks, what the posting does not say, and what fits. Presentational only. */
const VerdictView = ({ result, risk, onBack, onSave, onSkip, onContinue, onReportWrong }: Props) => {
  const b = BANNER[result.verdict];
  const Icon = b.icon;
  const breaks = result.blockers.filter((x) => x.state === "fail");
  const unclear = result.blockers.filter((x) => x.state === "unknown");
  const fits = result.blockers.filter((x) => x.state === "pass");

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 md:p-8">
      <section className={`rounded-xl border p-6 md:p-8 ${b.box}`} aria-label="Verdict">
        <div className="flex flex-col items-center gap-4 text-center">
          <Icon className={`h-10 w-10 ${b.text}`} aria-hidden />
          <VerdictBadge verdict={result.verdict} size="lg" />
          <p className={`max-w-lg text-base font-medium ${b.text}`}>{result.summary}</p>
          <p className="max-w-lg text-sm text-foreground/70">{b.next}</p>
          <ul className="flex flex-wrap justify-center gap-2 text-xs font-medium" aria-label="Summary of limits checked">
            {breaks.length > 0 && <li className="rounded-full bg-verdict-stop-bg px-3 py-1 text-verdict-stop">{breaks.length} broken</li>}
            {unclear.length > 0 && <li className="rounded-full bg-verdict-review-bg px-3 py-1 text-verdict-review-foreground">{unclear.length} not stated</li>}
            {fits.length > 0 && <li className="rounded-full bg-verdict-go-bg px-3 py-1 text-verdict-go">{fits.length} fit</li>}
          </ul>
        </div>
      </section>

      <RiskPanel risk={risk} />

      {breaks.length > 0 && (
        <section aria-labelledby="breaks-h">
          <h2 id="breaks-h" className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground"><X className="h-4 w-4 text-verdict-stop" aria-hidden />What breaks your limits</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {breaks.map((x) => <BlockerCard key={x.limit} {...x} onDisagree={() => onReportWrong(x.limit)} />)}
          </div>
        </section>
      )}

      {unclear.length > 0 && (
        <section aria-labelledby="unclear-h">
          <h2 id="unclear-h" className="mb-1 flex items-center gap-2 font-heading text-base font-semibold text-foreground"><HelpCircle className="h-4 w-4 text-verdict-review-foreground" aria-hidden />What the posting doesn't say</h2>
          <p className="mb-4 text-sm text-muted-foreground">We do not guess. Ask the recruiter, or check the company page.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {unclear.map((x) => <BlockerCard key={x.limit} {...x} onDisagree={() => onReportWrong(x.limit)} />)}
          </div>
        </section>
      )}

      {fits.length > 0 && (
        <section aria-labelledby="fits-h">
          <h2 id="fits-h" className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground"><Check className="h-4 w-4 text-verdict-go" aria-hidden />What fits</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {fits.map((x) => (
              <li key={x.limit} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{x.category}</span>
                <span className="min-w-0 truncate text-right text-muted-foreground">{x.jobValue}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Actions">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>
          <Button variant="outline" size="sm" onClick={onSave}><Bookmark className="mr-1.5 h-4 w-4" />Save</Button>
          <Button variant="ghost" size="sm" onClick={() => onReportWrong()}>I disagree</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.verdict === "stop" ? (
            <>
              <Button variant="outline" size="sm" onClick={onContinue}>Continue anyway</Button>
              <Button size="sm" onClick={onSkip}>Skip this job</Button>
            </>
          ) : (
            <Button size="sm" onClick={onContinue}>
              {result.verdict === "review" ? "Continue to decision" : "Continue"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default VerdictView;
