import { describe, expect, it } from "vitest";
import { buildSources, checkClaims, explainStatus, numbersIn, sourcesForPrompt } from "../../supabase/functions/_shared/traceability";

const work = [{ id: "w1", title: "Backend Engineer", company: "Acme", start_year: 2021, end_year: 2024, description: "Built payment APIs", achievements: "Cut latency by 35%. Served 1,200 merchants.", skills: ["Python"] }];
const edu = [{ id: "e1", degree: "B.Tech", field: "Computer Science", institution: "VIT", start_year: 2016, end_year: 2020 }];
const profile = { full_name: "Asha", headline: "Backend engineer", years_of_experience: 5, top_skills: ["Python", "Go"] };
const sources = buildSources(profile, work, edu);

describe("traceability", () => {
  it("builds one source per record with stable ids", () => {
    expect(sources.map((x) => x.id)).toEqual(["profile", "work:w1", "edu:e1"]);
    expect(sourcesForPrompt(sources)).toContain("[work:w1] Backend Engineer at Acme");
  });

  it("normalises numbers", () => {
    expect(numbersIn("Served 1,200 merchants, cut cost 35% in 2023.")).toEqual(["1200", "35%", "2023"]);
  });

  it("accepts a claim whose source exists and whose numbers are in it", () => {
    const t = checkClaims([{ text: "Cut payment latency by 35% for 1200 merchants", sourceId: "work:w1" }], sources);
    expect(t.untraceable).toBe(0);
    expect(t.claims[0].sourceLabel).toBe("Backend Engineer at Acme");
  });

  it("flags an invented metric", () => {
    const t = checkClaims([{ text: "Cut latency by 60%", sourceId: "work:w1" }], sources);
    expect(t.claims[0]).toMatchObject({ status: "unsupported_number", unsupported: ["60%"] });
    expect(t.untraceable).toBe(1);
    expect(explainStatus(t.claims[0])).toContain("60%");
  });

  it("flags a missing or made-up source id", () => {
    const t = checkClaims([{ text: "Led a team", sourceId: null }, { text: "Won an award", sourceId: "work:nope" }], sources);
    expect(t.claims.map((c) => c.status)).toEqual(["no_source", "unknown_source"]);
    expect(t.untraceable).toBe(2);
  });

  it("ignores empty claims and counts only real ones", () => {
    const t = checkClaims([{ text: "  ", sourceId: "profile" }, { text: "Backend engineer with 5 years of experience", sourceId: "profile" }], sources);
    expect(t.total).toBe(1);
    expect(t.untraceable).toBe(0);
  });
});
