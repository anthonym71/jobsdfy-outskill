# JobsDFY: check the posting first

Paste one job posting. JobsDFY compares it with your hard limits and says **GO**, **REVIEW** or **STOP**. It names the limit that broke and quotes the line from the posting that broke it. If the posting is silent or vague on a limit, it says so and answers REVIEW. It never guesses.

Built first for Indian job seekers, where notice period, CTC in lakh per annum (LPA) and work-from-office days decide most applications. It works for any market.

> Status: a hackathon-stage product built with [Lovable](https://lovable.dev) and extended on the `priorities-round2` branch. See `MORNING_REPORT.md` for what is verified and what is not, and `docs/DEPLOY_CHECKLIST.md` before deploying.

## How the verdict works

```
posting text ─▶ AI reads facts + verbatim quotes ─▶ quotes verified against the text ─▶ plain-code rules ─▶ GO / REVIEW / STOP
   (extract-job)        (extraction-schema.ts)            (verifyQuotes)                  (verdict.ts)
```

- The AI **only extracts facts**. It never decides the verdict.
- Every fact carries a quote. A quote that is not in the posting is dropped.
- `supabase/functions/_shared/verdict.ts` decides: any broken limit gives STOP, otherwise any unknown limit gives REVIEW, otherwise GO. A STOP without a verified quote is downgraded to REVIEW.
- Limits checked: salary/CTC, countries, office days per week, employment type, languages, travel, excluded industries, notice period, visa sponsorship.

Around the verdict:

| Feature | Where | Notes |
|---|---|---|
| Posting risk check | `_shared/risk.ts`, `RiskPanel` | Plain rules. Lists warning signs with quotes. Never says "fake". |
| Traceable application pack | `_shared/traceability.ts`, `TracePanel` | Every factual line cites a profile record; numbers not in the record are flagged. Nothing is sent for you. |
| Follow-up tasks, Today list, `.ics` export | `src/lib/followups.ts`, `src/lib/ics.ts` | Tasks are created when you save, apply, or get a REVIEW. |
| Import-first onboarding | `CvImportCard`, `src/lib/cvImport.ts` | Upload a CV, check "what we understood", then finish. |
| Feature flags | `src/lib/features.ts` | Off-product areas are hidden, not deleted. `VITE_FEATURES="assessments,referrals"` restores groups. |

## Repository map

```
src/                     React app (Vite, TypeScript, Tailwind, shadcn/ui)
  pages/                 Screens. Landing.tsx is the public page; LandingLegacy.tsx is the old one.
  components/            VerdictView, BlockerCard, RiskPanel, TracePanel, ...
  lib/                   Pure helpers: limits, followups, ics, cvImport, features, risk
supabase/functions/      Edge functions (Deno)
  _shared/               verdict, limits, present, extraction-schema, risk, traceability  <- pure, tested
eval/                    Labelled postings, oracle extractions, scorer, runners
drizzle/migrations/      SQL migrations (0004 to 0007 are the new ones)
docs/                    Deploy checklist and the migrations in one file
```

## Run it

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:8080
npm test           # vitest
npm run build
```

The app talks to a Supabase project (Lovable Cloud). `.env` holds the public URL and publishable key only. Edge functions need `LOVABLE_API_KEY` set as a Supabase secret.

In development, `/dev/preview?view=stop|review|go|pack|risk` renders the signed-in screens with real engine output and fixture data. It is not part of production builds.

## Measure the verdict

`eval/` holds 53 hand-labelled synthetic postings (30 general, 23 Indian) and a profile.

```bash
npm test                                   # rules turn a perfect reading of every posting into its label
LOVABLE_API_KEY=... npm run eval:run:v2    # real AI reader + rules over all postings
npm run eval:score:v2                      # accuracy, STOP->GO misses (the worst failure), wrong STOPs
```

Replace the synthetic postings with real ones before trusting any number. See `eval/README.md`.

## Conventions

- Every change appends a row to `CHANGELOG.md` (see `AGENTS.md`).
- Rules live in pure modules under `supabase/functions/_shared/` so tests, the edge functions and the eval runner share one implementation.
- Judgement calls made without asking are listed in `DECISIONS.md`.

## Licence and ownership

See `LICENSE` and the in-app Terms. The terms name the IP owner; check them before reusing this code.
