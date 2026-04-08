

# Build Plan — Phase A: Profile Restructure, Affiliate, Settings, Pricing

## Overview

Move 8 tabs out of Profile into their own sidebar navigation items with dedicated routes. Add Movies (new), update affiliate/referral links, rework Settings danger zone, and update Stripe pricing.

---

## 1. Move Profile Sub-tabs to Main Sidebar Nav Items

Currently these are sub-tabs inside `/app/profile`. Each becomes its own page/route in the left sidebar:

| New Sidebar Item | Route | Icon | Component |
|---|---|---|---|
| Books | `/app/books` | Bookmark | BooksTab.tsx (existing) |
| Movies | `/app/movies` | Film | MoviesTab.tsx (NEW) |
| Memory Dump | `/app/memory-dump` | Lightbulb | MemoryDumpTab.tsx (existing) |
| Social Media | `/app/social-media` | Share2 | SocialPostsTab.tsx (existing) |
| Assessments | `/app/assessments` | Brain | AssessmentsTab.tsx (existing) |
| Autobiography | `/app/autobiography` | Crown | AutobiographyTab.tsx (existing) |
| Interview Practice | `/app/interview` | MessageSquare | InterviewPracticeTab.tsx (existing) |
| Recommended Training | `/app/training` | GraduationCap | RecommendedTrainingTab.tsx (NEW) |

**Profile page** keeps: About Me (+ Upload CV), Work History, Education, Timeline, CV Versions, Courses, References, Achievements, Knowledgebase.

**Files changed:**
- `AppLayout.tsx` — add 8 new nav items to `baseNavItems`
- `App.tsx` — add 8 new routes wrapping existing tab components in page wrappers
- `Profile.tsx` — remove moved tabs
- Create 8 small page wrapper files (e.g. `src/pages/BooksPage.tsx`) that import the existing tab component and wrap it with heading/padding

---

## 2. New DB Tables & Columns

**Migration:**
- `movies` table (id, user_id, title, genre, rating 1-10, comments, takeaway, watched_at, created_at, updated_at) with RLS
- `recommended_training` table (id, user_id, title, provider, category, reason, recommended_by, url, created_at) with RLS
- Add `slug text UNIQUE` to `affiliate_partners` and `referral_codes`

**New components:**
- `MoviesTab.tsx` — CRUD: title, genre, star rating (1-10), comments, "what I got from it", date watched
- `RecommendedTrainingTab.tsx` — AI-recommended courses with reason/why displayed

---

## 3. Affiliate & Referral Link Improvements

- Add routes `/r/:slug` and `/a/:slug` in App.tsx — redirect to Landing page, store slug in localStorage
- Landing page reads slug from localStorage, passes to signup link as query param
- Auth page picks up `ref`/`aff` param and credits the referrer on signup
- Settings: slug chooser with warning about losing previous referral attribution
- Highlight current commission tier in affiliate dashboard
- Create `AffiliateTerms.tsx` — generated FAQ, T&Cs, contract; user must agree when signing up as affiliate
- Footer: "Become an Affiliate" link on every page

---

## 4. Settings — Danger Zone Rework

- Move "Sign Out" out of Danger Zone (already in sidebar, just remove from danger zone)
- Add "Delete Account" button with multi-step confirmation dialog
- Warn to cancel subscription first before deleting
- Pricing page: add "Cancel Subscription" section with messaging about remaining access/credits

---

## 5. Stripe Pricing Updates

**Create 5 new Stripe prices** (via Stripe tools):
1. Premium $49.99/mo (replacing $19/mo)
2. 50-credit pack $19.99 (replacing $14.99)
3. 100-credit pack $24.99
4. 200-credit pack $59.99
5. 500-credit pack $149.00

**Update:** `useSubscription.ts`, `Pricing.tsx`, `Landing.tsx` with new price IDs.

---

## 6. AutobiographyTab Enhancements

- Credit cost estimator next to Generate button (based on word count)
- Save generated versions to `generated_artifacts` table
- Download as Word (.docx) or PDF
- In-app text editor for editing before download

---

## 7. InterviewPracticeTab Enhancements

- Show credit cost per minute for Voice AI
- Add voice-to-text microphone input for written answers (using existing VoiceFieldInput)
- Save practice sessions (transcript, not audio) to `interview_sessions` table
- Label written answers as FREE

---

## 8. Upload CV in About Me

- Add `CVUploadParser` component inside AboutMeTab below the existing form fields

---

## Build Order

1. DB migration (movies, recommended_training, slug columns)
2. Create Stripe prices (5 prices via tool)
3. Create `MoviesTab.tsx` and `RecommendedTrainingTab.tsx`
4. Create 8 page wrappers for promoted tabs
5. Update `App.tsx` with new routes + `/r/:slug` `/a/:slug` redirects
6. Update `AppLayout.tsx` sidebar with new nav items
7. Update `Profile.tsx` — remove promoted tabs, add CV upload to About Me
8. Update `useSubscription.ts` with new price IDs
9. Update `Pricing.tsx` — new prices + cancel subscription flow
10. Update `Landing.tsx` — pricing updates
11. Update `Settings.tsx` — slug chooser, danger zone rework, delete account
12. Create `AffiliateTerms.tsx` + route
13. Update `Footer.tsx` — affiliate link
14. Update `AutobiographyTab.tsx` — credit estimator, versions, download
15. Update `InterviewPracticeTab.tsx` — credit display, voice input, save sessions

---

## What You Need To Do

| Action | Where |
|--------|-------|
| Approve this plan | Here — then I build it |
| Stripe prices will be created via tool | I'll handle this during build |

