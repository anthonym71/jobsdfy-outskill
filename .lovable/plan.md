

# JobsDFY: What's Done vs What's Left — Step-by-Step to Commercial Launch

## COMPLETED (Working Now)

| # | Feature | Status |
|---|---------|--------|
| 1 | Landing page with steps, features, pricing, FAQs, mascot | Done |
| 2 | Auth (signup/login with email verification) | Done |
| 3 | Onboarding (5-step wizard with phone verification) | Done |
| 4 | Job extraction from URL or text (AI-powered) | Done |
| 5 | Dealbreaker detection (salary, visa, location, language) | Done |
| 6 | Fit scoring (1-10 with strengths/gaps/recommendation) | Done |
| 7 | Quick Apply pack (ATS resume, cover note, recruiter msg) | Done |
| 8 | Tailored CV generation (per-job, ATS-optimized) | Done |
| 9 | Cover letter generation (300-400 words, personalized) | Done |
| 10 | Gap analysis (missing keywords, recruiter concerns, verdict) | Done |
| 11 | Interview practice (AI Q&A with STAR scoring) | Done |
| 12 | Voice AI interview bot (ElevenLabs integration UI) | Done (needs API key) |
| 13 | Job pipeline tracking (verdict + status) | Done |
| 14 | Chrome/Edge/Brave extension (download + install page) | Done |
| 15 | Profile: About Me with AI summary/keywords/photo upload | Done |
| 16 | Profile: Work History with STAR enhance + CV upload/parse | Done |
| 17 | Profile: Education with certificates + media upload | Done |
| 18 | Profile: References with testimonials | Done |
| 19 | Profile: Achievements + assessment placeholders | Done |
| 20 | Profile: CV Versions library | Done |
| 21 | Profile: Career Timeline generation | Done |
| 22 | Recruiter job posting with AI JD generator | Done |
| 23 | Recruiter pricing enforcement (3 free / $9 / $49) | Done |
| 24 | Seeker subscriptions (Free / Pro $19 / Premium $49) | Done |
| 25 | Credit packs ($5/10 credits, $15/50 credits) | Done |
| 26 | XP, levels, achievements, credit expiry | Done |
| 27 | Calendar with events + RSVP + courses link | Done |
| 28 | Support ticket system | Done |
| 29 | Admin helpdesk + user management | Done |
| 30 | Settings with extension link + billing | Done |
| 31 | 25 edge functions deployed | Done |

---

## REMAINING — Step-by-Step to Launch

### Step 1: Fix Landing Page Pricing Mismatch
The landing page shows "Starter Free / Pro $19 / Team $49" but actual Stripe tiers are "Free / Pro $9 / Premium $19" for seekers. Update landing page pricing cards to match real Stripe prices.

### Step 2: Sidebar Branding Fix
Sidebar says "AI Job OS" — should say "JobsDFY" to match the product name.

### Step 3: Extension Icon Missing
`extension/icon.png` needs to actually exist as a proper icon file. Currently may be a placeholder. Generate a simple icon.

### Step 4: Generated Artifacts Table
Create `generated_artifacts` table for unified tracking of all AI-generated content with credit cost logging. Migration needed.

### Step 5: Credit Deduction on Premium Features
Currently AI features (CV generation, gap analysis, timeline, cover letter) do not deduct credits. Wire `spendCredits()` calls into JobDetail and QuickApply before calling edge functions.

### Step 6: Recruiter Candidate View Page
No page exists for recruiters to view candidate profiles. Build a `/app/recruiter/candidates` page that lists candidates who applied to their posted jobs, showing structured profiles and AI-generated match summaries.

### Step 7: ElevenLabs API Key
Voice AI bot UI is built but needs the `ELEVENLABS_API_KEY` secret added. You need to provide this key.

### Step 8: Landing Page — Extension Download Section
Add a prominent "Download Extension" CTA on the landing page linking to `/app/extension` (or direct ZIP download for non-logged-in users).

### Step 9: Admin-Only Nav Guard
Admin and Users nav items show for all users. Add role check so only admins see those links.

### Step 10: Publish to Domain
App is NOT published yet. Needs publishing + custom domain connection.

---

## Build Order (Implementation Sequence)

```text
1. Fix landing page pricing to match Stripe ($9 Pro / $19 Premium)
2. Rename sidebar "AI Job OS" → "JobsDFY"  
3. Create generated_artifacts migration
4. Wire credit deduction into AI features
5. Build recruiter candidate view page
6. Add admin role guard to sidebar nav
7. Add extension CTA to landing page
8. Publish app
9. Connect custom domain
10. Add ELEVENLABS_API_KEY (you provide)
```

### Files Modified
- `src/pages/Landing.tsx` — fix pricing, add extension CTA
- `src/components/layout/AppLayout.tsx` — rename branding, admin guard
- `src/pages/JobDetail.tsx` — add credit deduction before AI calls
- `src/pages/QuickApply.tsx` — add credit deduction
- New: `src/pages/RecruiterCandidates.tsx` — candidate dashboard
- New: migration for `generated_artifacts` table
- `src/App.tsx` — add recruiter route

### Estimated: 2-3 build prompts to complete everything.

