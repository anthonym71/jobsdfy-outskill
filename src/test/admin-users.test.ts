import { describe, expect, it } from "vitest";
import { canResetUserPassword, passwordResetRedirect } from "../../supabase/functions/admin-reset-password/policy";

describe("Admin password recovery", () => {
  it("permits the owner to request password resets", () => {
    expect(canResetUserPassword(true)).toBe(true);
  });
  it("denies password reset management to judges and other non-owners", () => {
    expect(canResetUserPassword(false)).toBe(false);
  });
  it("sends account recovery to the public JobsDFY reset page", () => {
    expect(passwordResetRedirect).toBe("https://jobsdfy.com/reset-password");
  });
});