import { describe, expect, it } from "vitest";
import { adminPermissions } from "@/lib/admin-permissions";
import { hasCurrentTerms, TERMS_VERSION } from "@/lib/terms";

describe("Outskill access rules", () => {
  it("requires terms version 2026-10-30", () => {
    expect(TERMS_VERSION).toBe("2026-10-30");
    expect(hasCurrentTerms(null)).toBe(false);
    expect(hasCurrentTerms({ terms_version: "2026-10-29" })).toBe(false);
    expect(hasCurrentTerms({ terms_version: "2026-10-30" })).toBe(true);
  });
  it("allows team admin testing but not roles, deletion or settings", () => {
    expect(adminPermissions("team")).toEqual({ canViewAdmin: true, canEditAdmin: true, canManageRoles: false, canDeleteUsers: false, canChangeSettings: false });
  });
  it("judges can view admin pages but cannot make any admin changes", () => {
    expect(adminPermissions("judge")).toEqual({ canViewAdmin: true, canEditAdmin: false, canManageRoles: false, canDeleteUsers: false, canChangeSettings: false });
  });
  it("only the owner has all permissions", () => {
    expect(Object.values(adminPermissions("owner")).every(Boolean)).toBe(true);
    expect(Object.values(adminPermissions(null)).some(Boolean)).toBe(false);
  });
});