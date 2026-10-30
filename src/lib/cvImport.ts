// Turns a parsed CV (the output of the parse-cv edge function) into onboarding form values,
// database rows, and a plain list of "what we understood" for the user to check. Pure.

export interface ParsedCv {
  fullName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  email?: string;
  phone?: string;
  topSkills?: string[];
  languages?: string[];
  workHistory?: Array<{
    title?: string; company?: string; location?: string; employmentType?: string;
    startMonth?: number; startYear?: number; endMonth?: number; endYear?: number; isCurrent?: boolean;
    description?: string; achievements?: string; skills?: string[];
  }>;
  education?: Array<{ institution?: string; degree?: string; field?: string; startYear?: number; endYear?: number; description?: string }>;
}

export interface Fact {
  label: string;
  value: string;
}

const join = (xs?: string[]) => (xs ?? []).map((x) => x.trim()).filter(Boolean).join(", ");

/** Whole years between the earliest job start and the given year. Blank if the CV has no dates. */
export function yearsOfExperience(cv: ParsedCv, nowYear: number): string {
  const starts = (cv.workHistory ?? []).map((w) => w.startYear).filter((y): y is number => typeof y === "number" && y > 1950 && y <= nowYear);
  return starts.length ? String(nowYear - Math.min(...starts)) : "";
}

/** Values for the onboarding form. Only fields the CV actually states are returned, so nothing is guessed. */
export function cvToForm(cv: ParsedCv, nowYear = new Date().getFullYear()) {
  const out: Record<string, string> = {};
  if (cv.fullName?.trim()) out.fullName = cv.fullName.trim();
  if (cv.location?.trim()) out.location = cv.location.trim();
  if (cv.headline?.trim()) out.headline = cv.headline.trim();
  if (cv.summary?.trim()) out.summary = cv.summary.trim();
  if (join(cv.topSkills)) out.topSkills = join(cv.topSkills);
  if (join(cv.languages)) {
    out.languages = join(cv.languages);
    out.nonNegLanguages = join(cv.languages); // the languages you can work in, to confirm in the limits step
  }
  const years = yearsOfExperience(cv, nowYear);
  if (years) out.yearsExp = years;
  return out;
}

/** Rows for the work_history and education tables. */
export function cvToRows(cv: ParsedCv, userId: string) {
  const work = (cv.workHistory ?? []).filter((w) => w.title || w.company).map((w, i) => ({
    user_id: userId,
    title: w.title || "",
    company: w.company || "",
    location: w.location || null,
    employment_type: w.employmentType || "Full-time",
    is_current: !!w.isCurrent,
    is_concurrent: false,
    start_month: w.startMonth || null,
    start_year: w.startYear || null,
    end_month: w.endMonth || null,
    end_year: w.endYear || null,
    description: w.description || "",
    achievements: w.achievements || "",
    skills: w.skills || [],
    sort_order: i,
  }));
  const education = (cv.education ?? []).filter((e) => e.institution).map((e) => ({
    user_id: userId,
    institution: e.institution || "",
    degree: e.degree || null,
    field: e.field || null,
    start_year: e.startYear || null,
    end_year: e.endYear || null,
    description: e.description || null,
  }));
  return { work, education };
}

/** The "what we understood" list: short facts the user can check against their own CV. */
export function understood(cv: ParsedCv, nowYear = new Date().getFullYear()): Fact[] {
  const facts: Fact[] = [];
  const f = cvToForm(cv, nowYear);
  if (f.fullName) facts.push({ label: "Name", value: f.fullName });
  if (f.headline) facts.push({ label: "Headline", value: f.headline });
  if (f.location) facts.push({ label: "Location", value: f.location });
  if (f.yearsExp) facts.push({ label: "Experience", value: `${f.yearsExp} years (from your earliest job start)` });
  const jobs = (cv.workHistory ?? []).filter((w) => w.title || w.company);
  if (jobs.length) {
    const latest = jobs[0];
    facts.push({ label: "Work history", value: `${jobs.length} role${jobs.length === 1 ? "" : "s"}, most recent: ${[latest.title, latest.company].filter(Boolean).join(" at ")}` });
  }
  const edu = (cv.education ?? []).filter((e) => e.institution);
  if (edu.length) facts.push({ label: "Education", value: edu.map((e) => [e.degree, e.institution].filter(Boolean).join(", ")).join("; ") });
  if (f.topSkills) facts.push({ label: "Skills", value: f.topSkills });
  if (f.languages) facts.push({ label: "Languages", value: f.languages });
  return facts;
}
