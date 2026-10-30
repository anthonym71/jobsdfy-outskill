# Verdict eval set

Hand-labelled postings used to measure the GO / REVIEW / STOP engine before and after the rewrite.

- `profile.sample.json` - the candidate every posting is judged against. Replace with your real limits.
- `postings/` - one `.txt` per posting (paste the text exactly as you saw it).
- `labels.json` - your expected verdict and failed limits per posting.
- `score.ts` - compares an engine's results to the labels.
- `run-current-engine.ts` - replays today's prompts to get the baseline.

The three `[SYNTHETIC EXAMPLE]` postings only prove the harness works. Replace them with real ones.

## Target set (from the priorities plan)
50-100 postings: ~30 general, ~20 Indian (notice period, CTC, WFO language), ~20 you suspect are stale or fake.
Label every posting before running any engine, so the labels cannot be bent to fit its output.

## Run
```
LOVABLE_API_KEY=... npm run eval:run     # baseline of the current engine
npm run eval:score                       # accuracy, STOP->GO misses, wrong STOPs
npm test                                 # includes scorer unit tests
```
Track STOP->GO misses first: a missed STOP wastes the user's time, which is the product's whole promise.
