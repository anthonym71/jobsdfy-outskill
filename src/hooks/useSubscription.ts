import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const STRIPE_TIERS = {
  pro: {
    name: "Pro",
    price_id: "price_1TIH3z2E142c9AbtNq7hfT82",
    product_id: "prod_UGohHAEChdqTA8",
    price: 9,
    credits: 30,
  },
  premium: {
    name: "Premium",
    price_id: "price_1TJlGx2E142c9AbtSMd8aFKc",
    product_id: "prod_UILyrR0VTjfQtV",
    price: 49.99,
    credits: 100,
  },
} as const;

export const RECRUITER_TIERS = {
  standard: {
    name: "Recruiter Standard",
    price_id: "price_1TIJEi2E142c9AbtYY7H6JqG",
    product_id: "prod_UGqwkBswf8Qd90",
    price: 9,
    maxJobs: 10,
  },
  unlimited: {
    name: "Recruiter Unlimited",
    price_id: "price_1TIJFB2E142c9Abt74jT8Dni",
    product_id: "prod_UGqxnwGnSiBqLG",
    price: 49,
    maxJobs: Infinity,
  },
} as const;

export const CREDIT_PACKS = [
  { name: "10 Credits", price_id: "price_1TIH512E142c9AbtUaWjCMWu", price: 4.99, credits: 10 },
  { name: "50 Credits", price_id: "price_1TJlHJ2E142c9AbtgLNOgCgR", price: 19.99, credits: 50 },
  { name: "100 Credits", price_id: "price_1TJlHi2E142c9Abt7ag2R7Yo", price: 24.99, credits: 100 },
  { name: "200 Credits", price_id: "price_1TJlI22E142c9AbtbI8ShYd8", price: 59.99, credits: 200 },
  { name: "500 Credits", price_id: "price_1TJlIK2E142c9AbtCxpOOG2O", price: 149.00, credits: 500 },
] as const;

export type SubscriptionTier = "free" | "pro" | "premium";
export type RecruiterTier = "free" | "standard" | "unlimited";

export interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  recruiterTier: RecruiterTier;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    tier: "free",
    recruiterTier: "free",
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ subscribed: false, tier: "free", recruiterTier: "free", subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      let tier: SubscriptionTier = "free";
      let recruiterTier: RecruiterTier = "free";

      if (data?.subscribed && data?.product_id) {
        if (data.product_id === STRIPE_TIERS.premium.product_id) tier = "premium";
        else if (data.product_id === STRIPE_TIERS.pro.product_id) tier = "pro";
        else if (data.product_id === RECRUITER_TIERS.unlimited.product_id) recruiterTier = "unlimited";
        else if (data.product_id === RECRUITER_TIERS.standard.product_id) recruiterTier = "standard";
      }

      if (data?.all_product_ids) {
        for (const pid of data.all_product_ids) {
          if (pid === RECRUITER_TIERS.unlimited.product_id) recruiterTier = "unlimited";
          else if (pid === RECRUITER_TIERS.standard.product_id && recruiterTier === "free") recruiterTier = "standard";
          if (pid === STRIPE_TIERS.premium.product_id) tier = "premium";
          else if (pid === STRIPE_TIERS.pro.product_id && tier === "free") tier = "pro";
        }
      }

      setState({
        subscribed: data?.subscribed ?? false,
        tier,
        recruiterTier,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const checkout = useCallback(async (priceId: string, mode: "subscription" | "payment" = "subscription") => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, mode },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, []);

  const manageSubscription = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, []);

  return { ...state, checkout, manageSubscription, refresh: checkSubscription };
}
