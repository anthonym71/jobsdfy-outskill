// Turns a saved user_non_negotiables row into the Limits the verdict rules use.
// Pure (no Deno/Node APIs) so the edge function and tests share it.
import type { Limits } from "./verdict.ts";

/** The columns of user_non_negotiables that drive the verdict. Any may be null or missing. */
export interface NonNegotiablesRow {
  min_salary?: number | null;
  salary_currency?: string | null;
  allowed_countries?: string[] | null;
  max_office_days?: number | null;
  remote_preference?: string | null;
  employment_type_preferences?: string[] | null;
  languages?: string[] | null;
  max_travel_percent?: number | null;
  industry_exclusions?: string[] | null;
  notice_period_days?: number | null;
  utc_offset?: number | null;
  requires_visa_sponsorship?: boolean | null;
}

export function toLimits(n: NonNegotiablesRow): Limits {
  const limits: Limits = {};
  if (n.min_salary && n.min_salary > 0) limits.minSalary = { amount: n.min_salary, currency: n.salary_currency || "USD" };
  if (n.allowed_countries?.length) limits.allowedCountries = n.allowed_countries;
  if (typeof n.max_office_days === "number") limits.maxOfficeDays = n.max_office_days;
  else if (n.remote_preference === "remote") limits.maxOfficeDays = 0;
  else if (n.remote_preference === "hybrid") limits.maxOfficeDays = 4; // "hybrid OK" = anything but fully on site
  if (n.employment_type_preferences?.length) limits.employmentTypes = n.employment_type_preferences;
  if (n.languages?.length) limits.languages = n.languages;
  if (typeof n.max_travel_percent === "number") limits.maxTravelPercent = n.max_travel_percent;
  if (n.industry_exclusions?.length) limits.industryExclusions = n.industry_exclusions;
  if (typeof n.notice_period_days === "number") limits.noticePeriodDays = n.notice_period_days;
  if (typeof n.utc_offset === "number") limits.utcOffset = n.utc_offset;
  if (n.requires_visa_sponsorship) limits.requiresVisaSponsorship = true;
  return limits;
}
