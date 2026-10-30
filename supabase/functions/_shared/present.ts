// Shapes a verdict result into the response the verdict screen reads.
// Shared by the analyze-dealbreakers edge function, the dev preview and tests. Pure.
import type { VerdictResult, State, Verdict } from "./verdict.ts";

export interface BlockerView {
  limit: string;
  category: string;
  state: State;
  soft: boolean;
  /** Older field names the screen still understands. */
  status: "confirmed" | "unclear" | "ok";
  severity: "confirmed" | "unclear";
  userValue: string;
  jobValue: string;
  note: string;
  quote: string | null;
}

export interface VerdictResponse {
  verdict: Verdict;
  summary: string;
  blockers: BlockerView[];
  /** One entry per checked limit, with the same three states as the cards. */
  alignment: Array<{ label: string; state: State }>;
  hasEvidence: boolean;
}

export function toResponse(result: VerdictResult, hasEvidence: boolean): VerdictResponse {
  const blockers: BlockerView[] = result.results.map((r) => ({
    limit: r.limit,
    category: r.label,
    state: r.state,
    soft: !!r.soft,
    status: r.state === "fail" ? "confirmed" : r.state === "unknown" ? "unclear" : "ok",
    severity: r.state === "fail" ? "confirmed" : "unclear",
    userValue: r.userValue,
    jobValue: r.jobValue,
    note: r.reason,
    quote: r.quote ?? null,
  }));
  return {
    verdict: result.verdict,
    summary: hasEvidence
      ? result.summary
      : "This job was saved before evidence checking existed, so nothing could be verified. Add it again to get a full check.",
    blockers,
    alignment: result.results.map((r) => ({ label: r.label, state: r.state })),
    hasEvidence,
  };
}

/** Job statuses the verdict may set. Saved, applied, archived and later stages are the user's decisions and are kept. */
const VERDICT_SETTABLE = new Set(["new", "reviewing", "blocked"]);

export function nextStatus(current: string | null | undefined, verdict: Verdict): string {
  if (current && !VERDICT_SETTABLE.has(current)) return current;
  return verdict === "stop" ? "blocked" : "reviewing";
}
