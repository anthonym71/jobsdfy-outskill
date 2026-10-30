# JobsDFY Outskill

Build a polished, modern full-stack web app called “AI Job OS”.



Product purpose:

AI Job OS helps job seekers avoid wasting time on bad-fit roles, then helps them move fast on viable opportunities. The core promise is: “Never waste time on the wrong job again.” Users can paste a job URL, paste job text, upload a screenshot, or upload a voice note. The app extracts the job, checks for hard dealbreakers first, then shows a fit score and offers a quick-tailored application pack.



Primary workflow:

1. User signs in.

2. User completes onboarding with profile and non-negotiables.

3. User submits a job.

4. App extracts the job into editable structured fields.

5. App runs a Dealbreaker Check and shows a clear verdict:

   - GO

   - REVIEW

   - STOP

6. If the user proceeds, app shows a fit score, strengths, gaps, and recommendation.

7. User can generate a Quick Apply pack:

   - tailored resume draft

   - short cover note

   - recruiter note

8. App stores everything for reuse.



Important product principle:

Do not let the user get excited about a job before showing hard blockers. The app should feel protective first, productive second.



Tech stack:

- Frontend: React + TypeScript

- UI: Tailwind CSS + shadcn/ui

- Backend/Auth/DB/Storage: Supabase

- Routing: app-style routing with clear layouts

- State: simple, clean client state with server-backed Supabase data

- Forms: robust validation and clear inline editing

- Charts/visuals only if lightweight and useful



Design direction:

- Premium, minimal, fast, calm, recruiter-grade

- Clean card-based interface

- Lots of whitespace

- Strong hierarchy

- Modern SaaS feel

- Color system:

  - neutral base

  - green for GO

  - amber for REVIEW

  - red for STOP

- Use subtle gradients, soft shadows, rounded corners

- The visual emphasis should be on decision clarity, not decoration



Brand tone:

- sharp

- supportive

- confident

- time-protective

- practical, not hypey



Headline copy on landing page:

“Never waste time on the wrong job again.”



Subheadline:

“Paste a job link, screenshot, or voice note. AI flags hard mismatches like salary, visa, location, language, and mandatory skills before you invest time — then helps you apply fast when the role is worth it.”



Core pages to build:



1. Landing Page

- Hero section with headline, subheadline, CTA

- How it works in 3 steps:

  1) Share a job

  2) See dealbreakers instantly

  3) Apply fast if it’s worth it

- Pricing teaser cards:

  - Quick Apply

  - Deep Dive

  - Concierge

- Social proof placeholders

- FAQ section

- Footer



2. Auth

- Sign up / sign in

- Email auth

- Optional Google auth if easy

- Clean auth card layout



3. Onboarding

Collect:

- full name

- location

- salary minimum

- salary target

- salary currency

- remote preference

- work authorization

- whether sponsorship is required

- languages spoken

- relocation preference

- years of experience

- top skills

- industries

- headline

- summary



Also collect explicit non-negotiables:

- minimum acceptable salary

- countries or regions allowed

- remote / hybrid / onsite preference

- requires visa sponsorship

- languages spoken

- employment type preferences

- max travel tolerance

- industry exclusions if any



Onboarding should feel fast and intelligent, with grouped sections and progress indication.



4. Dashboard

Sections:

- top CTA: “Check a Job”

- recent jobs

- counts by verdict:

  - GO

  - REVIEW

  - STOP

- counts by status:

  - New

  - Saved

  - Applied

  - Archived

- quick stats:

  - jobs checked

  - hard stops avoided

  - quick apply packs generated

- empty state if no jobs yet



5. New Job Intake

Allow these inputs:

- paste job URL

- paste job description text

- upload screenshot

- upload voice note



Build input tabs or cards for each source type.



After submit, show an extraction preview with editable fields:

- title

- company

- location

- salary min/max/currency

- work model

- employment type

- visa policy

- language requirements

- recruiter name

- description

- requirements summary

- application URL



Show extraction confidence where useful.

Include a “Continue to Dealbreaker Check” button.



6. Dealbreaker Check Screen

This is the most important screen.



Show a strong verdict banner at the top:

- GO

- REVIEW

- STOP



Then show:

- “Why this role may or may not be worth your time”

- blocker cards by category:

  - salary

  - visa/work authorization

  - location

  - remote/onsite mismatch

  - language

  - required certification

  - mandatory skill

  - years of experience

  - travel

- Distinguish:

  - confirmed mismatch

  - unclear / inferred / missing info



Include a compact summary panel:

- salary alignment

- location alignment

- work authorization alignment

- language alignment



Actions:

- Skip

- Save

- Investigate Missing Info

- Continue Anyway



Important UX behavior:

- If verdict is STOP, use red styling and clear language like “We found a likely dealbreaker before you waste time.”

- If verdict is REVIEW, use amber styling and emphasize uncertainty.

- If verdict is GO, use green styling and invite next-step analysis.



7. Fast Decision Screen

Only accessible after Dealbreaker Check.



Show:

- fit score from 1 to 10

- fit confidence

- top 3 strengths

- top 3 gaps

- recommendation

- salary/location summary

- clear next action suggestions



Buttons:

- Skip

- Save

- Quick Apply

- Deep Dive



Deep Dive can be present but marked “Coming Soon” in MVP if needed.



8. Quick Apply Screen

Show a 2-column layout:

Left:

- job highlights

- must-have requirements

- emphasis points

Right:

- editable tailored resume draft

- editable cover note

- editable recruiter note



Include:

- regenerate section buttons

- copy button

- save button

- approve button



Important:

Nothing is auto-sent. Show a small approval notice:

“Nothing goes out without your approval.”



9. Jobs / Pipeline Screen

Table or card view with filters:

- verdict: GO / REVIEW / STOP

- status: New / Blocked / Reviewing / Saved / Applied / Archived

- source type

- company

- date created



Each row/card should show:

- title

- company

- verdict badge

- fit score if available

- status

- created date



Allow click-through to detail view.



10. Job Detail Screen

Tabs:

- Overview

- Dealbreakers

- Fit

- Application Pack

- Activity



Show:

- extracted job

- blocker list

- fit analysis

- saved assets

- status timeline



11. Settings

Sections:

- profile

- non-negotiables

- privacy

- billing placeholder

- delete account placeholder



Core reusable components:

- VerdictBadge

- BlockerList

- BlockerCard

- AlignmentSummary

- FitScoreCard

- StrengthGapCard

- RecommendationPanel

- JobSourceInputTabs

- ExtractionPreviewForm

- ApplicationAssetEditor

- EmptyState

- StatusPill

- ConfidenceBadge



Data model expectations:

Use Supabase tables for:

- user_profiles

- candidate_profiles

- experience_items

- education_items

- proof_points

- profile_memories

- user_non_negotiables

- jobs

- job_source_artifacts

- job_blockers

- job_matches

- application_packets

- application_assets

- job_status_events



App behaviors:

- Every row should belong to the signed-in user

- Use Supabase auth session

- Use Row Level Security assumptions

- Use proper loading states and error states

- Make every form editable

- Optimistically update where safe

- Use modals or sheets for inline editing where elegant



MVP functional behavior:

- Build real CRUD flows against Supabase

- For AI/extraction/scoring/generation behaviors, create placeholder async actions and clean service abstractions so these can later be connected to actual AI functions

- Seed the UI with structured mock fallback states only where necessary for demo quality, but prefer real DB-backed flows



Important logic rules:

- Dealbreaker Check happens before Fit Score

- Fit Score happens before Quick Apply

- Nothing auto-sends

- User can override REVIEW or STOP and continue anyway

- Save all major decisions and outputs



Suggested status model:

- new

- blocked

- reviewing

- saved

- applied

- archived



Suggested verdict model:

- go

- review

- stop



Suggested app navigation:

- Dashboard

- Check a Job

- Jobs

- Settings



Create a premium, production-style UI, not a hackathon prototype.

Use realistic empty states, polished copy, responsive layouts, and reusable components.

Prioritize clarity, speed, and trust.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9691adfb-91cb-4475-9c2b-80d43ca37d5e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
