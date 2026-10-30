import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TracePanel from "@/components/TracePanel";
import { normaliseEditedSalary } from "@/lib/limits";
import { assessRisk } from "@/lib/risk";
import { nextStatus } from "../../supabase/functions/_shared/present";
import { buildSources, checkClaims, findUnsupportedNumbers } from "../../supabase/functions/_shared/traceability";
import { evaluate } from "../../supabase/functions/_shared/verdict";

const state = (ex: Parameters<typeof evaluate>[0], l: Parameters<typeof evaluate>[1], key: string) => evaluate(ex, l).results.find((r) => r.limit === key)?.state;

describe("industry rule does not match unrelated industries", () => {
  const gamble = { industryExclusions: ["Gambling"] };
  it("a video-game or sports company is not gambling", () => {
    for (const name of ["Gaming", "Sports", "Game development", "Esports", ""]) {
      expect(state({ industries: { names: [name], quote: "some quote here" } }, gamble, "industry"), name).toBe("pass");
    }
  });
  it("real gambling wording still stops", () => {
    for (const name of ["Online casino", "Sports betting platform", "Real-money gaming", "Fantasy sports"]) {
      expect(state({ industries: { names: [name], quote: "some quote here" } }, gamble, "industry"), name).toBe("fail");
    }
  });
});

describe("free-text allowed countries", () => {
  const loc = (countries: string[], allowed: string[]) =>
    state({ location: { eligibility: "listed", countries, confirmed: true, quote: "some quote here" } }, { allowedCountries: allowed }, "location");
  it("understands 'Remote EU' and expands the region", () => {
    expect(loc(["Spain"], ["Germany", "Netherlands", "Remote EU"])).toBe("pass");
    expect(loc(["India"], ["Germany", "Remote EU"])).toBe("fail");
  });
  it("does not stop on a list it cannot understand", () => {
    expect(loc(["Spain"], ["Somewhere nice"])).toBe("unknown");
    expect(loc(["India"], ["India", "Somewhere nice"])).toBe("pass");
  });
});

describe("risk: chat apps", () => {
  it("only flags a chat app that is used as the way to apply", () => {
    expect(assessRisk("Share on WhatsApp").level).toBe("low");
    expect(assessRisk("Experience with signal processing and DSP").level).toBe("low");
    expect(assessRisk("Send your CV on WhatsApp to +91 90000 00000").level).toBe("some");
    expect(assessRisk("Contact us on Telegram to apply").level).toBe("some");
  });
});

describe("job status", () => {
  it("the verdict never overwrites the user's own decisions", () => {
    for (const s of ["saved", "applied", "archived", "interview", "closed"]) expect(nextStatus(s, "stop")).toBe(s);
    expect(nextStatus("new", "stop")).toBe("blocked");
    expect(nextStatus("reviewing", "go")).toBe("reviewing");
    expect(nextStatus(null, "review")).toBe("reviewing");
  });
});

describe("edited salary units", () => {
  it("reads small INR numbers as lakh and small other numbers as thousands", () => {
    expect(normaliseEditedSalary(30, "INR")).toBe(3_000_000);
    expect(normaliseEditedSalary(2_500_000, "INR")).toBe(2_500_000);
    expect(normaliseEditedSalary(70, "USD")).toBe(70_000);
    expect(normaliseEditedSalary(70_000, "USD")).toBe(70_000);
    expect(normaliseEditedSalary(0, "INR")).toBeNull();
    expect(normaliseEditedSalary(null, "USD")).toBeNull();
  });
});

describe("numbers in the generated text are checked, not only the model's claims", () => {
  const sources = buildSources(
    { full_name: "Asha", years_of_experience: 5, phone_number: "+91 98765 43210", email: "asha@example.com" },
    [{ id: "w1", title: "Engineer", company: "Acme", start_year: 2020, achievements: "Cut cost by 20%" }],
    [],
  );
  it("flags a fabricated metric the model left out of its claims", () => {
    const resume = "Asha\n+91 98765 43210\n- Cut cost by 20%\n- Grew revenue by 300%\n1. Python";
    const found = findUnsupportedNumbers([resume], sources);
    expect(found.map((f) => f.number)).toEqual(["300%"]);
    expect(found[0].line).toContain("Grew revenue");
  });
  it("accepts numbers that are in the profile, with or without a percent sign, and ignores list markers", () => {
    expect(findUnsupportedNumbers(["Cut cost by 20 percent in 2020", "1. Led work", "2) Shipped"], sources)).toEqual([]);
    expect(checkClaims([{ text: "Cut cost by 20", sourceId: "work:w1" }], sources).untraceable).toBe(0);
  });
  it("the panel lists those numbers and no longer says nothing is invented", () => {
    const trace = { ...checkClaims([{ text: "Cut cost by 20%", sourceId: "work:w1" }], sources), unsupportedNumbers: [{ number: "300%", line: "Grew revenue by 300%" }] };
    render(<TracePanel trace={trace} />);
    expect(screen.getByText("Numbers that are not in your profile")).toBeInTheDocument();
    expect(screen.getByText("300%")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/nothing here is invented/i);
  });
  it("a clean pack still tells the user to read everything", () => {
    render(<TracePanel trace={{ ...checkClaims([{ text: "Cut cost by 20%", sourceId: "work:w1" }], sources), unsupportedNumbers: [] }} />);
    expect(screen.getByText(/Read the whole draft yourself/)).toBeInTheDocument();
  });
});

describe("saving a draft keeps the trace", () => {
  it("every application_assets re-insert in QuickApply carries version and trace on the resume row", () => {
    const src = readFileSync("src/pages/QuickApply.tsx", "utf8");
    const inserts = src.match(/asset_type: "resume"[^}]*\}/g) ?? [];
    expect(inserts.length).toBeGreaterThanOrEqual(2);
    for (const i of inserts) expect(i, i).toMatch(/trace:/);
  });
});
