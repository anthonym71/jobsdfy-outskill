// Runs the NEW engine over eval/postings: AI reads evidence (same prompt/schema as the
// extract-job edge function), quotes are verified, then plain-code rules decide.
// Usage: LOVABLE_API_KEY=... node eval/run-engine.ts
// Writes eval/results/engine-v2.json (score with `npm run eval:score:v2`) and
// eval/results/engine-v2.extractions.json (compare against eval/oracle-extractions.ts).
import { readFileSync, writeFileSync } from "node:fs";
import { EVIDENCE_PROMPT, EVIDENCE_SCHEMA } from "../supabase/functions/_shared/extraction-schema.ts";
import { evaluate, verifyQuotes } from "../supabase/functions/_shared/verdict.ts";
import { profileLimits } from "./profile-limits.ts";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) {
  console.error("Set LOVABLE_API_KEY (same gateway key the edge functions use).");
  process.exit(1);
}

async function readEvidence(text: string) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are an expert job analysis engine. Never fabricate information." },
        { role: "user", content: `Extract the evidence object from this job posting using the tool provided.\n\nContent:\n${text.slice(0, 12000)}\n${EVIDENCE_PROMPT}` },
      ],
      tools: [{ type: "function", function: { name: "extract_job", parameters: { type: "object", properties: { evidence: EVIDENCE_SCHEMA }, required: ["evidence"] } } }],
      tool_choice: { type: "function", function: { name: "extract_job" } },
    }),
  });
  if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.tool_calls[0].function.arguments).evidence ?? {};
}

const limits = profileLimits();
const labels = JSON.parse(readFileSync("eval/labels.json", "utf8")).postings;
const results: Record<string, unknown> = {};
const extractions: Record<string, unknown> = {};

for (const label of labels) {
  const text = readFileSync(`eval/postings/${label.file}`, "utf8");
  try {
    const { extraction, rejected } = verifyQuotes(await readEvidence(text), text);
    const r = evaluate(extraction, limits);
    const fails = r.results.filter((x) => x.state === "fail");
    const flagged = fails.length ? fails : r.results.filter((x) => x.state === "unknown");
    results[label.id] = { verdict: r.verdict, failedLimits: flagged.map((x) => x.limit), summary: r.summary, rejectedQuotes: rejected };
    extractions[label.id] = extraction;
    console.log(label.id, "->", r.verdict, rejected.length ? `(${rejected.length} quotes rejected)` : "");
  } catch (e) {
    console.error(label.id, "failed:", e instanceof Error ? e.message : e);
  }
}

writeFileSync("eval/results/engine-v2.json", JSON.stringify(results, null, 2));
writeFileSync("eval/results/engine-v2.extractions.json", JSON.stringify(extractions, null, 2));
console.log("Wrote eval/results/engine-v2.json and engine-v2.extractions.json");
