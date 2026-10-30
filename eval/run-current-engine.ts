// Replays the CURRENT extract-job + analyze-dealbreakers prompts (copied from
// supabase/functions) over eval/postings so we have a baseline before rewriting.
// Usage: LOVABLE_API_KEY=... node eval/run-current-engine.ts
// Writes eval/results/current.json, then run: node eval/score.ts eval/results/current.json
import { readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) {
  console.error("Set LOVABLE_API_KEY (same gateway key the edge functions use).");
  process.exit(1);
}
const URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callTool(system: string, user: string, name: string, properties: object, required: string[]) {
  const resp = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      tools: [{ type: "function", function: { name, parameters: { type: "object", properties, required } } }],
      tool_choice: { type: "function", function: { name } },
    }),
  });
  if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
}

const str = { type: "string" };
const extractProps = {
  title: str, company: str, location: str, salaryMin: str, salaryMax: str, salaryCurrency: str,
  workModel: str, employmentType: str, visaPolicy: str, languageRequirements: str,
  description: str, requirementsSummary: str,
};

// Maps the free-text blocker category the current engine returns onto our limit keys.
function limitKey(category: string): string {
  const c = category.toLowerCase();
  if (/salary|ctc|compensation|pay/.test(c)) return "ctc_min";
  if (/notice/.test(c)) return "notice_period";
  if (/remote|onsite|office|hybrid|work model/.test(c)) return "office_policy";
  if (/visa|authori|sponsor/.test(c)) return "visa_sponsorship";
  if (/location|country/.test(c)) return "location";
  if (/language/.test(c)) return "language";
  if (/travel/.test(c)) return "travel";
  if (/employment/.test(c)) return "employment_type";
  if (/industry/.test(c)) return "industry";
  if (/experience/.test(c)) return "experience";
  return c;
}

const profile = JSON.parse(readFileSync("eval/profile.sample.json", "utf8"));
const labels = JSON.parse(readFileSync("eval/labels.json", "utf8")).postings;
const out: Record<string, { verdict: string; failedLimits: string[]; summary: string }> = {};

for (const label of labels) {
  const text = readFileSync(`eval/postings/${label.file}`, "utf8");
  const job = await callTool(
    "You are an expert ATS keyword extraction and job analysis engine. Never fabricate information.",
    `Extract structured job posting information. If a field is not found or unclear, use an empty string "".\n\nContent:\n${text.slice(0, 12000)}`,
    "extract_job", extractProps, Object.keys(extractProps),
  );

  const prompt = `You are a job dealbreaker analyzer. Compare this job against the user's non-negotiables and determine if there are hard blockers.

JOB DATA:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Salary: ${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}
- Work Model: ${job.workModel}
- Employment Type: ${job.employmentType}
- Visa Policy: ${job.visaPolicy}
- Language Requirements: ${job.languageRequirements}
- Description: ${job.description}
- Requirements: ${job.requirementsSummary}

USER NON-NEGOTIABLES:
- Minimum Salary: ${profile.min_ctc_lpa} LPA ${profile.ctc_currency}
- Allowed Countries: ${profile.allowed_countries.join(", ")}
- Remote Preference: ${profile.office_policy}
- Requires Visa Sponsorship: ${profile.requires_visa_sponsorship}
- Employment Types: ${profile.employment_type_preferences.join(", ")}
- Max Travel: ${profile.max_travel_percent}%
- Industry Exclusions: ${profile.industry_exclusions.join(", ")}

Analyze each category and return the result using the tool provided. The verdict should be:
- "stop" if there's at least one confirmed hard mismatch
- "review" if there are unclear or likely issues
- "go" if everything aligns well`;

  const result = await callTool(
    "You are a precise job dealbreaker analyzer. Only flag real mismatches.",
    prompt, "analyze_dealbreakers",
    {
      verdict: { type: "string", enum: ["go", "review", "stop"] },
      summary: str,
      blockers: {
        type: "array",
        items: {
          type: "object",
          properties: { category: str, severity: { type: "string", enum: ["confirmed", "likely", "unclear"] }, status: { type: "string", enum: ["confirmed", "ok", "unclear"] }, userValue: str, jobValue: str, note: str },
          required: ["category", "severity", "status", "userValue", "jobValue"],
        },
      },
    },
    ["verdict", "summary", "blockers"],
  );

  out[label.id] = {
    verdict: result.verdict,
    summary: result.summary,
    failedLimits: (result.blockers ?? []).filter((b: any) => b.status !== "ok").map((b: any) => limitKey(b.category)),
  };
  console.log(label.id, "->", result.verdict);
}

writeFileSync("eval/results/current.json", JSON.stringify(out, null, 2));
console.log("Wrote eval/results/current.json");
