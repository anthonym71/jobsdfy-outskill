# Build Plan — Phase B: UI Fixes, Events Platform, Company Pages, and More

This is a large set of requests. I recommend splitting into **Phase B1** (quick fixes and UI updates) and **Phase B2** (major new features: Events platform, Company pages).

---

## Phase B1 — Quick Fixes and UI Updates

### 1. Fix Referral Link Format (NB: Also the Affiliate link... ) 

The referral link  in Settings and Dashboard still generates `/auth?mode=signup&ref=xxx`. Update both to use the new `/r/:slug` format with the site domain.

- **Files**: `src/pages/Settings.tsx`, `src/pages/Dashboard.tsx`  
  


### 2. Profile > About Me — Add "Upload CV" Button at Top

Add a prominent button at the top of AboutMeTab that scrolls to the existing CVUploadParser section at the bottom.

- **File**: `src/components/profile/AboutMeTab.tsx`

### 3. Move Photo Gallery Out of About Me → Own Sidebar Nav Item

Remove `PhotoGallerySection` from `AboutMeTab`. Create a new `PhotoGalleryPage.tsx` and add it to the sidebar and router.

- **Files**: `src/components/profile/AboutMeTab.tsx`, new `src/pages/PhotoGalleryPage.tsx`, `src/components/layout/AppLayout.tsx`, `src/App.tsx`

### 4. Rename "Social Media" → "Social Media Posts" in Sidebar

- **File**: `src/components/layout/AppLayout.tsx`

### 5. Social Media Posts — Add "To Be Posted" Toggle + Due Date

Add a checkbox for "To be posted" with a tick icon, a date picker (due date with "Today" shortcut). Follow-up task should have Date + Action fields and create an entry in the `tasks` table with a link back to the post.

- **Files**: `src/components/profile/SocialPostsTab.tsx`
- **Migration**: Add `to_be_posted boolean default false`, `due_date date` columns to `social_posts`. Add `follow_up_date date`, `follow_up_action text`, `linked_post_id uuid` to `tasks` table (or add `source_type` and `source_id` columns).

### 6. Fix DRIVE Acronym in Assessments

Change from "Drive, Resourcefulness, Initiative, Vision, Execution" to "Director, Relator, Influencer, Validator, Executive".

- **File**: `src/components/profile/AssessmentsTab.tsx`

### 7. Autobiography — Rename to "Autobiography / Bio" + Credit Estimator

Update the heading. Show estimated credits based on word count before generating.

- **File**: `src/components/profile/AutobiographyTab.tsx`, `src/components/layout/AppLayout.tsx`

### 8. Verified Badges for Phone and Email

Show a verified shield icon (not a generic tick — use a distinct shield-check icon that can't be spoofed in the UI) next to phone and email when verified. Email verified status comes from `user.email_confirmed_at`. Phone from `phone_verified` in `user_profiles`.

- **File**: `src/pages/Settings.tsx` (phone already partially done), `src/components/profile/AboutMeTab.tsx` or wherever email is displayed

### 9. Fix "View Original Posting" Link in Jobs

The link opens in a new tab but doesn't load. Likely the URL is being double-wrapped or missing `https://`. Ensure `window.open` or `<a>` uses the raw URL with protocol.

- **File**: `src/pages/JobDetail.tsx`

### 10. Jobs > Quick Apply — Add "Generate Pack" Button

In the job detail or jobs list, add a button to generate the Quick Apply pack (CV + cover letter + recruiter message) in one click.

- **File**: `src/pages/JobDetail.tsx` or `src/pages/QuickApply.tsx`

### 11. Dashboard Split — Job Seeker vs Recruiter

Rename current dashboard to "Dashboard - Job Seeker". Add a recruiter dashboard view with recruiter-specific stats (posted jobs, candidates, etc.). Could be tabs or a role-based switch.

- **File**: `src/pages/Dashboard.tsx`

---

## Phase B2 — Major New Features (Next Build Cycle)

These are substantial features requiring new tables, edge functions, and significant UI work.

### 12. Events Platform

- New `events` table expansion (currently exists but minimal): add fields for location/area, free/paid, ticket price, event images, description, organizer
- New `event_tickets` table for paid events with Stripe integration + 5% platform fee
- New `event_registrations` table with marketing consent checkboxes (host + platform, email + SMS)
- Landing page tabs: add "Events" and "Jobs" tabs alongside the current landing content
- In-app Calendar/Events combined page with ability to create events, upload images, voice-to-text input
- Event search by area and name on public landing page
- Registration backend: attendee list with contact info for organizers

### 13. Company Pages

- New `companies` table: domain, name, logo, description, verified status, admin_user_id
- Verification flow: user must have email matching company domain, email verification sent
- Web scraping with consent: use Firecrawl to populate company info from URL
- Company admin can edit info after verification
- Public company profile page

### 14. Voice AI Agents

- Build voice agent configurations for each input type (profile fields, CV builder, interview practice, memory dump, etc.)
- Each agent needs tailored question sets for the specific input it's collecting

---

## Recommended Build Order for Phase B1

1. Fix referral link format (Settings + Dashboard)
2. Fix DRIVE acronym
3. Rename sidebar items (Social Media Posts, Autobiography/Bio)
4. Move Photo Gallery to own page
5. Add Upload CV button to top of About Me
6. Social Posts — to-be-posted toggle, due date, follow-up tasks (migration + UI)
7. Autobiography credit estimator
8. Verified badges (phone + email)
9. Fix job posting link
10. Add Generate Pack button
11. Dashboard split (Job Seeker / Recruiter)

Phase B2 items (Events, Companies, Voice Agents) will each need their own dedicated build cycle due to scope.  
  
Add a LOGOUT button top left - left of the email and credits   
