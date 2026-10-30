// "Does this posting look real and current?" A risk panel, not a verdict.
// Pure rules (no AI, no network). Every sign carries a verbatim quote when the text has one,
// and says whether it was visible in the text or needs data from outside the pasted posting.
// It never says a job is fake: a warning sign is a reason to check the employer, nothing more.

export type RiskLevel = "low" | "some" | "several";
export type Strength = "strong" | "medium" | "weak";

export interface RiskSign {
  id: string;
  strength: Strength;
  label: string;
  /** "visible_in_text": found in the pasted posting. "needs_source_data": needs post date / history from the source or saved jobs. */
  basis: "visible_in_text" | "needs_source_data";
  quote?: string;
  explanation: string;
}

export interface RiskResult {
  level: RiskLevel;
  signs: RiskSign[];
  summary: string;
}

export interface RiskOptions {
  /** Whether the extraction found a salary figure. Omit if unknown (the sign is then skipped). */
  salaryStated?: boolean;
  /** Company name as extracted. Omit if unknown (the sign is then skipped). */
  company?: string;
}

const SUMMARY: Record<RiskLevel, string> = {
  low: "No warning signs found in the text. That is not proof the job is real.",
  some: "Some warning signs. Check the employer yourself before you share details.",
  several: "Several warning signs. Do not pay anything or share personal details until you have verified the employer.",
};

const POINTS: Record<Strength, number> = { strong: 3, medium: 2, weak: 1 };

export function levelOf(signs: RiskSign[]): RiskLevel {
  const strong = signs.filter((s) => s.strength === "strong").length;
  const score = signs.reduce((n, s) => n + POINTS[s.strength], 0);
  if (strong >= 2 || score >= 6) return "several";
  if (score >= 2) return "some";
  return "low";
}

const result = (signs: RiskSign[]): RiskResult => {
  const level = levelOf(signs);
  return { level, signs, summary: SUMMARY[level] };
};

const lines = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const clip = (s: string) => (s.length > 200 ? s.slice(0, 197) + "..." : s);

interface TextRule {
  id: string;
  strength: Strength;
  label: string;
  explanation: string;
  test: (line: string) => boolean;
}

const money = "(?:rs\\.?|inr|₹|\\$|usd|eur|£)";
const RULES: TextRule[] = [
  {
    id: "payment_request", strength: "strong", label: "Asks you to pay",
    explanation: "Real employers do not charge candidates fees or deposits to interview, train or onboard.",
    test: (l) =>
      /\b(registration|security|refundable|training|onboarding|processing|joining|interview|application|kit|laptop)\s+(fee|fees|deposit|charges?|amount)\b/i.test(l) ||
      /\b(security|refundable)\s+deposit\b/i.test(l) ||
      // a request to pay, not a salary label like "Pay: $70,000"
      new RegExp(`\\b(you (must|need to|have to|should|will need to) pay|please pay|kindly pay|pay us|pay an?)\\b[^.]{0,60}${money}?\\s?\\d`, "i").test(l),
  },
  {
    id: "personal_financial_details", strength: "strong", label: "Asks for sensitive details up front",
    explanation: "Bank, ID or card details should not be requested before you have an offer from a verified employer.",
    test: (l) =>
      /\b(bank account|account number|aadhaar|aadhar|pan card|passport|ssn|social security|credit card|debit card|cvv|otp)\b/i.test(l) &&
      /\b(send|share|provide|submit|upload|enter|give)\b/i.test(l),
  },
  {
    id: "off_platform_contact", strength: "strong", label: "Contact only through a chat app or personal email",
    explanation: "Hiring that runs only through WhatsApp, Telegram or a free email address is a common pattern in fraudulent postings.",
    test: (l) =>
      /\b(whatsapp|telegram|signal)\b/i.test(l) ||
      (/\b[\w.+-]+@(gmail|yahoo|hotmail|outlook|rediffmail)\.com\b/i.test(l) && /\b(send|apply|contact|mail|email|cv|resume)\b/i.test(l)),
  },
  {
    id: "too_good_pay", strength: "strong", label: "Pay that looks too good to be true",
    explanation: "Very high daily or weekly earnings for little or no experience is a classic warning sign.",
    test: (l) =>
      new RegExp(`\\b(earn|income|make)\\b[^.]{0,30}${money}?\\s?[\\d,]{4,}[^.]{0,15}(per|a|/)\\s?(day|week|hour)`, "i").test(l) ||
      /\bguaranteed (income|salary|earnings|job)\b/i.test(l) ||
      (/\bno experience (needed|required)\b/i.test(l) && new RegExp(`${money}\\s?[\\d,]{4,}`, "i").test(l)),
  },
  {
    id: "pressure_language", strength: "medium", label: "Pressure to act quickly",
    explanation: "Urgency and scarcity language is used to stop you checking the employer.",
    test: (l) => /\b(hurry|limited seats?|urgent(ly)? hiring|last chance|don'?t miss (out|this)|only \d+ (seats|slots|positions) (left|remaining))\b/i.test(l),
  },
  {
    id: "stale_age", strength: "medium", label: "Posting looks old",
    explanation: "A role that has been open for months may no longer be actively filled.",
    test: (l) => {
      const m = l.match(/\b(?:originally |first )?(?:posted|published|listed)\s+(\d+)\s+(day|week|month|year)s?\s+ago/i);
      if (!m) return false;
      const n = Number(m[1]);
      const days = /day/i.test(m[2]) ? n : /week/i.test(m[2]) ? n * 7 : /month/i.test(m[2]) ? n * 30 : n * 365;
      return days >= 60;
    },
  },
  {
    id: "reposted", strength: "medium", label: "Posting has been reposted",
    explanation: "Repeated reposting can mean the role is always open or never filled.",
    test: (l) => /\b(re-?posted|posted again|relisted|re-?listed)\b/i.test(l),
  },
];

const VAGUE_COMPANY = /\b(confidential|undisclosed|reputed|well[- ]known|leading (company|firm|organi[sz]ation)|top mnc|a client of)\b/i;

export function assessRisk(text: string, opts: RiskOptions = {}): RiskResult {
  const signs: RiskSign[] = [];
  const all = lines(text).filter((l) => !/^\[synthetic/i.test(l));
  for (const rule of RULES) {
    const hit = all.find(rule.test);
    if (hit) {
      signs.push({ id: rule.id, strength: rule.strength, label: rule.label, basis: "visible_in_text", quote: clip(hit), explanation: rule.explanation });
    }
  }
  if (opts.salaryStated === false) {
    signs.push({ id: "no_salary", strength: "weak", label: "No salary stated", basis: "visible_in_text",
      explanation: "Many genuine postings omit pay, so this counts for little on its own." });
  }
  if (opts.company !== undefined && (!opts.company.trim() || VAGUE_COMPANY.test(opts.company))) {
    signs.push({ id: "vague_company", strength: "weak", label: "Employer is not clearly named", basis: "visible_in_text",
      explanation: "Knowing who the employer is lets you check them before you apply." });
  }
  return result(signs);
}

export interface HistoryInfo {
  /** When you first saved this posting (ISO date). */
  firstSeenAt?: string | null;
  /** How many other saved postings in your account look like this one (same title and company). */
  seenBefore?: number;
  now?: Date;
}

/** Adds the signs that need data from outside the pasted text: how long you have known the posting, and repeats. */
export function withHistory(base: RiskResult, h: HistoryInfo): RiskResult {
  const signs = base.signs.filter((s) => s.basis === "visible_in_text");
  const now = (h.now ?? new Date()).getTime();
  if (h.firstSeenAt) {
    const days = Math.floor((now - new Date(h.firstSeenAt).getTime()) / 86_400_000);
    if (days >= 45) {
      signs.push({ id: "known_a_long_time", strength: "medium", label: `You first saw this ${days} days ago`, basis: "needs_source_data",
        explanation: "A posting that is still open weeks after you first saved it may be stale." });
    }
  }
  if ((h.seenBefore ?? 0) >= 1) {
    signs.push({ id: "seen_before", strength: "medium", label: "You have saved this posting before", basis: "needs_source_data",
      explanation: "The same role appearing again can mean it is being reposted." });
  }
  return result(signs);
}
