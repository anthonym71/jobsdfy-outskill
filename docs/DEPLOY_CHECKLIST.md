# Deploy checklist

Nothing from the `priorities-round2` branch has been deployed or applied to a live database. Do these in order. Stop and look if any step fails.

## 0. Before you start
- [ ] Read `MORNING_REPORT.md` (what is and is not verified) and `DECISIONS.md` (calls made for you).
- [ ] Confirm you may modify and redeploy this project. The in-app Terms name Anthony Mallett as IP owner.
- [ ] Work on a **copy** first if you can: a Supabase branch or a second project. The migrations are additive, but the new code expects them.

## 1. Apply the migrations (database first)
The new code reads columns that do not exist yet, so apply these before deploying functions or the frontend.

- [ ] Open the Supabase SQL editor and run `docs/apply-migrations-0004-0007.sql` (the four files in `drizzle/migrations/` joined in order). Every statement is `ADD COLUMN IF NOT EXISTS`, so re-running is safe.
- [ ] Check the columns exist:
  - `jobs`: `extraction`, `first_seen_at`, `risk`
  - `job_blockers`: `limit_key`, `state`, `quote`, `soft`
  - `user_non_negotiables`: `notice_period_days`, `max_office_days`, `languages`, `utc_offset`
  - `application_assets`: `trace`
- [ ] If your project uses Supabase's own migration history rather than the SQL editor, copy the files into `supabase/migrations/` with timestamps instead. The repo currently keeps them in `drizzle/migrations/`.
- [ ] Regenerate `src/integrations/supabase/types.ts` if you prefer generated types over the hand edits made here.

## 2. Secrets
- [ ] `LOVABLE_API_KEY` set as a Supabase secret (used by `extract-job` and `generate-application`).
- [ ] `FIRECRAWL_API_KEY` set if you want URL import (existing requirement).
- [ ] Nothing else is new.

## 3. Deploy the edge functions
Only three functions changed, plus the shared modules they import.

- [ ] `extract-job`: returns `evidence` (quoted facts) and `risk`
- [ ] `analyze-dealbreakers`: no longer calls an AI model; runs `_shared/verdict.ts`
- [ ] `generate-application`: returns `claims` and `traceability`
- [ ] Shared files deploy with them: `_shared/verdict.ts`, `limits.ts`, `present.ts`, `extraction-schema.ts`, `risk.ts`, `traceability.ts`

## 4. Measure the verdict with the real model (the most important check)
- [ ] `LOVABLE_API_KEY=... npm run eval:run:v2`
- [ ] `npm run eval:score:v2`. Read **STOP->GO misses** first: a missed STOP wastes the user's time, which is the product's promise.
- [ ] Compare `eval/results/engine-v2.extractions.json` with `eval/oracle-extractions.ts`. A disagreement is a reading error, not a rules error.
- [ ] The 53 postings are synthetic. Add 20 or more real postings (especially Indian ones) before trusting any number. See `eval/README.md`.
- [ ] If the engine misses STOPs more often than it catches them, ship the result as a list of flags, not a verdict.

## 5. Deploy the frontend
- [ ] Run `npm install --legacy-peer-deps` first: `@testing-library/dom` was added to package.json but neither lockfile (`package-lock.json`, `bun.lock`) was refreshed, so a frozen-lockfile install (`npm ci`, `bun install --frozen-lockfile`) will fail until you regenerate one.
- [ ] `npm test`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run build` all pass.
- [ ] Decide on feature flags: all optional areas are **off** by default. Set `VITE_FEATURES` (for example `assessments,referrals`) to bring groups back. Groups: `profileExtras`, `assessments`, `gamification`, `referrals`, `hiring`, `events`.
- [ ] Note: with `events` or `hiring` on, `/` serves the old landing page (`LandingLegacy.tsx`) because it holds the public Events/Jobs tabs.

## 6. Smoke test (signed in, real data)
- [ ] Sign up, import a CV on step 1, check "what we understood", set limits (notice period, CTC in LPA, office days).
- [ ] Paste a posting that should STOP, one that should REVIEW, one that should GO. Each STOP card shows a quote.
- [ ] Save a job: a "Decide on ..." task appears on the dashboard in two days. A REVIEW creates a "Check the unclear limits" task for tomorrow.
- [ ] Generate a pack: the "Where each line comes from" panel appears; Approve stays disabled until you tick the review box.
- [ ] Tasks page: Export .ics downloads a file that imports into your calendar.
- [ ] An older job (saved before this change) shows REVIEW with a note to add it again.

## 7. Things to decide or fix that are outside this branch
- [ ] **Pricing.** Checkout is in US dollars ($9 and $49.99 a month). The research suggested an India consumer ceiling of a few hundred rupees a month. No INR prices were invented; that is your call and a Stripe change.
- [ ] **Tracking scripts.** `index.html` loads Microsoft Clarity (session recording) and a Lovable script. Confirm you want session recording on a product that handles CVs, and that the privacy policy covers it.
- [ ] **Share image.** The `og:image` is a signed, expiring storage URL. Replace it with a permanent image.
- [ ] **Postings in the eval set are synthetic.** Replace them with real ones.
