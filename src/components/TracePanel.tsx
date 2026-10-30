import { CheckCircle2, AlertTriangle, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { explainStatus, type Trace } from "../../supabase/functions/_shared/traceability";

/** Shows where each factual line in the pack came from, and flags any line that cannot be traced to the user's own profile. */
const TracePanel = ({ trace }: { trace: Trace | null | undefined }) => {
  if (!trace || trace.total === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground" aria-label="Where each line comes from">
        <div className="flex items-center gap-2 font-heading font-semibold text-foreground"><FileSearch className="h-4 w-4" aria-hidden />Where each line comes from</div>
        <p className="mt-2">No source information was saved for this pack. Read every line against your own profile before you send anything.</p>
      </section>
    );
  }
  const flagged = trace.claims.filter((c) => c.status !== "ok");
  const clean = trace.total - flagged.length;
  return (
    <section className={cn("rounded-xl border p-5", flagged.length ? "border-verdict-review/30 bg-verdict-review-bg" : "border-verdict-go/30 bg-verdict-go-bg")} aria-label="Where each line comes from">
      <div className="flex items-start gap-3">
        {flagged.length ? <AlertTriangle className="mt-0.5 h-5 w-5 text-verdict-review" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-5 w-5 text-verdict-go" aria-hidden />}
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">Where each line comes from</h2>
          <p className="mt-1 text-sm text-foreground/80">
            {clean} of {trace.total} lines trace to your profile.
            {flagged.length ? ` ${flagged.length} need${flagged.length === 1 ? "s" : ""} your attention before you send.` : " Nothing here is invented."}
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {trace.claims.map((c, i) => (
          <li key={i} className={cn("rounded-lg bg-card/70 p-3 text-sm", c.status !== "ok" && "ring-1 ring-verdict-review/40")}>
            <p className="text-foreground">{c.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.status === "ok" ? <>From: <span className="font-medium text-foreground">{c.sourceLabel}</span></> : explainStatus(c)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TracePanel;
