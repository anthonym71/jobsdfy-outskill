// Scores an engine's results against hand-written labels.
// Usage: node eval/score.ts eval/results/current.json
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export type Verdict = "go" | "review" | "stop";

export interface Label {
  id: string;
  expected: { verdict: Verdict; failedLimits: string[] };
  market?: string;
  suspicious?: boolean;
}

export interface EngineResult {
  verdict: Verdict;
  failedLimits?: string[];
}

export interface Score {
  total: number;
  correct: number;
  missing: string[];
  /** Expected STOP but engine said GO: the worst failure. */
  stopToGo: string[];
  /** Expected STOP but engine said REVIEW: softer miss. */
  stopToReview: string[];
  /** Expected GO/REVIEW but engine said STOP: wrongly steers the user away. */
  wrongStops: string[];
  /** Expected REVIEW or STOP but engine said GO. */
  wrongGos: string[];
  /** Of correctly flagged STOPs, how many named every expected limit. */
  stopsNamingAllLimits: { named: number; of: number };
}

export function score(labels: Label[], results: Record<string, EngineResult>): Score {
  const s: Score = {
    total: labels.length,
    correct: 0,
    missing: [],
    stopToGo: [],
    stopToReview: [],
    wrongStops: [],
    wrongGos: [],
    stopsNamingAllLimits: { named: 0, of: 0 },
  };
  for (const label of labels) {
    const got = results[label.id];
    if (!got) {
      s.missing.push(label.id);
      continue;
    }
    const want = label.expected.verdict;
    if (got.verdict === want) s.correct++;
    if (want === "stop" && got.verdict === "go") s.stopToGo.push(label.id);
    if (want === "stop" && got.verdict === "review") s.stopToReview.push(label.id);
    if (want !== "stop" && got.verdict === "stop") s.wrongStops.push(label.id);
    if (want !== "go" && got.verdict === "go") s.wrongGos.push(label.id);
    if (want === "stop" && got.verdict === "stop") {
      s.stopsNamingAllLimits.of++;
      const named = new Set(got.failedLimits ?? []);
      if (label.expected.failedLimits.every((l) => named.has(l))) s.stopsNamingAllLimits.named++;
    }
  }
  return s;
}

function main() {
  const resultsPath = process.argv[2];
  if (!resultsPath) {
    console.error("Usage: node eval/score.ts <results.json>");
    process.exit(1);
  }
  const labels: Label[] = JSON.parse(readFileSync("eval/labels.json", "utf8")).postings;
  const results = JSON.parse(readFileSync(resultsPath, "utf8"));
  const s = score(labels, results);
  console.log(JSON.stringify(s, null, 2));
  console.log(`\nAccuracy: ${s.correct}/${s.total}`);
  console.log(`STOP -> GO (worst): ${s.stopToGo.length}  STOP -> REVIEW: ${s.stopToReview.length}`);
  console.log(`Wrong STOPs: ${s.wrongStops.length}  Wrong GOs: ${s.wrongGos.length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
