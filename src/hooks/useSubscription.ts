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
    price_id: "price_1TIH4T2E142c9Abt028kStMG",
    product_id: "prod_UGohJceyyZQff3",
    price: 19,
    credits: 100,
  },
} as const;

export const CREDIT_PACKS = [
  { name: "10 Credits", price_id: "price_1TIH512E142c9AbtUaWjCMWu", price: 4.99, credits: 10 },
  { name: "50 Credits", price_id: "price_1TIH5S2E142c9AbtB9RhOqeH", price: 14.99, credits: 50 },
] as const;

export type SubscriptionTier = "free" | "pro" | "premium";

export interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    tier: "free",
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ subscribed: false, tier: "free", subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      let tier: SubscriptionTier = "free";
      if (data?.subscribed && data?.product_id) {
        if (data.product_id === STRIPE_TIERS.premium.product_id) tier = "premium";
        else if (data.product_id === STRIPE_TIERS.pro.product_id) tier = "pro";
      }

      setState({
        subscribed: data?.subscribed ?? false,
        tier,
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
