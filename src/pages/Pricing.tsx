import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles, Loader2 } from "lucide-react";
import { useSubscription, STRIPE_TIERS, CREDIT_PACKS, type SubscriptionTier } from "@/hooks/useSubscription";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const tierFeatures: Record<SubscriptionTier, string[]> = {
  free: ["3 free credits", "Basic job analysis", "Dealbreaker check", "Community support"],
  pro: ["30 credits/month", "Full AI fit scoring", "Quick Apply drafts", "Priority analysis", "Email support"],
  premium: ["100 credits/month", "Unlimited AI analysis", "Priority support", "Advanced insights", "Early access features"],
};

const Pricing = () => {
  const { tier: currentTier, subscribed, loading, checkout, manageSubscription } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment" = "subscription") => {
    setCheckoutLoading(priceId);
    try {
      await checkout(priceId, mode);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl font-bold text-foreground">Choose Your Plan</h1>
        <p className="text-muted-foreground">Start free, upgrade when you need more power.</p>
      </div>

      {/* Subscription tiers */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Free */}
        <div className={`rounded-xl border p-6 space-y-4 ${currentTier === "free" ? "border-primary ring-2 ring-primary/20" : "border-border"} bg-card`}>
          {currentTier === "free" && <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Current Plan</span>}
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Free</h3>
            <p className="text-3xl font-bold text-foreground mt-2">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          </div>
          <ul className="space-y-2">
            {tierFeatures.free.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}</li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" disabled>Current Plan</Button>
        </div>

        {/* Pro */}
        <div className={`rounded-xl border p-6 space-y-4 ${currentTier === "pro" ? "border-primary ring-2 ring-primary/20" : "border-border"} bg-card`}>
          {currentTier === "pro" && <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Current Plan</span>}
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Pro</h3>
            <p className="text-3xl font-bold text-foreground mt-2">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          </div>
          <ul className="space-y-2">
            {tierFeatures.pro.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}</li>
            ))}
          </ul>
          {currentTier === "pro" ? (
            <Button variant="outline" className="w-full" onClick={manageSubscription}>Manage Plan</Button>
          ) : (
            <Button className="w-full" onClick={() => handleCheckout(STRIPE_TIERS.pro.price_id)} disabled={!!checkoutLoading}>
              {checkoutLoading === STRIPE_TIERS.pro.price_id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {currentTier === "premium" ? "Downgrade" : "Upgrade"} to Pro
            </Button>
          )}
        </div>

        {/* Premium */}
        <div className={`rounded-xl border p-6 space-y-4 relative ${currentTier === "premium" ? "border-primary ring-2 ring-primary/20" : "border-amber-500/50"} bg-card`}>
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium text-amber-900 bg-amber-400 px-3 py-0.5 rounded-full">Most Popular</span>
          {currentTier === "premium" && <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Current Plan</span>}
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" /> Premium</h3>
            <p className="text-3xl font-bold text-foreground mt-2">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          </div>
          <ul className="space-y-2">
            {tierFeatures.premium.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}</li>
            ))}
          </ul>
          {currentTier === "premium" ? (
            <Button variant="outline" className="w-full" onClick={manageSubscription}>Manage Plan</Button>
          ) : (
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950" onClick={() => handleCheckout(STRIPE_TIERS.premium.price_id)} disabled={!!checkoutLoading}>
              {checkoutLoading === STRIPE_TIERS.premium.price_id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>

      {/* Credit Top-Ups */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">Need more credits?</h2>
          <p className="text-sm text-muted-foreground">Buy credit packs anytime — no subscription needed.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 max-w-lg mx-auto">
          {CREDIT_PACKS.map(pack => (
            <div key={pack.price_id} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{pack.name}</p>
                <p className="text-sm text-muted-foreground">${pack.price}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleCheckout(pack.price_id, "payment")} disabled={!!checkoutLoading}>
                {checkoutLoading === pack.price_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
