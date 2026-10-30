import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
import { CREDIT_PACKS, RECRUITER_TIERS, STRIPE_TIERS } from "@/hooks/useSubscription";

describe("Replacement Stripe test catalog", () => {
  it.each([
    ["pro", 9, 30, "price_1UW8P32E142c9Abt5wHxNqM2", "prod_VXCoP7WBMF3Ktu"],
    ["premium", 49.99, 100, "price_1UW8Pz2E142c9AbtFaDwNnlE", "prod_VXCpLNBQ3a2NC3"],
  ] as const)("preserves %s price and credits with the new Stripe IDs", (tier, price, credits, price_id, product_id) => {
    expect(STRIPE_TIERS[tier]).toMatchObject({ price, credits, price_id, product_id });
  });

  it.each([
    ["standard", 9, 10, "price_1UW8Pz2E142c9AbtJyDGp98y", "prod_VXCpWKUfRyvNsx"],
    ["unlimited", 49, Infinity, "price_1UW8Pz2E142c9AbteEgOeQth", "prod_VXCpHO6TpoNBDM"],
  ] as const)("preserves recruiter %s price and job allowance with the new IDs", (tier, price, maxJobs, price_id, product_id) => {
    expect(RECRUITER_TIERS[tier]).toMatchObject({ price, maxJobs, price_id, product_id });
  });

  it.each([
    [10, 4.99, "price_1UW8Q02E142c9Abt7p0lvKkS"],
    [50, 19.99, "price_1UW8Q02E142c9AbtYjeoL34N"],
    [100, 24.99, "price_1UW8Q12E142c9AbtsiKkWAh6"],
    [200, 59.99, "price_1UW8Q12E142c9AbtyGTbIdEc"],
    [500, 149, "price_1UW8Q12E142c9AbtUhyuiNXP"],
  ] as const)("preserves the %i-credit pack with the new Stripe price", (credits, price, price_id) => {
    expect(CREDIT_PACKS.find(pack => pack.credits === credits)).toMatchObject({ credits, price, price_id });
  });
});