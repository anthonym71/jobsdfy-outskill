

# JobsDFY: Complete V1+V2 Build — Gap Analysis & Execution Plan

## What the Document Defines

The uploaded "Prompt Orchestration Matrix" defines **30+ prompt-driven features** across 10 domains. Here's what's built vs missing.

---

## STATUS: Built vs Missing

### BUILT (Working)
| Feature | Edge Function | UI |
|---------|--------------|-----|
| Job extraction | `extract-job` | NewJob page |
| Dealbreaker analysis | `analyze-dealbreakers` | DealbreakersCheck page |
| Fit scoring | `analyze-fit` | FastDecision page |
| Quick Apply pack | `generate-application` (ATS-upgraded) | QuickApply page |
| Tailored CV generation | `generate-cv` | JobDetail button |
| Cover letter generation | `generate-cover-letter` | JobDetail button |
| Gap analysis | `analyze-gap` | JobDetail button |
| Interview practice (Q&A + scoring) | `interview-practice` | InterviewPracticeTab |
| Recruiter job posting + AI JD | `generate-job-description` | PostJob page |
| Profile tabs (About, Work History, Education, References, Achievements) | N/A | Profile page |
| Recruiter pricing (3 free / $9 / $49) | Stripe products | PostJob + Pricing |
| Seeker subscriptions (Free / Pro / Premium) | Stripe products | Pricing page |
| Credits + XP + achievements | DB tables | CreditWidgets |
| Auth, onboarding, settings, support, admin | Various | Various pages |
| Chrome extension | N/A | extension/ folder |

### NOT BUILT — Required for V1+V2

| # | Feature | Edge Function Needed | UI Needed | Priority |
|---|---------|---------------------|-----------|----------|
| 1 | **CV Upload + AI Parse** | `parse-cv` (NEW) | Upload button in WorkHistoryTab + import review screen | CRITICAL |
| 2 | **CV Conflict Detection** | `detect-cv-conflicts` (NEW) | Side-by-side merge UI with keep/replace/merge checkboxes | CRITICAL |
| 3 | **Profile Normalizer** | `normalize-profile` (NEW) | Onboarding review card — clean up raw text input | HIGH |
| 4 | **Profile Summary Writer** | `generate-profile-summary` (NEW) | "Improve Summary" button on AboutMeTab | HIGH |
| 5 | **Suggest Profile Keywords** | `suggest-profile-keywords` (NEW) | Keyword chip list on AboutMeTab | MEDIUM |
| 6 | **STAR Bullet Enhancer** | `enhance-star-bullets` (NEW) | "Improve Entry" per work history item + before/after view | HIGH |
| 7 | **Work Media Summarizer** | `summarize-work-media` (NEW) | Upload area + suggestion drawer per work entry | MEDIUM |
| 8 | **Education Normalizer** | `normalize-education` (NEW) | Auto-clean on save in EducationTab | LOW |
| 9 | **Achievement Normalizer** | `normalize-achievement` (NEW) | Achievement form + CV-ready bullet preview | MEDIUM |
| 10 | **Reference Parser** | `parse-reference` (NEW) | Testimonial card with parsed highlights | MEDIUM |
| 11 | **ATS Keyword Extraction** | `extract-ats-keywords` (NEW or merge into extract-job) | Hidden preprocessing or keyword panel on JobDetail | HIGH |
| 12 | **CV Version Manager** | `position-cv-version` (NEW) | CV Versions library on Profile | HIGH |
| 13 | **Career Timeline Generator** | `generate-timeline` (NEW) | Timeline visual + export on Application Pack | MEDIUM |
| 14 | **Application Pack Orchestrator** | Wrapper combining ATS + CV + cover + recruiter msg + timeline | Pack summary screen replacing current QuickApply | HIGH |
| 15 | **Recruiter Message Generator** | Already in `generate-application` but needs standalone | Short message editor on JobDetail | MEDIUM |
| 16 | **STAR Answer Converter** | `convert-answer-star` (NEW or add to interview-practice) | Answer compare view in InterviewPracticeTab | MEDIUM |
| 17 | **Recruiter Candidate View** | `candidate-shortlist-summary` + `candidate-comparison-writer` (NEW) | Recruiter dashboard showing candidate profiles + match indicators | HIGH |
| 18 | **Voice AI Interview Bot** | ElevenLabs integration (agent + TTS + STT) | Voice conversation UI in InterviewPracticeTab | V2 |
| 19 | **Photo Upload** | None (storage only) | Upload component in AboutMeTab | HIGH |
| 20 | **Media Upload per Work Entry** | None (storage only) | Upload component in WorkHistoryTab | MEDIUM |
| 21 | **Certificate Upload** | None (storage only) | Upload in EducationTab | MEDIUM |
| 22 | **Support Ticket Summarizer** | `summarize-support-ticket` (NEW) | Admin helpdesk enhancement | LOW |
| 23 | **Generated Artifacts Table** | DB migration | N/A | MEDIUM |

---

## Execution Plan (Build Order)

### Block 1: Core Profile Intelligence (parse-cv, conflict detection, profile enhancement)
1. Create `parse-cv` edge function — accepts PDF/DOCX text, uses AI to extract structured work history, education, certs, skills
2. Create `detect-cv-conflicts` edge function — compares parsed data vs existing entries, returns merge suggestions
3. Build CV Upload + Import Review UI in WorkHistoryTab — file upload, parse, show side-by-side conflicts with checkboxes
4. Create `generate-profile-summary` edge function — "Improve Summary" button on AboutMeTab
5. Create `suggest-profile-keywords` edge function — keyword chip suggestions
6. Build photo upload component for AboutMeTab (uses existing `profile-photos` bucket)
7. Build media upload component for WorkHistoryTab (uses existing `work-media` bucket)
8. Build certificate upload in EducationTab (uses existing `certificates` bucket)

### Block 2: STAR Enhancement + CV Versions
1. Create `enhance-star-bullets` edge function — rewrites experience bullets using STAR methodology
2. Add "Improve Entry" button per work history entry with before/after comparison
3. Create `position-cv-version` edge function — creates role-positioned CV versions (SaaS vs Executive vs HR)
4. Build CV Versions library UI on Profile page (new tab or section)
5. Create `normalize-achievement` edge function
6. Create `parse-reference` edge function with highlight extraction

### Block 3: Application Pack Orchestration + Timeline
1. Create `extract-ats-keywords` as standalone edge function (or verify it's already embedded in extract-job)
2. Create `generate-timeline` edge function — career timeline with growth patterns
3. Build Application Pack orchestrator — single "Generate Full Pack" button that chains: ATS keywords → tailored CV → cover letter → recruiter message → optional timeline
4. Upgrade QuickApply page to show full pack with toggles for each component
5. Create standalone recruiter message generator (separate from full application pack)

### Block 4: Recruiter Side + Interview Enhancements
1. Create `candidate-shortlist-summary` edge function — generates candidate summaries for recruiters
2. Build recruiter candidate view page — list candidates, see structured profiles, match indicators
3. Add "Convert to STAR" button in InterviewPracticeTab for answer formatting
4. Create `normalize-education` edge function

### Block 5: Voice AI Interview Bot (V2)
1. Set up ElevenLabs connector (API key)
2. Create `elevenlabs-conversation-token` edge function
3. Build Voice AI interview component using `@elevenlabs/react` `useConversation` hook
4. Integrate into InterviewPracticeTab as a "Voice Practice" mode toggle
5. Wire agent to use interview questions from profile + selected job

### Block 6: Database + Polish
1. Create `generated_artifacts` table for unified artifact storage with credit tracking
2. Wire credit deduction logic into premium features (timeline = 5 credits, extra CV versions, deep interview analysis)
3. Admin support ticket summarizer
4. End-to-end testing of all flows
5. Publish to domain

---

## Database Migration Needed

```text
New table: generated_artifacts
  id, user_id, job_id (nullable), artifact_type (enum: cv, cover_letter, 
  recruiter_message, timeline, fit_analysis, interview_feedback, ats_keywords),
  version_label, input_hash, output_json (jsonb), credit_cost, created_at
```

## New Edge Functions Summary (13 new)

`parse-cv`, `detect-cv-conflicts`, `generate-profile-summary`, `suggest-profile-keywords`, `enhance-star-bullets`, `normalize-achievement`, `parse-reference`, `extract-ats-keywords`, `position-cv-version`, `generate-timeline`, `candidate-shortlist-summary`, `convert-answer-star`, `elevenlabs-conversation-token`

## New/Modified UI Files

- `src/components/profile/CVUploadParser.tsx` — upload + import review
- `src/components/profile/ConflictResolver.tsx` — side-by-side merge
- `src/components/profile/MediaUploader.tsx` — reusable file upload
- `src/components/profile/CVVersionsTab.tsx` — version library
- `src/components/profile/VoiceInterviewBot.tsx` — ElevenLabs voice agent
- Modified: `AboutMeTab.tsx`, `WorkHistoryTab.tsx`, `EducationTab.tsx`, `AchievementsTab.tsx`, `ReferencesTab.tsx`, `InterviewPracticeTab.tsx`, `QuickApply.tsx`, `JobDetail.tsx`, `Profile.tsx`

---

## Estimated Build: 6 blocks, approximately 6-8 implementation prompts

I'll start with Block 1 (parse-cv + conflict detection + profile enhancement + file uploads) immediately upon approval and continue through all blocks sequentially.

