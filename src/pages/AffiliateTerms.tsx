import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AffiliateTerms = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Affiliate Program — Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mt-1">Last updated: April 2026</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 space-y-4 prose prose-sm max-w-none text-foreground">
        <h2 className="text-lg font-semibold">1. Overview</h2>
        <p>The JobsDFY Affiliate Program allows approved participants ("Affiliates") to earn commission by referring new paying customers to JobsDFY. By joining the program, you agree to these terms.</p>

        <h2 className="text-lg font-semibold">2. Commission Structure</h2>
        <ul>
          <li><strong>1–5 paying signups</strong> (30-day rolling): 25% commission</li>
          <li><strong>6–10 paying signups</strong>: 30% commission</li>
          <li><strong>11–25 paying signups</strong>: 40% commission</li>
          <li><strong>25+ paying signups</strong>: 50% commission</li>
        </ul>
        <p>Commission is calculated on the first payment from each referred customer. Recurring commissions apply only to active subscriptions referred by you.</p>

        <h2 className="text-lg font-semibold">3. Eligibility</h2>
        <p>Any registered JobsDFY user can apply. Approval is automatic upon agreement to these terms. We reserve the right to terminate any affiliate account that violates these terms.</p>

        <h2 className="text-lg font-semibold">4. Referral Tracking</h2>
        <p>Referrals are tracked via your unique affiliate link or slug. The referral cookie lasts 30 days. If a visitor clears cookies or uses a different device, the referral may not be tracked.</p>

        <h2 className="text-lg font-semibold">5. Payouts</h2>
        <ul>
          <li>Minimum payout threshold: $50</li>
          <li>Payouts processed monthly on the 15th</li>
          <li>Available methods: PayPal, Bank Transfer, Crypto (USDT)</li>
          <li>You are responsible for any taxes on affiliate earnings</li>
        </ul>

        <h2 className="text-lg font-semibold">6. Prohibited Activities</h2>
        <ul>
          <li>Self-referrals (creating accounts to earn commission)</li>
          <li>Spam, unsolicited messaging, or misleading advertising</li>
          <li>Bidding on "JobsDFY" brand keywords in paid ads</li>
          <li>Misrepresenting the product or making false claims</li>
        </ul>

        <h2 className="text-lg font-semibold">7. Termination</h2>
        <p>Either party can terminate the affiliate relationship at any time. Outstanding commissions above the minimum threshold will still be paid out. Fraudulent referrals will result in forfeiture of all unpaid commissions.</p>

        <h2 className="text-lg font-semibold">8. FAQ</h2>
        <p><strong>Q: How do I get paid?</strong><br />A: Set up your payout method in Settings → Affiliate Program. Payouts are processed monthly.</p>
        <p><strong>Q: Can I promote on social media?</strong><br />A: Yes! We encourage it. Just don't make misleading claims about the product.</p>
        <p><strong>Q: What counts as a "paying signup"?</strong><br />A: Any user who signs up via your link and purchases a subscription or credit pack within 30 days.</p>
      </section>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        <Button onClick={() => navigate("/app/settings#affiliate")}>Go to Affiliate Dashboard</Button>
      </div>
    </div>
  );
};

export default AffiliateTerms;
