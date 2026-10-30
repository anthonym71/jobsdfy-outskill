import { describe, expect, it } from "vitest";
import { cvToForm, cvToRows, understood, yearsOfExperience, type ParsedCv } from "@/lib/cvImport";

const cv: ParsedCv = {
  fullName: " Asha Rao ",
  headline: "Backend Engineer",
  location: "Bengaluru, India",
  topSkills: ["Python", " Go ", ""],
  languages: ["English", "Hindi"],
  workHistory: [
    { title: "Senior Engineer", company: "Acme", startYear: 2021, isCurrent: true, skills: ["Python"] },
    { title: "Engineer", company: "Beta", startYear: 2018, endYear: 2021 },
  ],
  education: [{ institution: "VIT", degree: "B.Tech", endYear: 2018 }],
};

describe("cvToForm", () => {
  it("fills only what the CV states, trimmed, and copies languages to the limits step", () => {
    expect(cvToForm(cv, 2026)).toEqual({
      fullName: "Asha Rao", location: "Bengaluru, India", headline: "Backend Engineer",
      topSkills: "Python, Go", languages: "English, Hindi", nonNegLanguages: "English, Hindi", yearsExp: "8",
    });
  });
  it("returns nothing for an empty CV instead of guessing", () => {
    expect(cvToForm({}, 2026)).toEqual({});
  });
});

describe("yearsOfExperience", () => {
  it("uses the earliest start year and ignores impossible years", () => {
    expect(yearsOfExperience(cv, 2026)).toBe("8");
    expect(yearsOfExperience({ workHistory: [{ startYear: 1800 }, { startYear: 2999 }] }, 2026)).toBe("");
    expect(yearsOfExperience({}, 2026)).toBe("");
  });
});

describe("cvToRows", () => {
  it("maps to the table columns and skips empty entries", () => {
    const { work, education } = cvToRows({ ...cv, workHistory: [...cv.workHistory!, {}], education: [...cv.education!, {}] }, "u1");
    expect(work).toHaveLength(2);
    expect(work[0]).toMatchObject({ user_id: "u1", title: "Senior Engineer", company: "Acme", is_current: true, employment_type: "Full-time", sort_order: 0 });
    expect(work[1].end_year).toBe(2021);
    expect(education).toEqual([{ user_id: "u1", institution: "VIT", degree: "B.Tech", field: null, start_year: null, end_year: 2018, description: null }]);
  });
});

describe("understood", () => {
  it("lists short checkable facts", () => {
    const facts = understood(cv, 2026);
    expect(facts.find((f) => f.label === "Work history")?.value).toBe("2 roles, most recent: Senior Engineer at Acme");
    expect(facts.find((f) => f.label === "Education")?.value).toBe("B.Tech, VIT");
    expect(understood({}, 2026)).toEqual([]);
  });
});
