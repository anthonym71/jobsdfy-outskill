

# Comprehensive Profile, Recruiter Pricing & Feature Build

This is a large build covering recruiter pricing enforcement, a restructured Settings/Profile system, CV management with upload parsing, media storage, interview practice, and more.

## Prerequisites

**File Storage**: You selected external storage (S3/GHL), but no S3 connection exists yet. Before building upload features, we need to either:
- Connect an AWS S3 bucket (recommended for media/docs)
- Or use Lovable Cloud storage buckets as a fallback (no extra setup needed)

**Recruiter Stripe Products**: We need to create two new Stripe products for recruiter tiers ($9/mo for up to 10 jobs, $49/mo unlimited).

---

## What Gets Built

### 1. Recruiter Job Posting Pricing Enforcement
- Create two new Stripe products/prices: **Recruiter Standard** ($9/mo, up to 10 jobs) and **Recruiter Unlimited** ($49/mo, unlimited)
- Add `recruiter_job_count` tracking — count active posts per user
- Enforce limits in `PostJob.tsx`: 3 free posts allowed; at limit, show upgrade prompt with Stripe checkout
- Add recruiter subscription tier display on the Pricing page alongside seeker tiers
- Users subscribe and must cancel themselves via Stripe portal

### 2. Restructure Settings → App Settings Only
- Strip Profile and Non-Negotiables sections out of `Settings.tsx`
- Settings keeps: Privacy, Billing, Danger Zone (sign out)
- Add a "Profile" nav item in the sidebar pointing to `/app/profile`

### 3. New Profile Page (`/app/profile`) — Tabbed Layout
Six tabs:

**Tab 1: About Me**
- Photo upload, full name, headline, summary, location (dropdowns), contact info
- Social media accounts (LinkedIn, Twitter/X, GitHub, Instagram, TikTok, etc.) with follower counts
- Hobbies, interests, sports (tag inputs)

**Tab 2: Work History (CV)**
- "Upload CV" button — parses PDF/DOCX via AI edge function, extracts structured work entries
- Conflict resolution UI: if parsed data overlaps existing entries, show side-by-side comparison with checkboxes to keep/replace/merge
- Tick boxes for "concurrent role" (volunteering + working, day/night job)
- Structured entry form with dropdowns: Title, Employment Type, Company, Currently Working (tick), Start/End Month+Year, Location, Location Type, Description, Awards, Achievements, Performance
- "Add Next Job" button for manual entry
- Top 5 skills per role (dropdown + add), total skills capped at 100
- Media per job: upload up to 50 files (pictures, docs, PDFs, presentations)

**Tab 3: References & Testimonials**
- Per-job references: Name, Email, Phone, consent checkbox, or upload document/video testimonial
- Consent-to-share toggle per reference

**Tab 4: Education & Qualifications**
- Studies, qualifications (dropdowns), certificates upload, awards
- Languages (primary, secondary, others)

**Tab 5: Achievements & Tests**
- Display earned achievements from gamification
- IQ test, Personality test, DRIVE assessment links/results
- Test history and scores

**Tab 6: Interview Practice**
- Dropdown: "Practice for a specific job?" (lists their saved jobs)
- AI generates interview questions based on profile + selected job
- Text-based Q&A with AI scoring and feedback
- "What you could have said better" suggestions
- V2 placeholder for Voice AI bot

### 4. CV Builder & Letterhead Generator
- "Generate CV" button — AI compiles profile data into a formatted CV (PDF download)
- "Generate Cover Letter" — based on profile + selected job
- Letterhead template with user's contact info

### 5. Calendar & Events
- Calendar component on a new tab or page (`/app/calendar`)
- Display company-hosted events (stored in a new `events` table, admin-managed)
- Users can RSVP / mark interest

### 6. Courses
- "Courses" section links out to GHL Kollab (external URL)
- AI recommends courses/training based on profile gaps and target jobs
- Simple card UI with "View Course" button linking externally

### 7. Non-Negotiables
- Move from Settings into Profile page (or keep as a sub-section of About Me)

---

## Database Changes (Single Migration)

```text
New tables:
- work_history: user_id, title, company, employment_type, is_current, 
  start_month, start_year, end_month, end_year, location, location_type,
  description, awards, achievements, performance, skills (array, max 5),
  is_concurrent, sort_order
- work_history_media: work_history_id, user_id, file_url, file_type, 
  file_name, sort_order (limit 50 per work_history entry)
- references: work_history_id, user_id, name, email, phone, 
  consent_given, document_url, video_url, testimonial_text
- education: user_id, institution, degree, field, start_year, 
  end_year, description
- certificates: user_id, name, issuer, date_issued, file_url
- social_accounts: user_id, platform, url, followers, friends
- events: id, title, description, event_date, location, created_by (admin)
- event_rsvps: event_id, user_id, status
- recruiter_subscriptions: tracking table or just use Stripe check
- test_results: user_id, test_type, score, completed_at, details (jsonb)
- interview_sessions: user_id, job_id (nullable), questions (jsonb), 
  answers (jsonb), feedback (jsonb), created_at

Alter:
- user_profiles: add photo_url, hobbies, interests, sports (arrays),
  social_accounts moved to separate table

Storage:
- S3 bucket connection needed for file uploads
- Or create Supabase storage buckets: profile-photos, cv-uploads, 
  work-media, certificates, testimonial-videos
```

## New Edge Functions
- `parse-cv` — accepts uploaded PDF/DOCX, uses AI to extract structured work history
- `generate-cv` — compiles profile into formatted CV PDF
- `generate-cover-letter` — AI cover letter based on profile + job
- `interview-practice` — generates questions and scores answers
- `recommend-courses` — suggests training based on profile gaps

## File Changes Summary

```text
New files:
- src/pages/Profile.tsx (tabbed layout, main profile page)
- src/components/profile/AboutMeTab.tsx
- src/components/profile/WorkHistoryTab.tsx
- src/components/profile/ReferencesTab.tsx
- src/components/profile/EducationTab.tsx
- src/components/profile/AchievementsTab.tsx
- src/components/profile/InterviewPracticeTab.tsx
- src/components/profile/CVUploadParser.tsx
- src/components/profile/ConflictResolver.tsx
- src/components/profile/MediaUploader.tsx
- src/pages/Calendar.tsx
- supabase/functions/parse-cv/index.ts
- supabase/functions/generate-cv/index.ts
- supabase/functions/generate-cover-letter/index.ts
- supabase/functions/interview-practice/index.ts

Modified files:
- src/App.tsx — add /app/profile, /app/calendar routes
- src/components/layout/AppLayout.tsx — add Profile + Calendar nav items
- src/pages/Settings.tsx — strip to app settings only
- src/pages/PostJob.tsx — add recruiter tier limit enforcement
- src/pages/Pricing.tsx — add recruiter pricing section
- src/hooks/useSubscription.ts — add recruiter tier constants
```

## Build Order
1. Database migration (all new tables)
2. Connect S3 or create storage buckets
3. Create Stripe recruiter products
4. Recruiter pricing enforcement in PostJob + Pricing pages
5. Strip Settings to app-only
6. Build Profile page with all tabs
7. CV upload + parse edge function
8. CV builder + cover letter edge functions
9. Interview practice
10. Calendar + events
11. Courses link section

This is approximately 8-10 build prompts to complete given the scope.

