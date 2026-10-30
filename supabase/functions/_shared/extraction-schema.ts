// What the AI must read out of a posting so supabase/functions/_shared/verdict.ts can judge it.
// Shared by the extract-job edge function and eval/run-engine.ts so both use the same prompt.
// Pure data: no Deno or Node APIs.

const str = { type: "string" };
const num = { type: "number" };
const quote = { type: "string", description: "A short span copied EXACTLY, character for character, from the posting. No paraphrase." };

export const EVIDENCE_SCHEMA = {
  type: "object",
  description: "Facts that matter for a candidate's hard limits, each with a verbatim quote. Omit any key the posting does not address.",
  properties: {
    salary: {
      type: "object",
      properties: { min: num, max: num, currency: { type: "string", description: "ISO code such as INR, USD, EUR" }, quote },
    },
    location: {
      type: "object",
      properties: {
        eligibility: { type: "string", enum: ["worldwide", "listed", "timezone", "unclear"] },
        countries: { type: "array", items: str, description: "Countries or regions where the candidate must be based or may be hired. Turn cities into their country." },
        utcMin: num, utcMax: num,
        confirmed: { type: "boolean", description: "false if the location is still 'to be decided/confirmed' or several cities are offered without a firm one." },
        quote,
      },
      required: ["eligibility"],
    },
    workModel: {
      type: "object",
      properties: { model: { type: "string", enum: ["remote", "hybrid", "onsite", "unclear"] }, officeDaysMin: num, officeDaysMax: num, quote },
      required: ["model"],
    },
    employmentType: {
      type: "object",
      properties: { type: { type: "string", enum: ["full-time", "part-time", "contract", "freelance", "contract-to-hire", "internship", "unclear"] }, quote },
      required: ["type"],
    },
    languages: {
      type: "array",
      description: "Human languages only (not programming languages).",
      items: { type: "object", properties: { language: str, level: { type: "string", enum: ["required", "preferred"] }, quote }, required: ["language", "level"] },
    },
    travel: { type: "object", properties: { percentMax: num, vague: { type: "boolean" }, quote } },
    industries: { type: "object", properties: { names: { type: "array", items: str }, quote }, required: ["names"] },
    notice: {
      type: "object",
      properties: { maxAcceptedDays: num, strict: { type: "boolean" }, quote },
    },
    sponsorship: { type: "object", properties: { offered: { type: "string", enum: ["yes", "no", "unclear"] }, quote }, required: ["offered"] },
  },
};

export const EVIDENCE_PROMPT = `
ALSO fill the "evidence" object. It is used to check the posting against the candidate's hard limits, so accuracy matters more than completeness.
Rules:
- Every "quote" must be copied EXACTLY from the posting text above (one line or sentence). Never paraphrase. If you cannot quote it, leave that key out.
- If the posting does not address a topic, OMIT that key. Do not guess and do not write "unknown".
- salary: give ANNUAL amounts in the posting's own currency. Monthly x12, weekly x52. Indian figures: 1 lakh = 100000, 1 crore = 10000000, so "30 LPA" = 3000000 INR. If only a per-project or hourly rate is given with no hours, omit salary. "Up to X" means only max.
- location: use "worldwide" when the role is remote with no country restriction. Use "listed" with countries when the posting names where candidates must live or where the office is (turn cities into countries). Set confirmed=false if the office city/country is still to be decided. Use "unclear" only when the posting is vague about who is eligible.
- workModel: "unclear" when the posting is vague (for example "occasionally in office", "hybrid or remote, discuss"). Give officeDaysMin/Max when stated.
- notice: maxAcceptedDays = the longest notice the employer accepts ("immediate" = 0). strict=true only when the posting makes it a requirement ("only", "will not be considered"); strict=false for "preferred" or "up to X is fine".
- travel: percentMax when a number is given ("none" = 0). vague=true for "some/occasional travel" with no amount.
- industries: the employer's industry, using plain words from the posting (for example "online casino", "fantasy sports").
- languages: "required" vs "preferred" exactly as the posting says.
- Never infer facts that are not written in the posting.`;
