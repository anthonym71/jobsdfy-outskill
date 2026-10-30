// Every factual line in a generated application pack must trace back to a record in the
// user's own profile. The AI tags each claim with a source id; plain code checks that the
// source exists and that every number in the claim appears in that source, which catches
// invented metrics. Pure (no Deno/Node APIs).

export interface Source {
  id: string;
  kind: "profile" | "work" | "education";
  label: string;
  /** Everything the user wrote for this record, used to check numbers. */
  text: string;
}

export interface Claim {
  text: string;
  sourceId?: string | null;
}

export type ClaimStatus = "ok" | "no_source" | "unknown_source" | "unsupported_number";

export interface CheckedClaim {
  text: string;
  sourceId: string | null;
  sourceLabel: string | null;
  status: ClaimStatus;
  /** Numbers in the claim that the cited source does not contain. */
  unsupported: string[];
}

/** A number in the generated text that appears nowhere in the user's profile. */
export interface UnsupportedNumber {
  number: string;
  line: string;
}

export interface Trace {
  claims: CheckedClaim[];
  /** Numbers anywhere in the generated text that no profile record contains. Checked on the text itself, not on the model's claims. */
  unsupportedNumbers?: UnsupportedNumber[];
  total: number;
  /** Claims with no valid source or with numbers the source does not contain. */
  untraceable: number;
}

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const list = (v: unknown) => (Array.isArray(v) ? v.map(String).join(", ") : "");

export function buildSources(profile: Row | null, work: Row[], education: Row[]): Source[] {
  const out: Source[] = [];
  if (profile) {
    out.push({
      id: "profile",
      kind: "profile",
      label: "Your profile summary",
      text: [
        s(profile.full_name), s(profile.headline), s(profile.summary), s(profile.location), s(profile.phone_number), s(profile.email),
        `${s(profile.years_of_experience)} years of experience`,
        list(profile.top_skills), list(profile.industries), list(profile.languages_spoken),
      ].join("\n"),
    });
  }
  for (const w of work) {
    out.push({
      id: `work:${s(w.id)}`,
      kind: "work",
      label: `${s(w.title)} at ${s(w.company)}`,
      text: [
        s(w.title), s(w.company), s(w.location), s(w.employment_type),
        `${s(w.start_month)} ${s(w.start_year)} ${s(w.end_month)} ${s(w.end_year)}`,
        s(w.description), s(w.achievements), s(w.awards), list(w.skills),
      ].join("\n"),
    });
  }
  for (const e of education) {
    out.push({
      id: `edu:${s(e.id)}`,
      kind: "education",
      label: `${s(e.degree)} ${s(e.field)}, ${s(e.institution)}`.replace(/\s+/g, " ").trim(),
      text: [s(e.degree), s(e.field), s(e.institution), `${s(e.start_year)} ${s(e.end_year)}`, s(e.description)].join("\n"),
    });
  }
  return out;
}

/** The list the AI is told it may cite. */
export const sourcesForPrompt = (sources: Source[]) =>
  sources.map((src) => `[${src.id}] ${src.label}\n${src.text.split("\n").filter(Boolean).join(" | ")}`).join("\n\n");

/** Numbers in a sentence, normalised so "1,200" and "1200" compare equal, "25%" keeps its percent. */
export function numbersIn(text: string): string[] {
  const found = text.match(/\d[\d,]*(?:\.\d+)?%?/g) ?? [];
  return found.map((n) => n.replace(/,/g, "").replace(/\.$/, ""));
}

/** "35" and "35%" count as the same number. */
const inSet = (have: Set<string>, n: string) => {
  const bare = n.replace(/%$/, "");
  return have.has(n) || have.has(bare) || have.has(bare + "%");
};

/**
 * The model decides which lines to list as claims, so a fabricated bullet it leaves out would never be checked.
 * This looks at the generated text itself: every number must appear somewhere in the user's own records.
 */
export function findUnsupportedNumbers(texts: string[], sources: Source[]): UnsupportedNumber[] {
  const have = new Set(sources.flatMap((x) => numbersIn(x.text)));
  const seen = new Set<string>();
  const out: UnsupportedNumber[] = [];
  for (const text of texts) {
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.replace(/^\s*\d+[.)]\s+/, ""); // "1. " list markers are not data
      for (const n of numbersIn(line)) {
        if (inSet(have, n) || seen.has(n)) continue;
        seen.add(n);
        out.push({ number: n, line: rawLine.trim().slice(0, 200) });
      }
    }
  }
  return out;
}

export function checkClaims(claims: Claim[], sources: Source[]): Trace {
  const byId = new Map(sources.map((x) => [x.id, x]));
  const checked: CheckedClaim[] = claims
    .filter((c) => c && typeof c.text === "string" && c.text.trim())
    .map((c) => {
      const base = { text: c.text.trim(), sourceId: c.sourceId ?? null };
      if (!c.sourceId) return { ...base, sourceLabel: null, status: "no_source" as const, unsupported: [] };
      const src = byId.get(c.sourceId);
      if (!src) return { ...base, sourceLabel: null, status: "unknown_source" as const, unsupported: [] };
      const have = new Set(numbersIn(src.text));
      const missing = numbersIn(c.text).filter((n) => !inSet(have, n));
      return missing.length
        ? { ...base, sourceLabel: src.label, status: "unsupported_number" as const, unsupported: missing }
        : { ...base, sourceLabel: src.label, status: "ok" as const, unsupported: [] };
    });
  return { claims: checked, total: checked.length, untraceable: checked.filter((c) => c.status !== "ok").length };
}

/** Plain-English reason for a flagged claim. */
export function explainStatus(c: CheckedClaim): string {
  if (c.status === "no_source") return "No source in your profile was cited for this line.";
  if (c.status === "unknown_source") return "It cited a record that is not in your profile.";
  if (c.status === "unsupported_number") return `${c.unsupported.join(", ")} does not appear in the record it cites. Check this number.`;
  return "";
}
