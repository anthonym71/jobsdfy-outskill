

# Implement JobsDFY Prompt Stack: ATS Intelligence, STAR Rewriting, CV Tailoring & Gap Analysis

The uploaded document contains a production-ready AI prompt stack with 8 layered prompts that need to be wired into the existing edge functions and new ones. This is the "skill stack" that makes JobsDFY's AI actually good at CV/career work.

---

## What This Changes

The prompt stack replaces generic AI prompts with recruiter-grade, ATS-optimized instructions across the entire pipeline. Currently the edge functions use simple one-paragraph system prompts. This upgrade gives them structured, expert-level instructions.

---

## Implementation

### 1. Upgrade `generate-application` Edge Function

Replace the current generic system prompt with the **Core System Prompt** from the document. This is the master instruction that governs all CV output quality.

Key changes:
- System prompt becomes the full "elite executive CV, ATS, and career positioning engine" instruction (~500 words covering truth rules, ATS formatting, keyword optimization, action verbs, STAR logic)
- Before generating the resume, run the **ATS Keyword Extraction** step as a first AI call against the job description — extract top 15 keywords, required vs preferred skills, success signals, rejection reasons
- Use extracted keywords to inform the resume tailoring call
- Apply the **STAR Rewrite** logic to experience bullets in the prompt
- Change the tool schema to return structured JSON matching the recommended output schema: `cv_version_name`, `professional_summary`, `core_skills[]`, `experience[{title, company, date_range, bullets[]}]`, plus the existing `coverNote` and `recruiterNote`
- Also fetch `work_history` rows for the user to include real structured experience data (not just profile summary)

### 2. Create `generate-cv` Edge Function (New)

Dedicated CV generation that produces a full tailored CV (not just a Quick Apply pack).

- Accepts `{ jobId?: string, versionName?: string }`
- Fetches: user profile, work history, education, certificates, skills
- If `jobId` provided: fetches job description, runs ATS keyword extraction first
- Applies the **Tailored CV Generation Prompt** (prompt 4 from the doc) with all structured data
- Tool schema returns the full recommended output schema from the document
- Stores result in a new `cv_versions` row (or `application_assets` with type `tailored_cv`)
- Supports multiple versions from same profile (SaaS Sales vs Executive vs HR Leadership)

### 3. Create `generate-cover-letter` Edge Function (New)

- Accepts `{ jobId: string }`
- Fetches job + profile + work history
- System prompt enforces: personalized intro, experience-to-requirements mapping, 300-400 words max, professional/confident/human tone
- Returns structured `{ coverLetter, keyAlignments[], toneNotes }`

### 4. Create `analyze-gap` Edge Function (New)

Implements the **Gap Analysis Prompt** (prompt 8):
- Accepts `{ jobId: string }`
- Compares candidate profile + tailored CV against job description
- Returns: `{ strongestFitAreas[], recruiterConcerns[], missingKeywords[], missingEvidence[], improvementSuggestions[], verdict: "apply"|"improve_then_apply"|"skip" }`
- Direct but not cruel, distinguishes dealbreakers from fixable weaknesses

### 5. Create `interview-practice` Edge Function (New)

- Accepts `{ jobId?: string }`
- Fetches profile + job (if provided)
- Generates 5-8 interview questions based on role, experience gaps, and common recruiter concerns
- Accepts follow-up calls with `{ sessionId, questionIndex, answer }` to score answers
- Returns feedback using STAR logic: what was good, what could be stronger, suggested better answer
- Stores sessions in `interview_sessions` table

### 6. Upgrade `extract-job` Edge Function

Enhance the extraction to also capture the fields from the ATS Keyword Extraction prompt:
- Add to tool schema: `seniorityLevel`, `requiredSkills[]`, `preferredSkills[]`, `coreResponsibilities[]`, `systemsTools[]`, `successSignals[]`, `rejectionReasons[]`
- These fields power downstream CV tailoring and gap analysis

### 7. Save Prompt Stack to Memory

Store the core system prompt and key rules as a memory file so all future edge function work stays consistent with these instructions.

---

## Database Changes

One small migration:
- Add `cv_versions` table: `id, user_id, job_id (nullable), version_name, content (jsonb), ats_keywords (jsonb), created_at`
- Or reuse `application_assets` with new `asset_type` values (`tailored_cv`, `gap_analysis`, `ats_keywords`)

---

## Files Summary

```text
Modified:
- supabase/functions/generate-application/index.ts — upgraded prompts + ATS keywords + work history data
- supabase/functions/extract-job/index.ts — enhanced extraction schema

New:
- supabase/functions/generate-cv/index.ts
- supabase/functions/generate-cover-letter/index.ts  
- supabase/functions/analyze-gap/index.ts
- supabase/functions/interview-practice/index.ts
- mem://features/prompt-stack — core AI rules and prompt patterns

UI wiring (existing tabs):
- src/components/profile/InterviewPracticeTab.tsx — connect to real edge function
- src/pages/QuickApply.tsx or JobDetail — add "Generate Tailored CV" and "Gap Analysis" buttons
```

---

## Build Order

1. Save prompt stack rules to memory
2. Database migration (cv_versions table or asset_type expansion)
3. Upgrade `extract-job` with enhanced schema
4. Upgrade `generate-application` with ATS-aware prompts + work history
5. Create `generate-cv` edge function
6. Create `generate-cover-letter` edge function
7. Create `analyze-gap` edge function
8. Create `interview-practice` edge function
9. Wire UI buttons for CV generation, gap analysis, and interview practice

This is approximately 3-4 build prompts to complete.

