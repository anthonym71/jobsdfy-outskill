import { describe, expect, it } from "vitest";
import { requireTestResource, requireTestStripe } from "../../supabase/functions/_shared/stripe-test-mode";

describe("JobsDFY Outskill Stripe test-only requirement", () => {
  it("allows test resources", () => {
    expect(() => requireTestResource({ livemode: false })).not.toThrow();
  });
  it("rejects live resources", () => {
    expect(() => requireTestResource({ livemode: true })).toThrow("Live Stripe payments are disabled");
  });
  it("checks the provider mode before allowing payment actions", async () => {
    await expect(requireTestStripe({ balance: { retrieve: async () => ({ livemode: true }) } })).rejects.toThrow("Live Stripe payments are disabled");
    await expect(requireTestStripe({ balance: { retrieve: async () => ({ livemode: false }) } })).resolves.toBeUndefined();
  });
});