import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import FeatureGate from "@/components/FeatureGate";
import { ALL_FEATURES, featureForPath, isPathEnabled, parseFeatures, visibleNav } from "@/lib/features";

describe("feature flags", () => {
  it("hides the four profile extras by default and keeps the rest of the app visible", () => {
    const on = parseFeatures(undefined);
    expect(on.has("profileExtras")).toBe(false);
    for (const k of ["assessments", "hiring", "events"] as const) expect(on.has(k), k).toBe(true);
  });

  it("one switch brings a hidden group back; a minus switches a visible one off; unknown names are ignored", () => {
    expect(parseFeatures("profileExtras").has("profileExtras")).toBe(true);
    expect(parseFeatures(" referrals ,nope").has("referrals")).toBe(true);
    expect(parseFeatures("-events").has("events")).toBe(false);
    expect(parseFeatures(ALL_FEATURES.join(",")).size).toBe(ALL_FEATURES.length);
  });

  it("Books, Movies, Memory Dump and Autobiography are hidden; photo gallery, social, events and assessments stay", () => {
    const on = parseFeatures(undefined);
    for (const p of ["/app/books", "/app/movies", "/app/memory-dump", "/app/autobiography"]) expect(isPathEnabled(p, on), p).toBe(false);
    for (const p of ["/app/photo-gallery", "/app/social-media", "/app/events", "/app/assessments", "/app/recruiter/candidates", "/app/pricing"]) expect(isPathEnabled(p, on), p).toBe(true);
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
    expect(visibleNav(nav, parseFeatures("-assessments")).map((n) => n.to)).not.toContain("/app/assessments");
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
      <MemoryRouter initialEntries={["/app/books"]}>
        <Routes>
          <Route path="/app" element={<p>dashboard</p>} />
          <Route path="/app/books" element={<FeatureGate feature="profileExtras"><p>books page</p></FeatureGate>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.queryByText("books page")).not.toBeInTheDocument();
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
