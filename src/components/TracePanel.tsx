import { CheckCircle2, AlertTriangle, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { explainStatus, type Trace } from "../../supabase/functions/_shared/traceability";

/**
 * Shows where each factual line in the pack came from, and flags what cannot be traced to the user's own profile.
 * It checks the lines the draft lists as facts, plus every number in the text. It cannot prove a draft is accurate,
 * so it never says so.
 */
const TracePanel = ({ trace }: { trace: Trace | null | undefined }) => {
  const numbers = trace?.unsupportedNumbers ?? [];
  const claims = trace?.claims ?? [];
  const flagged = claims.filter((c) => c.status !== "ok");
  const clean = claims.length - flagged.length;
  const attention = flagged.length + numbers.length;

  if (!trace || (claims.length === 0 && numbers.length === 0)) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground" aria-label="Where each line comes from">
        <div className="flex items-center gap-2 font-heading font-semibold text-foreground"><FileSearch className="h-4 w-4" aria-hidden />Where each line comes from</div>
        <p className="mt-2">No source information was saved for this pack. Read every line against your own profile before you send anything.</p>
      </section>
    );
  }

  return (
    <section className={cn("rounded-xl border p-5", attention ? "border-verdict-review/30 bg-verdict-review-bg" : "border-border bg-card")} aria-label="Where each line comes from">
      <div className="flex items-start gap-3">
        {attention ? <AlertTriangle className="mt-0.5 h-5 w-5 text-verdict-review-foreground" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-5 w-5 text-verdict-go" aria-hidden />}
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">Where each line comes from</h2>
          <p className="mt-1 text-sm text-foreground/80">
            {clean} of {claims.length} listed lines trace to your profile.
            {attention ? ` ${attention} thing${attention === 1 ? "" : "s"} need${attention === 1 ? "s" : ""} your attention before you send.` : " No number in the text is missing from your profile."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">We check the lines the draft lists as facts and every number in the text. Read the whole draft yourself.</p>
        </div>
      </div>

      {numbers.length > 0 && (
        <div className="mt-4 rounded-lg bg-card/70 p-3 text-sm ring-1 ring-verdict-review/40">
          <p className="font-medium text-foreground">Numbers that are not in your profile</p>
          <ul className="mt-2 space-y-1.5">
            {numbers.map((n) => (
              <li key={n.number} className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{n.number}</span> in: “{n.line}”</li>
            ))}
          </ul>
        </div>
      )}

      {claims.length > 0 && (
        <ul className="mt-4 space-y-2">
          {claims.map((c, i) => (
            <li key={i} className={cn("rounded-lg bg-card/70 p-3 text-sm", c.status !== "ok" && "ring-1 ring-verdict-review/40")}>
              <p className="text-foreground">{c.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.status === "ok" ? <>From: <span className="font-medium text-foreground">{c.sourceLabel}</span></> : explainStatus(c)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default TracePanel;
