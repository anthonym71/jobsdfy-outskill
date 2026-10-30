import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import FeatureGate from "@/components/FeatureGate";
import { ALL_FEATURES, featureForPath, isPathEnabled, parseFeatures, visibleNav } from "@/lib/features";

describe("feature flags", () => {
  it("everything optional is off by default", () => {
    expect(parseFeatures(undefined).size).toBe(0);
    expect(parseFeatures("").size).toBe(0);
  });

  it("turns groups on from a comma list and ignores unknown names", () => {
    expect([...parseFeatures(" assessments, referrals ,nope")].sort()).toEqual(["assessments", "referrals"]);
    expect(parseFeatures(ALL_FEATURES.join(",")).size).toBe(ALL_FEATURES.length);
  });

  it("maps routes to their group, and leaves core routes alone", () => {
    expect(featureForPath("/app/books")).toBe("profileExtras");
    expect(featureForPath("/app/recruiter/candidates")).toBe("hiring");
    expect(featureForPath("/app/event-registrations")).toBe("events");
    expect(featureForPath("/app/events/123")).toBe("events");
    for (const core of ["/app", "/app/new-job", "/app/jobs", "/app/jobs/1", "/app/dealbreakers/1", "/app/apply/1", "/app/tasks", "/app/profile", "/app/settings", "/app/pricing", "/app/support", "/app/interview"]) {
      expect(featureForPath(core), core).toBeNull();
    }
  });

  it("hides gated nav items but keeps the core product", () => {
    const nav = [{ to: "/app" }, { to: "/app/new-job" }, { to: "/app/books" }, { to: "/app/assessments" }, { to: "/app/tasks" }, { to: "/app/companies" }];
    expect(visibleNav(nav, new Set()).map((n) => n.to)).toEqual(["/app", "/app/new-job", "/app/tasks"]);
    expect(visibleNav(nav, parseFeatures("assessments")).map((n) => n.to)).toContain("/app/assessments");
    expect(isPathEnabled("/app/books", parseFeatures("profileExtras"))).toBe(true);
  });

  it("the real sidebar and routes only reference known paths", () => {
    const layout = readFileSync("src/components/layout/AppLayout.tsx", "utf8");
    const app = readFileSync("src/App.tsx", "utf8");
    for (const [, path] of layout.matchAll(/to: "(\/app[^"]*)"/g)) {
      expect(app, path).toContain(`path="${path}"`);
    }
  });

  it("every gated route in App.tsx is wrapped in FeatureGate", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    for (const [, path] of app.matchAll(/<Route path="(\/app[^"]*)" element=\{(.*?)\} \/>/g)) {
      const wrapped = /FeatureGate/.test(app.split(`path="${path}"`)[1].split("/>")[0]);
      expect(wrapped, path).toBe(featureForPath(path) !== null);
    }
  });
});

describe("FeatureGate", () => {
  it("sends the user to the dashboard when the group is off", () => {
    render(
      <MemoryRouter initialEntries={["/app/assessments"]}>
        <Routes>
          <Route path="/app" element={<p>dashboard</p>} />
          <Route path="/app/assessments" element={<FeatureGate feature="assessments"><p>assessments page</p></FeatureGate>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.queryByText("assessments page")).not.toBeInTheDocument();
  });
});

describe("the verdict and fit score do not read the context layer", () => {
  const files = [
    "supabase/functions/analyze-dealbreakers/index.ts",
    "supabase/functions/analyze-fit/index.ts",
    "supabase/functions/analyze-gap/index.ts",
    "supabase/functions/_shared/verdict.ts",
    "supabase/functions/_shared/limits.ts",
  ];
  const contextTables = ["books", "movies", "memory_dump", "knowledgebase_entries", "social_posts", "user_achievements", "assessment"];
  for (const f of files) {
    it(f, () => {
      const src = readFileSync(f, "utf8");
      for (const t of contextTables) expect(src, `${f} reads ${t}`).not.toMatch(new RegExp(`from\\(["']${t}`, "i"));
      expect(src).not.toMatch(/\bassessment/i);
    });
  }
});
