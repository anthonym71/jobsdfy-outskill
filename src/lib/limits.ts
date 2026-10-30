// Form helpers for the hard limits (onboarding and profile). Kept pure so they can be tested.

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "INR", "AED", "SGD", "AUD"];

export const OFFICE_DAY_OPTIONS = [
  { value: "0", label: "Remote only" },
  { value: "1", label: "Up to 1 day in office" },
  { value: "2", label: "Up to 2 days in office" },
  { value: "3", label: "Up to 3 days in office" },
  { value: "4", label: "Up to 4 days in office" },
  { value: "5", label: "Fully on site is fine" },
];

const isInr = (currency: string) => currency.toUpperCase() === "INR";

/** Indian salaries are quoted in lakh per annum (LPA); everything else is a plain yearly amount. */
export const salaryLabel = (currency: string) => (isInr(currency) ? "Minimum CTC (lakh per year, LPA)" : "Minimum Acceptable Salary (per year)");
export const salaryPlaceholder = (currency: string) => (isInr(currency) ? "25" : "55000");

/** "25" with INR means 25 LPA = 2,500,000 rupees. Blank or invalid means no limit (0). */
export function salaryInputToAmount(input: string, currency: string): number {
  const n = parseFloat(input);
  if (!(n > 0)) return 0;
  return isInr(currency) ? Math.round(n * 100_000) : Math.round(n);
}

/** Inverse of salaryInputToAmount. A stored INR value under 10,000 is taken as an old entry typed in LPA. */
export function amountToSalaryInput(amount: number | null | undefined, currency: string): string {
  if (!amount) return "";
  if (!isInr(currency)) return String(amount);
  return amount < 10_000 ? String(amount) : String(Number((amount / 100_000).toFixed(2)));
}

export const officeDaysToRemotePreference = (days: number | null): "remote" | "hybrid" | "any" =>
  days === null ? "any" : days === 0 ? "remote" : days >= 5 ? "any" : "hybrid";

const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const optInt = (s: string, min: number, max: number) => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) || n < min || n > max ? null : n;
};
const optNum = (s: string, min: number, max: number) => {
  const n = parseFloat(s);
  return Number.isNaN(n) || n < min || n > max ? null : n;
};

export interface LimitFormValues {
  noticeDays: string;
  officeDays: string;
  languages: string;
  utcOffset: string;
}

/** The columns added for Indian limits. Blank inputs save as null (limit not set). */
export function extraLimitColumns(f: LimitFormValues) {
  const maxOfficeDays = optInt(f.officeDays, 0, 5);
  return {
    notice_period_days: optInt(f.noticeDays, 0, 365),
    max_office_days: maxOfficeDays,
    languages: splitList(f.languages),
    utc_offset: optNum(f.utcOffset, -12, 14),
    remote_preference: officeDaysToRemotePreference(maxOfficeDays),
  };
}

/**
 * A salary the user retyped on the extraction form may be in the units they think in rather than rupees or dollars.
 * Treat a tiny INR figure as lakh per year, and a small figure in any other currency as thousands.
 */
export function normaliseEditedSalary(n: number | null, currency: string): number | null {
  if (!n || n <= 0) return null;
  if (isInr(currency)) return n < 10_000 ? n * 100_000 : n;
  return n < 1_000 ? n * 1_000 : n;
}
