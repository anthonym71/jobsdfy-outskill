# Morning report: overnight build of JobsDFY

Branch `priorities-round2`, 11 commits on top of `main`, all local. **Nothing was pushed, deployed, or applied to a live database.** No Stripe code or price was touched.

## What the product is now

Paste a job posting. JobsDFY compares it with your hard limits and says GO, REVIEW or STOP, naming the limit that broke and quoting the line from the posting. If the posting is silent or vague on a limit, it says "the posting doesn't say" and the answer is REVIEW, never a guess. It adds a warning-signs panel (never calls a job fake), drafts applications where every line points to your own profile, creates follow-up tasks, and exports them to your calendar. It is built first for Indian limits: notice period, CTC in lakh (LPA), and office days. The old kitchen-sink app is still there behind feature flags, off by default.

## What shipped

| Phase | What | Tests added | Commit |
|---|---|---|---|
| 1 | Eval harness: 53 labelled synthetic postings (30 general, 23 Indian), scorer, baseline runner | 8 | `80c1911` |
| 2 | Verdict engine v2: plain-code rules decide; the AI only extracts quoted facts; quotes verified against the text; STOP without a verified quote becomes REVIEW | 66 | `e9e77ed` |
| 3 | India limits: notice period, office days per week, languages, time zone, CTC in LPA; INR/AED/SGD/AUD | 9 | `fb5ef84` |
| A | Posting risk check: warning signs with quotes, labelled "visible in text" or "needs data from outside" | 11 | `6450039` |
| B1 | Traceable application pack: each line cites a profile record, numbers must exist in the profile, review gate before Approve | 11 | `49b83c3` |
| B2 | Follow-up tasks, dashboard Today list, `.ics` export | 12 | `43588c5` |
| B3 | Import-first onboarding: upload a CV, see "What we understood", fix it, then finish | 8 | `3b872e5` |
| C | Feature flags hide off-product areas; guard test that scoring never reads books/movies/assessments | 12 | `8afcf76` |
| D | New landing page, redesigned verdict screen (what breaks / what the posting doesn't say / what fits), dev preview route | 6 | `082433f` |
| Review | Independent code review of the whole branch: 9 of 10 findings fixed, 1 documented | 21 | `a1906b1` |

## Results, exactly as they came out

- **Tests:** 181 passed, 0 failed (21 files). Run `npm test`.
- **Type-check:** clean (`npx tsc --noEmit -p tsconfig.app.json`).
- **Lint:** 193 errors, 34 warnings across the repo, against 194 errors on `main`. All are old `no-explicit-any` style errors; the branch adds none.
- **Production build:** succeeds. The dev-only preview route is not in the bundle (checked).
- **Rules vs your labels:** given a perfect reading of each posting, the rules reproduce all 53 confirmed labels. This proves the rules, **not** the AI reader.
- **Risk check on the synthetic set:** 7 of 7 suspicious postings flagged, 0 of 46 genuine postings flagged. That set was written by me, so this is a sanity check and not a measured accuracy.

## Not verified (read this before trusting anything)

1. **The real AI reader has never run.** There was no `LOVABLE_API_KEY`. How often the model reads a posting correctly is unknown. This is the single most important number and it is the first thing to measure: `npm run eval:run:v2` then `npm run eval:score:v2`.
2. **The 53 postings are synthetic.** I wrote them. Replace them with real postings before trusting any score.
3. **Nothing was tested against the live backend.** Signed-in screens were checked with mocked data and a dev preview, not with a real login. The edge functions are not deployed and migrations 0004 to 0007 are not applied.
4. **Application packs:** whether the model cites sources correctly is untested. The number check on the generated text is deterministic and tested.
5. **CV import** uses the existing `parse-cv` function, untested against the real parser. Word files are not supported (save as PDF).
6. **Visual checks** covered the landing page (1280 and 375 wide, light and dark) and the verdict screen (desktop light, mobile dark). Onboarding, the dashboard and the pack screen were checked through component tests and text, not screenshots.

## Pages to look at first

Run `npm run dev` and open:

- `http://localhost:8080/` : the new landing page
- `http://localhost:8080/dev/preview?view=stop` (also `review`, `go`, `pack`, `risk`) : the verdict screen with real engine output on sample postings (dev only)
- `http://localhost:8080/auth` : sign in

## Decisions I made for you

See `DECISIONS.md` for all of them. The ones you may want to reverse:

- Hid Events, Event Registrations and Companies behind flags too (they were not on your list). `VITE_FEATURES="events,hiring"` brings them back and serves the old landing page.
- The old landing page said Premium was $19 a month. The code says $49.99. The new landing reads prices from code. I changed no Stripe settings.
- STOP now has "Skip this job" (archives it) as the main button and "Continue anyway" as the second.
- Added the dev dependency `@testing-library/dom`. Lockfiles were not refreshed (see the deploy checklist).

## Things outside this branch that need you

- **Pricing for India.** Checkout is in US dollars ($9 and $49.99 a month). The research suggested an India ceiling of a few hundred rupees a month. I invented no prices; that is a Stripe change and your call.
- **Session recording.** `index.html` loads Microsoft Clarity (session recording) and a Lovable script. Decide whether you want that on a product that handles CVs, and make sure the privacy policy covers it.
- **Share image.** The `og:image` is a signed, expiring URL. Replace it.
- **Ownership.** The in-app Terms name Anthony Mallett as IP owner. Confirm you may change and redeploy this project.
- **Known limits.** No relocation limit (nothing in the evidence backs a rule). Time-zone eligibility only works if the user sets a UTC offset. Standalone `generate-cv` and `generate-cover-letter` were not changed.

## First five things to do

1. Apply `docs/apply-migrations-0004-0007.sql` (to a copy first if you can).
2. Deploy `extract-job`, `analyze-dealbreakers`, `generate-application` and the shared files (`docs/DEPLOY_CHECKLIST.md` has the order).
3. Run the real-model eval and read the **STOP->GO misses** number first.
4. Replace the synthetic postings with 20 or more real ones, especially Indian ones, and re-run.
5. Read the landing copy and decide on pricing for India.
