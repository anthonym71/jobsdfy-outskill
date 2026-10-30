// DEV ONLY. Renders the signed-in screens with real engine output and fixture data so they can be
// reviewed without a backend. Registered in App.tsx behind import.meta.env.DEV, so it is not in production builds.
import { useSearchParams } from "react-router-dom";
import { ORACLE } from "../../eval/oracle-extractions";
import { evaluate, type Limits } from "../../supabase/functions/_shared/verdict";
import { toResponse } from "../../supabase/functions/_shared/present";
import { buildSources, checkClaims } from "../../supabase/functions/_shared/traceability";
import { assessRisk, withHistory } from "@/lib/risk";
import VerdictView from "@/components/VerdictView";
import TracePanel from "@/components/TracePanel";
import RiskPanel from "@/components/RiskPanel";

const postings = import.meta.glob("../../eval/postings/*.txt", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const postingText = (id: string) => Object.entries(postings).find(([k]) => k.includes(`/${id}-`))?.[1] ?? "";

// The same sample candidate as eval/profile.sample.json.
const LIMITS: Limits = {
  minSalary: { amount: 2_500_000, currency: "INR" }, allowedCountries: ["India"], utcOffset: 5.5, maxOfficeDays: 3,
  employmentTypes: ["Full-time"], languages: ["English", "Hindi"], maxTravelPercent: 10, industryExclusions: ["Gambling"], noticePeriodDays: 60,
};

const CASES: Record<string, { id: string; title: string }> = {
  stop: { id: "001", title: "STOP" },
  review: { id: "I06", title: "REVIEW (also shows a risk panel)" },
  go: { id: "I01", title: "GO" },
};

const noop = () => {};

const DevPreview = () => {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") ?? "stop";

  const sources = buildSources(
    { full_name: "Asha Rao", headline: "Backend engineer", years_of_experience: 5, top_skills: ["Python", "Go"] },
    [{ id: "w1", title: "Senior Engineer", company: "Acme", start_year: 2021, achievements: "Cut payment latency by 35%. Served 1,200 merchants." }],
    [],
  );
  const trace = checkClaims(
    [
      { text: "Cut payment latency by 35% for 1,200 merchants", sourceId: "work:w1" },
      { text: "Backend engineer with 5 years of experience", sourceId: "profile" },
      { text: "Reduced infrastructure cost by 60%", sourceId: "work:w1" },
      { text: "Led a team of 12 engineers", sourceId: "" },
    ],
    sources,
  );

  const c = CASES[view];
  let body;
  if (c) {
    const text = postingText(c.id);
    const ex = ORACLE[c.id];
    const risk = withHistory(
      assessRisk(text, { salaryStated: !!ex.salary && (ex.salary.min != null || ex.salary.max != null) }),
      { firstSeenAt: c.id === "I06" ? "2026-08-01" : "2026-10-28", seenBefore: c.id === "I06" ? 1 : 0, now: new Date("2026-10-31") },
    );
    body = <VerdictView result={toResponse(evaluate(ex, LIMITS), true)} risk={risk} onBack={noop} onSave={noop} onSkip={noop} onContinue={noop} onReportWrong={noop} />;
  } else if (view === "pack") {
    body = (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <TracePanel trace={trace} />
      </div>
    );
  } else {
    body = (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <RiskPanel risk={assessRisk("Pay a registration fee of INR 2,000.\nSend your CV on WhatsApp.\nHURRY! Limited seats.", { salaryStated: false })} />
        <RiskPanel risk={assessRisk("Backend engineer, hybrid.", { salaryStated: true })} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-2 text-xs">
        <span className="font-semibold text-muted-foreground">Dev preview (not in production)</span>
        {[...Object.keys(CASES), "pack", "risk"].map((v) => (
          <button key={v} onClick={() => setParams({ view: v })} className={`rounded-md px-2.5 py-1 ${view === v ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`}>{v}</button>
        ))}
      </div>
      {body}
    </div>
  );
};

export default DevPreview;
