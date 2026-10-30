# JobsDFY Outskill Change Log

| Date | Change | Suggested by | Implemented by | Notes |
| --- | --- | --- | --- | --- |
| 2026-10-30 | Public terms with Anthony Mallett IP restrictions and versioned signup/login acceptance | Anthony | Lovable | Version 2026-10-30; existing features retained |
| 2026-10-30 | Owner, hackathon team and read-only judges access | Anthony | Lovable | Verified emails required; owner designated as anthony@ifactoryusa.com; anthony@fflipi.com included in team |
| 2026-10-30 | Mandatory change log and standing project instructions | Anthony | Lovable | Default suggester: Anthony |
| 2026-10-30 | Server write guards, protected cancellation, read-only payment/phone actions and admin onboarding bypass | Anthony | Lovable | Judges can reach admin pages without creating a profile; terms acceptance still required |
| 2026-10-30 | Created judges@jobsdfy.com (confirmed, read-only judge, 500 credits); fixed access guard bug that blocked owner/team/judge signups | Anthony | Lovable | Guard referenced a missing column on user_roles inserts |
| 2026-10-30 | Show all registered accounts in Admin Users with user type and owner-only password reset emails | Anthony | Lovable | Includes owner and judges without profiles; preserves read-only judge access; incomplete profile edit/status actions cannot silently succeed |
| 2026-10-30 | Add microphone selection and sound test to voice CV and interview sessions | Anthony | Lovable | Pass selected microphone to ElevenLabs; release temporary microphone streams; show permission/device errors; no AI calls for microphone test |
| 2026-10-30 | Dark mode theme selection (Light / Dark / System) in Settings | Anthony | Lovable | next-themes class provider; dark tokens already defined; choice persists per device |
| 2026-10-30 | Add verdict eval harness (labelled postings, scorer, baseline runner) | Sajvinder | Claude | Phase 1 of priorities plan; no app behaviour changed; 53 confirmed synthetic labelled postings (30 general, 23 india) to be supplemented with real ones |
| 2026-10-30 | Verdict engine v2: plain-code GO/REVIEW/STOP rules (_shared/verdict.ts); AI extracts quoted evidence; unknown state; quote shown per limit; disagree logging; migration 0004 | Sajvinder | Claude | Phase 2 of priorities plan. analyze-dealbreakers no longer calls an AI model. Not yet run against the real AI reader (needs LOVABLE_API_KEY); migration 0004 not yet applied to the live database |
