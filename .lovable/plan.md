

# Build Plan — Admin Credit Adjustment, Affiliate UI, GHL Widget, Stripe Verification

## Memory Saves (3 files)

### 1. `mem://features/v3-v4-business-model.md`
Save Voice/Video AI clone vision, anonymous headhunting marketplace, 1000-point scoring system, revenue targets ($1M+/mo), competitive moat, and risk factors.

### 2. `mem://preferences/business-advisor.md`
Save: "Challenge non-viable/unprofitable decisions with 3 alternatives. Assess business/marketing sense before implementing. If Claude/ChatGPT can do something cheaper than Lovable, recommend routing to them."

### 3. `mem://features/ghl.md`
Save: "User has paid GHL SaaS ($97/mo unlimited AI). Also has CloserX paid account. Use for conversations, AI bot, voice, and marketing automation."

### 4. Update `mem://index.md`
Add references to all three new memory files.

---

## Feature 1: Admin Credit Adjustment (Add AND Deduct)

**Current state:** `AdminUsers.tsx` has a credit allocation dialog (line 616-639) that only adds credits. `handleAllocateCredits` (line 159) directly updates `user_credits` and inserts into `credit_transactions` with action `earned`.

**Changes:**

### Edge Function: `admin-adjust-credits/index.ts` (NEW)
- Accepts: `user_id`, `amount` (positive or negative), `reason`
- Validates caller is admin via `has_role` RPC
- Uses service role to update `user_credits.balance` (clamped to min 0)
- Inserts `credit_transactions` with action `earned` (positive) or `spent` (negative)
- Inserts `audit_logs` entry
- Returns new balance

### `src/pages/AdminUsers.tsx`
- Replace "Allocate Credits" dialog with "Adjust Credits" dialog
- Add toggle/select: "Add" or "Deduct" mode
- Amount field accepts positive numbers; mode determines sign
- Show user's current balance in the dialog
- Replace `handleAllocateCredits` to call `admin-adjust-credits` edge function instead of direct DB writes (more secure — admin password verification replaced by edge function admin role check)
- Update button text: "Add X Credits" or "Deduct X Credits"

---

## Feature 2: Affiliate Program UI

**Current state:** DB tables `affiliate_partners` and `affiliate_conversions` exist. Edge function `calculate-affiliate-commission` exists. No UI anywhere.

### `src/pages/Settings.tsx` — Add Affiliate Section
- Add new section between "Invite a Friend" and "Danger Zone"
- "Become an Affiliate Partner" — for users who want to earn commission (different from referral credits)
- If not yet an affiliate: "Apply" button → inserts into `affiliate_partners` with auto-generated referral code
- If already an affiliate: show dashboard card with:
  - Unique affiliate referral code and link
  - Total signups / paying signups
  - Current commission tier (25%/30%/40%/50% based on 30-day rolling)
  - Total earned
  - Payout method form (PayPal email or bank details)

### `src/pages/Landing.tsx` — Add Affiliate CTA Section
- New section before the final CTA: "Earn 25-50% Commission"
- Brief copy: "Know someone who'd love JobsDFY? Earn recurring commission on every paying referral. Tiered rates reward your success."
- CTA button: "Become an Affiliate" → links to `/auth?mode=signup` (or `/app/settings#affiliate` if logged in)

### `src/pages/AdminUsers.tsx` or new `src/pages/AdminAffiliates.tsx`
- New tab or page showing all affiliate partners
- Table: name, referral code, total signups, paying signups, commission earned, payout method
- Ability to view conversions per affiliate
- Mark payouts as processed

---

## Feature 3: GHL Chat Widget Integration

**What you need to do (your action required):**

1. Log into your GoHighLevel dashboard
2. Go to **Sites > Chat Widget** (or **Conversations > Chat Widget**)
3. Configure your chat widget appearance, bot greeting, and AI agent settings
4. Copy the embed snippet — it will look something like:
```html
<script src="https://widgets.leadconnectorhq.com/loader.js"
  data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
  data-widget-id="YOUR_WIDGET_ID">
</script>
```
5. Paste it here and I'll embed it in `index.html` (for landing page) and the app layout

**What I'll build:**
- Add the GHL script tag to `index.html` `<body>` (alongside Clarity)
- No custom chat widget code needed — GHL handles everything
- If you want the widget hidden on certain pages, I can add conditional logic

---

## Feature 4: Stripe Verification

**What exists:** `create-checkout`, `check-subscription`, `customer-portal` edge functions. `useSubscription` hook. `Pricing.tsx` page with checkout buttons.

**Verification approach:**
- I'll use the Stripe tools to check account info, list products, list prices, and verify they match the IDs in code
- Confirm `STRIPE_SECRET_KEY` is set as a secret
- Test edge functions via `curl_edge_functions` tool
- Report back on what works and what needs fixing

---

## Build Order

1. Save all memory files (4 writes)
2. Create `admin-adjust-credits` edge function
3. Update `AdminUsers.tsx` — adjust credits dialog (add/deduct)
4. Add affiliate dashboard to `Settings.tsx`
5. Add affiliate section to `Landing.tsx`
6. Add affiliate admin management (new tab or page)
7. Verify Stripe setup via tools
8. GHL widget — pending your snippet

---

## What You Need To Do

| Task | Where | Priority |
|------|-------|----------|
| Get GHL chat widget snippet | GHL Dashboard > Sites > Chat Widget | Before I can embed it |
| Set up `support@jobsdfy.com` | Your domain hosting provider | For future email notifications |
| Test Stripe checkout | Published app > Pricing page | After I verify the backend |

**Tip:** Setting up the GHL widget and email are configuration tasks — if you need step-by-step help, ask ChatGPT "How do I set up a chat widget in GoHighLevel" to save Lovable credits.

