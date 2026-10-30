// Turns eval/profile.sample.json into the Limits the verdict rules use.
import { readFileSync } from "node:fs";
import type { Limits } from "../supabase/functions/_shared/verdict.ts";

export function profileLimits(path = "eval/profile.sample.json"): Limits {
  const p = JSON.parse(readFileSync(path, "utf8"));
  return {
    minSalary: { amount: p.min_ctc_lpa * 1e5, currency: p.ctc_currency },
    allowedCountries: p.allowed_countries,
    utcOffset: p.utc_offset,
    maxOfficeDays: 3,
    employmentTypes: p.employment_type_preferences,
    languages: p.languages,
    maxTravelPercent: p.max_travel_percent,
    industryExclusions: p.industry_exclusions,
    noticePeriodDays: p.notice_period_days,
    requiresVisaSponsorship: p.requires_visa_sponsorship,
  };
}
