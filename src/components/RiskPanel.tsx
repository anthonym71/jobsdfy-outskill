import { Eye, Database, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskResult } from "@/lib/risk";

const LEVEL = {
  low: { title: "No warning signs in the text", icon: ShieldCheck, box: "border-verdict-go/30 bg-verdict-go-bg", text: "text-verdict-go" },
  some: { title: "Some warning signs", icon: ShieldAlert, box: "border-verdict-review/30 bg-verdict-review-bg", text: "text-verdict-review" },
  several: { title: "Several warning signs", icon: ShieldAlert, box: "border-verdict-stop/30 bg-verdict-stop-bg", text: "text-verdict-stop" },
} as const;

/** Is this posting real and current? A list of reasons to check the employer, never a "fake" verdict. */
const RiskPanel = ({ risk, className }: { risk: RiskResult | null | undefined; className?: string }) => {
  if (!risk) return null;
  const l = LEVEL[risk.level];
  const Icon = l.icon;
  return (
    <section className={cn("rounded-xl border p-5", l.box, className)} aria-label="Posting risk check">
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", l.text)} aria-hidden />
        <div className="min-w-0">
          <h2 className={cn("font-heading text-base font-semibold", l.text)}>{l.title}</h2>
          <p className="mt-1 text-sm text-foreground/80">{risk.summary}</p>
        </div>
      </div>
      {risk.signs.length > 0 && (
        <ul className="mt-4 space-y-3">
          {risk.signs.map((s) => (
            <li key={s.id} className="rounded-lg bg-card/70 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">{s.label}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {s.basis === "visible_in_text" ? <Eye className="h-3.5 w-3.5" aria-hidden /> : <Database className="h-3.5 w-3.5" aria-hidden />}
                  {s.basis === "visible_in_text" ? "Visible in the text" : "Needs data from outside the posting"}
                </span>
              </div>
              {s.quote && <blockquote className="mt-2 border-l-2 border-border pl-3 text-xs italic text-muted-foreground">“{s.quote}”</blockquote>}
              <p className="mt-2 text-xs text-muted-foreground">{s.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RiskPanel;
