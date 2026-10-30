import { describe, it, expect } from "vitest";
import { features, featureRoutes, canAccessFeatureRoute } from "@/config/features";

describe("Hackathon feature visibility", () => {
  for (const [path, feature] of Object.entries(featureRoutes)) {
    it(`${path} is off and accessible only to the owner`, () => {
      expect(features[feature]).toBe(false);
      for (const access of [null, "team", "judge"] as const) expect(canAccessFeatureRoute(path, access)).toBe(false);
      expect(canAccessFeatureRoute(path, "owner")).toBe(true);
    });
    it(`${path} can be restored through its single flag`, () => {
      const previous = features[feature];
      try { features[feature] = true; expect(canAccessFeatureRoute(path, null)).toBe(true); }
      finally { features[feature] = previous; }
    });
  }
  it("keeps Quick Apply and every unrelated route enabled", () => {
    for (const path of ["/app", "/app/apply/job-id", "/app/new-job", "/app/interview"]) expect(canAccessFeatureRoute(path, null)).toBe(true);
  });
});