import { describe, expect, it } from "vitest";
import { evaluate, verifyQuotes, type Extraction, type Limits } from "../../supabase/functions/_shared/verdict";

const L: Limits = { minSalary: { amount: 2_500_000, currency: "INR" }, allowedCountries: ["India"], maxOfficeDays: 3, noticePeriodDays: 60 };
const state = (ex: Extraction, l: Limits, key: string) => evaluate(ex, l).results.find((r) => r.limit === key)?.state;

describe("verdict rules", () => {
  it("fail beats unknown beats pass", () => {
    const ex: Extraction = {
      salary: { min: 1_000_000, max: 1_500_000, currency: "INR", quote: "x" },
      location: { eligibility: "unclear" },
    };
    expect(evaluate(ex, L).verdict).toBe("stop");
    expect(evaluate({ location: { eligibility: "unclear" } }, L).verdict).toBe("review");
  });

  it("an empty extraction is REVIEW, never GO", () => {
    expect(evaluate({}, L).verdict).toBe("review");
    expect(evaluate(null, L).verdict).toBe("review");
  });

  it("a fail without a verified quote is downgraded to unknown", () => {
    const ex: Extraction = { salary: { min: 1, max: 2, currency: "INR" } };
    const r = evaluate(ex, { minSalary: L.minSalary });
    expect(r.verdict).toBe("review");
    expect(r.results[0].state).toBe("unknown");
  });

  it("a user-edited salary may fail without a quote", () => {
    const ex: Extraction = { salary: { min: 1, max: 2, currency: "INR", userEdited: true } };
    expect(evaluate(ex, { minSalary: L.minSalary }).verdict).toBe("stop");
  });

  it("salary: same currency is exact, cross currency keeps a 10% band", () => {
    expect(state({ salary: { min: 2_500_000, max: 3_000_000, currency: "INR", quote: "q" } }, L, "ctc_min")).toBe("pass");
    expect(state({ salary: { min: 2_000_000, max: 2_499_999, currency: "INR", quote: "q" } }, L, "ctc_min")).toBe("fail");
    expect(state({ salary: { min: 29_000, max: 29_000, currency: "USD", quote: "q" } }, L, "ctc_min")).toBe("unknown");
    expect(state({ salary: { min: 60_000, max: 60_000, currency: "USD", quote: "q" } }, L, "ctc_min")).toBe("pass");
    expect(state({ salary: { min: 1000, max: 1000, currency: "XYZ", quote: "q" } }, L, "ctc_min")).toBe("unknown");
  });

  it("location: regions are expanded, unknown places are not guessed", () => {
    const loc = (countries: string[]) => state({ location: { eligibility: "listed", countries, confirmed: true, quote: "q" } }, L, "location");
    expect(loc(["APAC"])).toBe("pass");
    expect(loc(["EU"])).toBe("fail");
    expect(loc(["Bengaluru"])).toBe("pass");
    expect(loc(["Atlantis"])).toBe("unknown");
  });

  it("office days: remote-only user fails any hybrid; hybrid-OK user passes unspecified hybrid", () => {
    const hy = { workModel: { model: "hybrid" as const, quote: "q" } };
    expect(state(hy, { maxOfficeDays: 0 }, "office_policy")).toBe("fail");
    expect(state(hy, { maxOfficeDays: 4 }, "office_policy")).toBe("pass");
    expect(state(hy, { maxOfficeDays: 3 }, "office_policy")).toBe("unknown");
  });

  it("notice: required short notice fails, preferred is a soft unknown, generous passes", () => {
    const n = (maxAcceptedDays: number | null, strict: boolean) => evaluate({ notice: { maxAcceptedDays, strict, quote: "q" } }, { noticePeriodDays: 60 }).results[0];
    expect(n(15, true).state).toBe("fail");
    expect(n(30, false)).toMatchObject({ state: "unknown", soft: true });
    expect(n(90, false).state).toBe("pass");
    expect(n(null, false).state).toBe("pass");
  });

  it("gambling synonyms trip the industry exclusion", () => {
    expect(state({ industries: { names: ["Fantasy sports"], quote: "q" } }, { industryExclusions: ["Gambling"] }, "industry")).toBe("fail");
    expect(state({ industries: { names: ["Fintech"], quote: "q" } }, { industryExclusions: ["Gambling"] }, "industry")).toBe("pass");
  });

  it("limits the user did not set are not evaluated", () => {
    expect(evaluate({}, {}).verdict).toBe("go");
  });
});

describe("verifyQuotes", () => {
  const text = "Salary: INR 18-24 LPA\nImmediate joiners only.";
  it("keeps a verbatim quote (case and whitespace insensitive)", () => {
    const { extraction, rejected } = verifyQuotes({ salary: { min: 1, max: 2, currency: "INR", quote: "salary: INR 18-24  LPA" } }, text);
    expect(rejected).toEqual([]);
    expect(extraction.salary?.quote).toBeTruthy();
  });
  it("drops an invented quote, which then cannot support a STOP", () => {
    const { extraction, rejected } = verifyQuotes({ salary: { min: 1, max: 2, currency: "INR", quote: "CTC: INR 5 LPA" } }, text);
    expect(rejected).toHaveLength(1);
    expect(extraction.salary?.quote).toBeUndefined();
    expect(evaluate(extraction, { minSalary: L.minSalary }).verdict).toBe("review");
  });
});

describe("hardening", () => {
  it("a restricted location that names no places is unknown, never a STOP", () => {
    expect(state({ location: { eligibility: "listed", countries: [], confirmed: true, quote: "q" } }, L, "location")).toBe("unknown");
  });

  it("a trivially short quote is rejected, so it cannot support a STOP", () => {
    const { extraction, rejected } = verifyQuotes({ salary: { min: 1, max: 2, currency: "INR", quote: "a" } }, "a salary line, a b c");
    expect(rejected).toHaveLength(1);
    expect(extraction.salary?.quote).toBeUndefined();
    expect(evaluate(extraction, { minSalary: L.minSalary }).verdict).toBe("review");
  });

  it("currency codes are case-insensitive", () => {
    expect(state({ salary: { min: 3_000_000, max: 4_000_000, currency: "inr", quote: "CTC 30-40" } }, L, "ctc_min")).toBe("pass");
  });

  it("zero travel passes and a missing salary object is unknown", () => {
    expect(state({ travel: { percentMax: 0, quote: "no travel" } }, { maxTravelPercent: 10 }, "travel")).toBe("pass");
    expect(state({}, { minSalary: L.minSalary }, "ctc_min")).toBe("unknown");
  });
});
