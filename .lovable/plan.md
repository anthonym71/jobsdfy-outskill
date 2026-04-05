

# JobsDFY Launch Plan — Full Implementation

## Overview
This plan covers all requested changes in a single implementation pass: credit economy update, affiliate program, referral system, job URL identifier, analytics/heatmap, Twilio OTP fix, Stripe verification, onboarding enforcement, landing page overhaul, events log, and a full function health check.

---

## Phase 1: Database Migrations

### Migration 1: Update initial credits from 3 to 12
- Update `initialize_user_credits` function to set `balance = 12, lifetime_earned = 12`
- Update landing page and pricing page text from "3 free credits" to "12 free credits"

### Migration 2: Affiliate program table
```sql
CREATE TABLE affiliate_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  referral_code text UNIQUE NOT NULL,
  total_signups integer DEFAULT 0,
  paying_signups integer DEFAULT 0,
  total_earned numeric DEFAULT 0,
  payout_method text DEFAULT '',
  payout_details text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliate_partners(id),
  referred_user_id uuid NOT NULL,
  purchase_amount numeric DEFAULT 0,
  commission_rate numeric DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
```
- RLS: affiliates can view own rows; admins can view all
- Commission tiers: 25% (1-5 paying signups/30d), 30% (6-10), 40% (11-25), 50% (25+)

### Migration 3: Add `referral_link` column to `user_profiles`
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_link text DEFAULT '';
```

### Migration 4: First job free tracking
```sql
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS first_job_used boolean DEFAULT false;
```

---

## Phase 2: Core Feature Changes

### 2a. Free credits = 12 + First Job Free
- `useCredits.ts` / `initialize_user_credits` RPC: change default from 3 to 12
- In `NewJob.tsx` or dealbreaker/fit analysis edge functions: skip credit deduction if `first_job_used = false`, then set it to `true`
- Update all UI references (Landing, Pricing, CreditWidgets)

### 2b. Job URL Identifier in Jobs list
- In `Jobs.tsx`: extract LinkedIn job ID from `application_url` or `source_input` (e.g., `/view/12345` → show `#12345`)
- Display as a small badge/tag next to job title for easy identification
- Also show in `NewJob.tsx` extraction preview

### 2c. Referral "Invite a Friend" system
- Already have `referral_codes` and `referrals` tables
- Generate referral link on profile creation, store in `user_profiles.referral_link`
- When referred user signs up: award 5 credits to both referrer and referred
- Add "Invite Friends" section to Settings or Dashboard with copy-to-clipboard link

### 2d. Affiliate Program
- New admin page `AffiliateAdmin.tsx` to manage affiliates
- New user-facing page or Settings tab for affiliate signup
- Edge function `calculate-affiliate-commission` to compute tier-based rates on purchases
- 30-day rolling window for tier calculation

---

## Phase 3: Onboarding Enforcement (Security Fix)

- `OnboardingGuard.tsx`: already blocks access and redirects — currently working
- Verify the guard is truly impenetrable (no `<Outlet />` rendered without profile)
- Current code looks correct — the guard returns the blocking UI when `!hasProfile`

---

## Phase 4: Analytics & Visitor Tracking

### 4a. Visitor analytics
- Add a lightweight analytics snippet to the Landing page (e.g., Plausible or a simple Supabase-based page view tracker)
- Create `page_views` table: `id, page, referrer, user_agent, ip_hash, created_at`
- Edge function to record anonymous page views
- Admin dashboard widget showing unique visitors, page views, referrer sources

### 4b. Heatmap & Session Recording
- Integrate Microsoft Clarity (free, no API key needed) — just a `<script>` tag in `index.html`
- Provides heatmaps, session recordings, scroll depth, rage clicks
- Zero cost, unlimited traffic

---

## Phase 5: Landing Page Overhaul

- Update CTA from "Get Started Free" → "Check Your First Job Free"
- Update free tier: "12 free credits" everywhere
- Add "First job check is always free" callout
- Improve social proof section (placeholder testimonials, job counter)
- Separate recruiter pricing to its own section more clearly
- Add Clarity script for heatmap tracking

---

## Phase 6: Twilio OTP Fix

- The `verify-phone` edge function exists and looks correct
- Check if Twilio connector is properly configured and the phone number is active
- Test the edge function directly via `curl_edge_functions`
- Verify the Onboarding page's `sendOtp` / `verifyOtp` functions are calling correctly
- Fix any issues found during testing

---

## Phase 7: Stripe Payment Verification

- Test `create-checkout` and `check-subscription` edge functions
- Verify Stripe secret key is configured
- Test checkout flow for Pro ($9/mo) and Premium ($19/mo)
- Test credit pack purchases
- Verify subscription status is correctly reflected in UI

---

## Phase 8: Events/Audit Log Enhancement

- `audit_logs` table already exists with admin-only RLS
- `AdminAuditLog.tsx` already exists with search and CSV download
- Add automatic audit logging via database triggers or edge function middleware for:
  - User login events (via auth state change listener)
  - Profile updates
  - Job creates/updates
  - Subscription changes
- Ensure CSV export includes: date/time, first name, last name, email, description

---

## Phase 9: Full Function Health Check

Test all edge functions:
1. `extract-job` — test with a sample URL
2. `analyze-dealbreakers` — test with a job ID
3. `analyze-fit` — test with a job ID
4. `generate-application` — test with a job ID
5. `generate-cv` / `generate-cover-letter`
6. `verify-phone` — test send + verify
7. `create-checkout` — test session creation
8. `check-subscription` — test status check
9. `customer-portal` — test portal URL generation
10. All other functions: `parse-cv`, `enhance-star-bullets`, `generate-timeline`, etc.

Fix any broken functions discovered during testing.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Landing.tsx` | Update credits, CTA, add Clarity |
| `src/pages/Pricing.tsx` | Update free tier credits |
| `src/pages/Jobs.tsx` | Add job URL identifier badge |
| `src/pages/NewJob.tsx` | Show URL identifier in preview |
| `src/hooks/useCredits.ts` | Update initial balance references |
| `src/pages/Settings.tsx` | Add referral link section |
| `src/pages/Dashboard.tsx` | Add referral invite widget |
| `src/components/OnboardingGuard.tsx` | Verify enforcement |
| `src/pages/AdminAuditLog.tsx` | Enhance with login tracking |
| `index.html` | Add Clarity script |
| DB migration | Credits, affiliate tables, referral_link column |
| `initialize_user_credits` function | Update to 12 credits |
| Edge functions | Test all, fix broken ones |

---

## Technical Details

- **Affiliate commission tiers** (30-day rolling window):
  - 1-5 paying signups: 25% of one-time purchase price
  - 6-10: 30%
  - 11-25: 40%
  - 25+: 50%
- **Microsoft Clarity** for heatmaps: add `<script>` to `index.html`, free tier, no key needed — just a project ID from clarity.microsoft.com
- **First job free**: tracked via `first_job_used` boolean on `user_credits`; checked in edge functions before deducting credits
- **Job URL identifier**: parse `/view/(\d+)` from LinkedIn URLs, show as `#12345` badge

