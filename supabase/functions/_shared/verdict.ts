// Deterministic GO / REVIEW / STOP rules. No AI, no network, no Deno APIs, so edge
// functions, the eval runner and vitest can all import it.
//
// The AI only reads facts out of a posting (see extraction-schema.ts). This module
// decides what those facts mean for a user's hard limits:
//   any limit failed            -> stop
//   else any limit unknown      -> review   (missing/vague info on a hard limit)
//   else                        -> go
// A "fail" needs a quote that was verified against the posting; otherwise it is
// downgraded to "unknown" so we never tell someone STOP without evidence.

export type Verdict = "go" | "review" | "stop";
export type LimitKey =
  | "ctc_min" | "location" | "office_policy" | "employment_type" | "language"
  | "travel" | "industry" | "notice_period" | "visa_sponsorship";
export type State = "pass" | "fail" | "unknown";

// ---------- what the AI reads out of a posting ----------
// A missing top-level key means "the posting does not say".
export interface Extraction {
  /** Annualised amounts in the posting's own currency (30 LPA = 3000000 INR). */
  salary?: { min?: number | null; max?: number | null; currency?: string | null; quote?: string; userEdited?: boolean };
  location?: {
    eligibility: "worldwide" | "listed" | "timezone" | "unclear";
    countries?: string[]; // countries or regions, for "listed"
    utcMin?: number | null; utcMax?: number | null; // for "timezone"
    confirmed?: boolean; // false when the office city/country is still "to be decided"
    quote?: string;
  };
  workModel?: { model: "remote" | "hybrid" | "onsite" | "unclear"; officeDaysMin?: number | null; officeDaysMax?: number | null; quote?: string };
  employmentType?: { type: "full-time" | "part-time" | "contract" | "freelance" | "contract-to-hire" | "internship" | "unclear"; quote?: string };
  languages?: Array<{ language: string; level: "required" | "preferred"; quote?: string }>;
  travel?: { percentMax?: number | null; vague?: boolean; quote?: string };
  industries?: { names: string[]; quote?: string };
  notice?: { maxAcceptedDays?: number | null; strict?: boolean; quote?: string };
  sponsorship?: { offered: "yes" | "no" | "unclear"; quote?: string };
}

// ---------- the user's hard limits ----------
// A limit that is undefined is not evaluated.
export interface Limits {
  minSalary?: { amount: number; currency: string };
  allowedCountries?: string[];
  utcOffset?: number;
  /** 0 = remote only, 3 = at most 3 office days, 5+ = anything. */
  maxOfficeDays?: number;
  employmentTypes?: string[];
  languages?: string[];
  maxTravelPercent?: number;
  industryExclusions?: string[];
  noticePeriodDays?: number;
  requiresVisaSponsorship?: boolean;
}

export interface LimitResult {
  limit: LimitKey;
  label: string;
  state: State;
  /** Only meaningful when state is "unknown": the posting stated a preference, not a requirement. */
  soft?: boolean;
  userValue: string;
  jobValue: string;
  quote?: string;
  reason: string;
}

export interface VerdictResult {
  verdict: Verdict;
  results: LimitResult[];
  summary: string;
}

const LABELS: Record<LimitKey, string> = {
  ctc_min: "Salary", location: "Location", office_policy: "Work model", employment_type: "Employment type",
  language: "Language", travel: "Travel", industry: "Industry", notice_period: "Notice period", visa_sponsorship: "Visa sponsorship",
};

// Approximate USD value of one unit. Only used to compare across currencies, and
// cross-currency comparisons keep a 10% "too close to call" band (see compareSalary).
const USD_PER_UNIT: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, INR: 1 / 87, AED: 0.272, SGD: 0.75, CAD: 0.73, AUD: 0.65,
};
const CROSS_CURRENCY_BAND = 0.1;

const EU = ["austria","belgium","bulgaria","croatia","cyprus","czechia","czech republic","denmark","estonia","finland","france","germany","greece","hungary","ireland","italy","latvia","lithuania","luxembourg","malta","netherlands","poland","portugal","romania","slovakia","slovenia","spain","sweden"];
const REGIONS: Record<string, string[]> = {
  eu: EU, "european union": EU,
  europe: [...EU, "united kingdom", "uk", "norway", "switzerland"],
  apac: ["india","singapore","japan","china","australia","new zealand","indonesia","philippines","vietnam","thailand","malaysia","south korea","hong kong"],
  asia: ["india","singapore","japan","china","indonesia","philippines","vietnam","thailand","malaysia","south korea","hong kong","pakistan","bangladesh","sri lanka","nepal"],
  emea: [...EU, "united kingdom", "uk", "uae", "united arab emirates", "south africa", "saudi arabia"],
  "north america": ["united states", "usa", "us", "canada", "mexico"],
  latam: ["brazil", "argentina", "mexico", "colombia", "chile"],
};
const COUNTRY_ALIASES: Record<string, string> = {
  uk: "united kingdom", "great britain": "united kingdom", england: "united kingdom", usa: "united states", us: "united states",
  "u.s.": "united states", america: "united states", uae: "united arab emirates", dubai: "united arab emirates", london: "united kingdom",
  bengaluru: "india", bangalore: "india", hyderabad: "india", pune: "india", mumbai: "india", delhi: "india", gurugram: "india", chennai: "india",
};
const GAMBLING = ["gambling", "casino", "betting", "sports betting", "real-money gaming", "real money gaming", "fantasy sports", "lottery", "wagering"];

const norm = (s: string) => s.trim().toLowerCase();
const country = (s: string) => COUNTRY_ALIASES[norm(s)] ?? norm(s);

/**
 * The user's allowed places are free text ("Germany, Netherlands, Remote EU"). Drop a leading "remote", expand regions
 * to their countries, and report whether any entry could not be understood.
 */
function expandAllowed(allowed: string[]): { allow: string[]; unknownEntries: boolean } {
  const allow: string[] = [];
  let unknownEntries = false;
  for (const raw of allowed) {
    const t = country(norm(raw).replace(/^(remote|anywhere in|work from)\s+/, ""));
    allow.push(t);
    const region = REGIONS[t];
    if (region) allow.push(...region.map(country));
    else if (!isKnownCountry(t)) unknownEntries = true;
  }
  return { allow, unknownEntries };
}

function matchCountries(tokens: string[], allowed: string[]): "match" | "none" | "unrecognised" {
  const { allow, unknownEntries } = expandAllowed(allowed);
  let unrecognised = false;
  for (const raw of tokens) {
    const t = country(raw);
    if (allow.includes(t)) return "match";
    const region = REGIONS[t];
    if (region) {
      if (region.some((c) => allow.includes(country(c)))) return "match";
    } else if (!isKnownCountry(t)) {
      unrecognised = true;
    }
  }
  // If part of the user's own list could not be understood, we cannot honestly say nothing matches.
  return unrecognised || unknownEntries ? "unrecognised" : "none";
}

const KNOWN_COUNTRIES = new Set([
  ...EU, ...Object.values(REGIONS).flat(), "united states", "united kingdom", "united arab emirates", "canada", "australia", "india",
  "singapore", "japan", "china", "brazil", "mexico", "south africa", "israel", "turkey", "norway", "switzerland", "ukraine", "russia",
].map(country));
function isKnownCountry(t: string) { return KNOWN_COUNTRIES.has(t); }

const money = (n: number, cur: string) => `${cur} ${Math.round(n).toLocaleString("en-US")}`;
const list = (xs: string[] | undefined) => (xs && xs.length ? xs.join(", ") : "any");

function mk(limit: LimitKey, r: Omit<LimitResult, "limit" | "label">): LimitResult {
  return { limit, label: LABELS[limit], ...r };
}

// ---------- individual rules ----------
function salary(x: Extraction["salary"], l: NonNullable<Limits["minSalary"]>): LimitResult {
  const userValue = `at least ${money(l.amount, l.currency)} a year`;
  const min = x?.min ?? null, max = x?.max ?? null, cur = x?.currency?.toUpperCase() ?? null;
  if (!x || (min === null && max === null)) return mk("ctc_min", { state: "unknown", userValue, jobValue: "not stated", reason: "The posting does not give a salary figure." });
  const jobValue = [min !== null ? money(min, cur ?? "") : "", max !== null ? money(max, cur ?? "") : ""].filter(Boolean).join(" to ").trim();
  if (!cur) return mk("ctc_min", { state: "unknown", userValue, jobValue, quote: x.quote, reason: "The salary has no currency." });

  const same = cur === l.currency.toUpperCase();
  let floor = l.amount;
  if (!same) {
    const a = USD_PER_UNIT[cur], b = USD_PER_UNIT[l.currency.toUpperCase()];
    if (!a || !b) return mk("ctc_min", { state: "unknown", userValue, jobValue, quote: x.quote, reason: `No exchange rate for ${cur}.` });
    floor = (l.amount * b) / a; // user's floor expressed in the job's currency
  }
  const band = same ? 0 : CROSS_CURRENCY_BAND;
  const clearlyAbove = min !== null && min >= floor * (1 + band);
  const clearlyBelow = max !== null && max <= floor * (1 - band) && (same ? max < floor : true);
  const note = same ? "" : ` Compared at approximate exchange rates (floor about ${money(floor, cur)}).`;
  if (clearlyBelow) return mk("ctc_min", { state: "fail", userValue, jobValue, quote: x.quote, reason: `The top of the range is below your minimum.${note}` });
  if (clearlyAbove) return mk("ctc_min", { state: "pass", userValue, jobValue, quote: x.quote, reason: `The whole range is above your minimum.${note}` });
  return mk("ctc_min", { state: "unknown", userValue, jobValue, quote: x.quote, reason: `The range overlaps or is too close to your minimum to call.${note}` });
}

function location(x: Extraction["location"], l: Limits): LimitResult {
  const allowed = l.allowedCountries ?? [];
  const userValue = list(allowed);
  if (!x || x.eligibility === "unclear") return mk("location", { state: "unknown", userValue, jobValue: x ? "unclear" : "not stated", quote: x?.quote, reason: "The posting does not make clear where you can work from." });
  if (x.eligibility === "worldwide") return mk("location", { state: "pass", userValue, jobValue: "anywhere", quote: x.quote, reason: "Open to candidates worldwide." });
  if (x.eligibility === "timezone") {
    const jobValue = `UTC${fmtOffset(x.utcMin)} to UTC${fmtOffset(x.utcMax)}`;
    if (l.utcOffset === undefined || x.utcMin == null || x.utcMax == null) return mk("location", { state: "unknown", userValue, jobValue, quote: x.quote, reason: "Eligibility is by time zone and we cannot compare it to yours." });
    const inside = l.utcOffset >= x.utcMin && l.utcOffset <= x.utcMax;
    return mk("location", { state: inside ? "pass" : "fail", userValue: `UTC${fmtOffset(l.utcOffset)}`, jobValue, quote: x.quote, reason: inside ? "Your time zone is inside the stated range." : "Your time zone is outside the stated range." });
  }
  const countries = x.countries ?? [];
  if (!countries.length) return mk("location", { state: "unknown", userValue, jobValue: "no place named", quote: x.quote, reason: "The posting limits where you can work but does not name the places." });
  const m = matchCountries(countries, allowed);
  const jobValue = list(countries);
  if (m === "none") return mk("location", { state: "fail", userValue, jobValue, quote: x.quote, reason: "None of the places the posting accepts are in your allowed countries." });
  if (m === "unrecognised") return mk("location", { state: "unknown", userValue, jobValue, quote: x.quote, reason: "The posting names a place we could not match to your countries." });
  if (x.confirmed === false) return mk("location", { state: "unknown", userValue, jobValue, quote: x.quote, reason: "The location is still to be decided, so you may not be placed in your country." });
  return mk("location", { state: "pass", userValue, jobValue, quote: x.quote, reason: "The posting accepts candidates in your country." });
}
const fmtOffset = (n?: number | null) => (n == null ? "?" : `${n >= 0 ? "+" : ""}${n}`);

function officePolicy(x: Extraction["workModel"], max: number): LimitResult {
  const userValue = max === 0 ? "remote only" : max >= 5 ? "any" : `up to ${max} office days a week`;
  if (!x || x.model === "unclear") return mk("office_policy", { state: "unknown", userValue, jobValue: x ? "unclear" : "not stated", quote: x?.quote, reason: "The posting does not make clear how many days are in the office." });
  const dmin = x.officeDaysMin ?? null, dmax = x.officeDaysMax ?? null;
  if (x.model === "remote") return mk("office_policy", { state: "pass", userValue, jobValue: "remote", quote: x.quote, reason: "Fully remote." });
  if (x.model === "onsite") {
    const ok = max >= 5;
    return mk("office_policy", { state: ok ? "pass" : "fail", userValue, jobValue: "fully on site", quote: x.quote, reason: ok ? "On site is acceptable to you." : "Fully on site is more office time than you accept." });
  }
  // hybrid
  const jobValue = dmin !== null || dmax !== null ? `hybrid, ${dmin ?? dmax}${dmax !== null && dmax !== dmin ? `-${dmax}` : ""} office days` : "hybrid, days not stated";
  if (max === 0) return mk("office_policy", { state: "fail", userValue, jobValue, quote: x.quote, reason: "Hybrid still needs office days and you want remote only." });
  if (dmin === null && dmax === null) {
    return max >= 4
      ? mk("office_policy", { state: "pass", userValue, jobValue, quote: x.quote, reason: "Hybrid is acceptable to you." })
      : mk("office_policy", { state: "unknown", userValue, jobValue, quote: x.quote, reason: "The number of office days is not stated." });
  }
  const lo = dmin ?? dmax!, hi = dmax ?? dmin!;
  if (hi <= max) return mk("office_policy", { state: "pass", userValue, jobValue, quote: x.quote, reason: "Office days are within your limit." });
  if (lo > max) return mk("office_policy", { state: "fail", userValue, jobValue, quote: x.quote, reason: "Even the minimum office days exceed your limit." });
  return mk("office_policy", { state: "unknown", userValue, jobValue, quote: x.quote, reason: "Office days could be above or below your limit." });
}

function employment(x: Extraction["employmentType"], prefs: string[]): LimitResult {
  const userValue = list(prefs);
  if (!x || x.type === "unclear") return mk("employment_type", { state: "unknown", userValue, jobValue: x ? "unclear" : "not stated", quote: x?.quote, reason: "The posting does not clearly say the employment type." });
  if (x.type === "contract-to-hire") return mk("employment_type", { state: "unknown", userValue, jobValue: "contract-to-hire", quote: x.quote, reason: "Starts as a contract before any permanent role." });
  const wanted = prefs.map((p) => p.trim().toLowerCase().replace(/\s+/g, "-"));
  const ok = wanted.includes(x.type) || (x.type === "full-time" && wanted.includes("permanent"));
  return mk("employment_type", { state: ok ? "pass" : "fail", userValue, jobValue: x.type, quote: x.quote, reason: ok ? "Matches the type of work you want." : "Not a type of employment you accept." });
}

function language(x: Extraction["languages"], spoken: string[]): LimitResult {
  const userValue = list(spoken);
  const have = spoken.map(norm);
  const req = (x ?? []).filter((e) => e.level === "required" && !have.includes(norm(e.language)));
  const pref = (x ?? []).filter((e) => e.level === "preferred" && !have.includes(norm(e.language)));
  const jobValue = x && x.length ? x.map((e) => `${e.language} (${e.level})`).join(", ") : "none stated";
  if (req.length) return mk("language", { state: "fail", userValue, jobValue, quote: req[0].quote, reason: `${req.map((e) => e.language).join(", ")} is required and is not one of your languages.` });
  if (pref.length) return mk("language", { state: "unknown", soft: true, userValue, jobValue, quote: pref[0].quote, reason: `${pref.map((e) => e.language).join(", ")} is preferred, not required.` });
  return mk("language", { state: "pass", userValue, jobValue, reason: "No language you lack is required." });
}

function travel(x: Extraction["travel"], max: number): LimitResult {
  const userValue = `up to ${max}% travel`;
  if (x?.percentMax != null) {
    const ok = x.percentMax <= max;
    return mk("travel", { state: ok ? "pass" : "fail", userValue, jobValue: `up to ${x.percentMax}%`, quote: x.quote, reason: ok ? "Travel is within your limit." : "Travel exceeds your limit." });
  }
  if (x?.vague) return mk("travel", { state: "unknown", userValue, jobValue: "some travel, amount not stated", quote: x.quote, reason: "The posting mentions travel without an amount." });
  return mk("travel", { state: "pass", userValue, jobValue: "not mentioned", reason: "The posting does not mention travel." });
}

function industry(x: Extraction["industries"], excluded: string[]): LimitResult {
  const userValue = `not ${list(excluded)}`;
  const names = (x?.names ?? []).map(norm);
  const hit = excluded.find((ex) => {
    const e = norm(ex);
    const group = GAMBLING.includes(e) ? GAMBLING : [e];
    // One way only: the posting's industry must contain the excluded term or a synonym. The reverse test made
    // "Gaming" match "real-money gaming" and "Sports" match "fantasy sports".
    return names.some((n) => n.length > 0 && group.some((g) => n.includes(g)));
  });
  if (hit) return mk("industry", { state: "fail", userValue, jobValue: list(x?.names), quote: x?.quote, reason: `The company is in an industry you excluded (${hit}).` });
  return mk("industry", { state: "pass", userValue, jobValue: list(x?.names), reason: "No excluded industry found." });
}

function notice(x: Extraction["notice"], days: number): LimitResult {
  const userValue = `${days} days notice`;
  if (x?.maxAcceptedDays == null) return mk("notice_period", { state: "pass", userValue, jobValue: "no limit stated", reason: "The posting sets no notice-period limit." });
  const jobValue = `up to ${x.maxAcceptedDays} days${x.strict ? " (required)" : ""}`;
  if (x.maxAcceptedDays >= days) return mk("notice_period", { state: "pass", userValue, jobValue, quote: x.quote, reason: "Your notice period fits." });
  if (x.strict) return mk("notice_period", { state: "fail", userValue, jobValue, quote: x.quote, reason: "Your notice period is longer than the posting accepts." });
  return mk("notice_period", { state: "unknown", soft: true, userValue, jobValue, quote: x.quote, reason: "A shorter notice period is preferred, not required." });
}

function sponsorship(x: Extraction["sponsorship"]): LimitResult {
  const userValue = "needs visa sponsorship";
  if (!x || x.offered === "unclear") return mk("visa_sponsorship", { state: "unknown", userValue, jobValue: x ? "unclear" : "not stated", quote: x?.quote, reason: "The posting does not say whether it sponsors visas." });
  return mk("visa_sponsorship", { state: x.offered === "yes" ? "pass" : "fail", userValue, jobValue: x.offered === "yes" ? "sponsors visas" : "no sponsorship", quote: x.quote, reason: x.offered === "yes" ? "Sponsorship is offered." : "The posting does not sponsor visas." });
}

// ---------- the verdict ----------
export function evaluate(ex: Extraction | null | undefined, limits: Limits): VerdictResult {
  const e: Extraction = ex ?? {};
  const out: LimitResult[] = [];
  if (limits.minSalary) out.push(salary(e.salary, limits.minSalary));
  if (limits.allowedCountries?.length) out.push(location(e.location, limits));
  if (limits.maxOfficeDays !== undefined && limits.maxOfficeDays < 5) out.push(officePolicy(e.workModel, limits.maxOfficeDays));
  if (limits.employmentTypes?.length) out.push(employment(e.employmentType, limits.employmentTypes));
  if (limits.languages?.length) out.push(language(e.languages, limits.languages));
  if (limits.maxTravelPercent !== undefined && limits.maxTravelPercent < 100) out.push(travel(e.travel, limits.maxTravelPercent));
  if (limits.industryExclusions?.length) out.push(industry(e.industries, limits.industryExclusions));
  if (limits.noticePeriodDays !== undefined) out.push(notice(e.notice, limits.noticePeriodDays));
  if (limits.requiresVisaSponsorship) out.push(sponsorship(e.sponsorship));

  // Safety: never say STOP without a verified quote (a user-edited salary counts as verified).
  const results = out.map((r) => {
    const edited = r.limit === "ctc_min" && e.salary?.userEdited;
    return r.state === "fail" && !r.quote && !edited
      ? { ...r, state: "unknown" as const, reason: `${r.reason} (No verified quote from the posting, so this is not treated as a hard stop.)` }
      : r;
  });

  const fails = results.filter((r) => r.state === "fail");
  const unknowns = results.filter((r) => r.state === "unknown");
  const verdict: Verdict = fails.length ? "stop" : unknowns.length ? "review" : "go";
  const names = (rs: LimitResult[]) => rs.map((r) => r.label).join(", ");
  const summary =
    verdict === "stop" ? `Stop: this role breaks your limit on ${names(fails)}.`
    : verdict === "review" ? `Check before applying: the posting is unclear on ${names(unknowns)}.`
    : "No limit broken. Everything we could check fits.";
  return { verdict, results, summary };
}

// ---------- evidence check ----------
const squash = (s: string) =>
  s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

const MIN_QUOTE = 5;

/** Drops any quote that is not a verbatim piece of the posting. Returns the cleaned extraction and what was dropped. */
export function verifyQuotes(ex: Extraction, sourceText: string): { extraction: Extraction; rejected: string[] } {
  const hay = squash(sourceText);
  const rejected: string[] = [];
  const clean = <T extends { quote?: string }>(o: T, where: string): T => {
    // A quote must be a real, specific piece of the posting. Very short ones (a letter, a word like "a") prove nothing.
    if (o.quote && (squash(o.quote).length < MIN_QUOTE || !hay.includes(squash(o.quote)))) {
      rejected.push(`${where}: ${o.quote}`);
      return { ...o, quote: undefined };
    }
    return o;
  };
  const out: Extraction = { ...ex };
  for (const k of ["salary", "location", "workModel", "employmentType", "travel", "industries", "notice", "sponsorship"] as const) {
    const v = out[k];
    if (v) (out as Record<string, unknown>)[k] = clean(v as { quote?: string }, k);
  }
  if (out.languages) out.languages = out.languages.map((l) => clean(l, `language ${l.language}`));
  return { extraction: out, rejected };
}
