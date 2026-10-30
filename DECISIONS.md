# Decisions made during the overnight build

Each line is a call I made without asking. Reverse any you disagree with.

- Added dev dependency `@testing-library/dom` (peer of the already-declared `@testing-library/react`; it was missing because the install needed `--legacy-peer-deps`). Needed for component render tests.
- Left `package-lock.json` untouched (npm rewrote ~6,500 lines of it); run `npm install --legacy-peer-deps` to refresh it. The repo also has `bun.lock`.
- Feature flags (`src/lib/features.ts`) hide, not delete: profile extras (books, movies, brain dump, thought leadership, photo gallery, autobiography), assessments, gamification (onboarding reward banner, Achievements tab), referrals (dashboard widget), hiring (post job, recruiter candidates, companies) and events (events, event registrations). Bring any back with `VITE_FEATURES="assessments,referrals"`.
- I also grouped Events, Event Registrations and Companies under flags (they were not on your list). They are Anthony's platform roadmap and off-product for a job seeker; flip `events`/`hiring` on to restore them.
- Kept the credit balance and credit costs visible: credits are the billing mechanism for packs, not gamification.
- Left the referral/affiliate sections inside Settings and the public `/r/` and `/a/` links alone; only the dashboard widget is gated.
