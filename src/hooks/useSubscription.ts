import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const STRIPE_TIERS = {
  pro: {
    name: "Pro",
    price_id: "price_1UW8P32E142c9Abt5wHxNqM2",
    product_id: "prod_VXCoP7WBMF3Ktu",
    price: 9,
    credits: 30,
  },
  premium: {
    name: "Premium",
    price_id: "price_1UW8Pz2E142c9AbtFaDwNnlE",
    product_id: "prod_VXCpLNBQ3a2NC3",
    price: 49.99,
    credits: 100,
  },
} as const;

export const RECRUITER_TIERS = {
  standard: {
    name: "Recruiter Standard",
    price_id: "price_1UW8Pz2E142c9AbtJyDGp98y",
    product_id: "prod_VXCpWKUfRyvNsx",
    price: 9,
    maxJobs: 10,
  },
  unlimited: {
    name: "Recruiter Unlimited",
    price_id: "price_1UW8Pz2E142c9AbteEgOeQth",
    product_id: "prod_VXCpHO6TpoNBDM",
    price: 49,
    maxJobs: Infinity,
  },
} as const;

export const CREDIT_PACKS = [
  { name: "10 Credits", price_id: "price_1UW8Q02E142c9Abt7p0lvKkS", price: 4.99, credits: 10 },
  { name: "50 Credits", price_id: "price_1UW8Q02E142c9AbtYjeoL34N", price: 19.99, credits: 50 },
  { name: "100 Credits", price_id: "price_1UW8Q12E142c9AbtsiKkWAh6", price: 24.99, credits: 100 },
  { name: "200 Credits", price_id: "price_1UW8Q12E142c9AbtyGTbIdEc", price: 59.99, credits: 200 },
  { name: "500 Credits", price_id: "price_1UW8Q12E142c9AbtUhyuiNXP", price: 149.00, credits: 500 },
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
