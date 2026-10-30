import { describe, expect, it } from "vitest";
import { profileLimits } from "../../eval/profile-limits";
import { toLimits } from "../../supabase/functions/_shared/limits";
import { amountToSalaryInput, extraLimitColumns, officeDaysToRemotePreference, salaryInputToAmount } from "@/lib/limits";

describe("salary input (LPA for INR)", () => {
  it("converts lakh per year to rupees and back", () => {
    expect(salaryInputToAmount("25", "INR")).toBe(2_500_000);
    expect(salaryInputToAmount("12.5", "INR")).toBe(1_250_000);
    expect(amountToSalaryInput(2_500_000, "INR")).toBe("25");
    expect(amountToSalaryInput(1_250_000, "INR")).toBe("12.5");
  });
  it("leaves other currencies as plain yearly amounts", () => {
    expect(salaryInputToAmount("55000", "USD")).toBe(55_000);
    expect(amountToSalaryInput(55_000, "USD")).toBe("55000");
  });
  it("treats blank or invalid as no limit, and old small INR entries as LPA", () => {
    expect(salaryInputToAmount("", "INR")).toBe(0);
    expect(salaryInputToAmount("abc", "USD")).toBe(0);
    expect(amountToSalaryInput(25, "INR")).toBe("25");
    expect(amountToSalaryInput(0, "INR")).toBe("");
  });
});

describe("extraLimitColumns", () => {
  it("saves blanks as null and derives the old remote_preference", () => {
    expect(extraLimitColumns({ noticeDays: "", officeDays: "", languages: "", utcOffset: "" })).toEqual({
      notice_period_days: null, max_office_days: null, languages: [], utc_offset: null, remote_preference: "any",
    });
  });
  it("parses real values and rejects out-of-range ones", () => {
    expect(extraLimitColumns({ noticeDays: "60", officeDays: "3", languages: "English, Hindi", utcOffset: "5.5" })).toEqual({
      notice_period_days: 60, max_office_days: 3, languages: ["English", "Hindi"], utc_offset: 5.5, remote_preference: "hybrid",
    });
    const bad = extraLimitColumns({ noticeDays: "-5", officeDays: "9", languages: "", utcOffset: "99" });
    expect(bad.notice_period_days).toBeNull();
    expect(bad.max_office_days).toBeNull();
    expect(bad.utc_offset).toBeNull();
  });
  it("maps office days to the legacy preference", () => {
    expect(officeDaysToRemotePreference(0)).toBe("remote");
    expect(officeDaysToRemotePreference(2)).toBe("hybrid");
    expect(officeDaysToRemotePreference(5)).toBe("any");
  });
});

describe("toLimits", () => {
  const row = {
    min_salary: 2_500_000, salary_currency: "INR", allowed_countries: ["India"], max_office_days: 3, remote_preference: "hybrid",
    employment_type_preferences: ["Full-time"], languages: ["English", "Hindi"], max_travel_percent: 10, industry_exclusions: ["Gambling"],
    notice_period_days: 60, utc_offset: 5.5, requires_visa_sponsorship: false,
  };
  it("maps a saved row to exactly the limits the 53-posting oracle test proves correct", () => {
    expect(toLimits(row)).toEqual({ ...profileLimits(), requiresVisaSponsorship: undefined });
  });
  it("falls back to the legacy remote_preference when office days are not set", () => {
    expect(toLimits({ remote_preference: "remote" }).maxOfficeDays).toBe(0);
    expect(toLimits({ remote_preference: "hybrid" }).maxOfficeDays).toBe(4);
    expect(toLimits({ remote_preference: "any" }).maxOfficeDays).toBeUndefined();
  });
  it("skips limits the user did not set, and the 100% travel default", () => {
    expect(toLimits({ min_salary: 0, allowed_countries: [], languages: [], max_travel_percent: 100 })).toEqual({ maxTravelPercent: 100 });
  });
});
