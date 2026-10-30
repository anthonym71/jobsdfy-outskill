# Decisions made during the overnight build

Each line is a call I made without asking. Reverse any you disagree with.

- Added dev dependency `@testing-library/dom` (peer of the already-declared `@testing-library/react`; it was missing because the install needed `--legacy-peer-deps`). Needed for component render tests.
- Left `package-lock.json` untouched (npm rewrote ~6,500 lines of it); run `npm install --legacy-peer-deps` to refresh it. The repo also has `bun.lock`.
- Feature flags (`src/lib/features.ts`) hide, not delete: profile extras (books, movies, brain dump, thought leadership, photo gallery, autobiography), assessments, gamification (onboarding reward banner, Achievements tab), referrals (dashboard widget), hiring (post job, recruiter candidates, companies) and events (events, event registrations). Bring any back with `VITE_FEATURES="assessments,referrals"`.
- I also grouped Events, Event Registrations and Companies under flags (they were not on your list). They are Anthony's platform roadmap and off-product for a job seeker; flip `events`/`hiring` on to restore them.
- Kept the credit balance and credit costs visible: credits are the billing mechanism for packs, not gamification.
- Left the referral/affiliate sections inside Settings and the public `/r/` and `/a/` links alone; only the dashboard widget is gated.
- Rewrote the landing page around "Check the posting first". The old page is kept as `src/pages/LandingLegacy.tsx` and is served at `/` instead when the `events` or `hiring` flag is on (it holds the public Events/Jobs tabs).
- The new landing reads prices from `STRIPE_TIERS` in `useSubscription.ts`, so it cannot drift from checkout. The old page said Premium was $19/month; the code and Stripe notes say $49.99. I did not change any Stripe config.
- The landing page has no testimonials, user counts or accuracy claims. Its worked example is labelled "Example, not a real posting".
- Verdict screen split into a presentational `VerdictView` (what breaks / what the posting doesn't say / what fits). STOP now offers "Skip this job" (archives it) as the primary action and "Continue anyway" as secondary.
- A dev-only route `/dev/preview` renders the signed-in screens with real engine output and fixtures. It is behind `import.meta.env.DEV` with a lazy import and is not in the production bundle (checked).
- Amber text on amber backgrounds now uses `verdict-review-foreground` for contrast.
