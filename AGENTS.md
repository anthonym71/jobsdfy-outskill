# Architecture rules
- Keep Profile accessible before onboarding; the questionnaire is an explicit opt-in within AppLayout so navigation stays available without bypassing job-workflow onboarding checks.
- Profile sections share query-addressable navigation; onboarding voice uses the visible field order and retains its connected session across automatic page transitions so answers cannot drift into unrelated fields.
- Basic Information Talk reuses ordered form dictation instead of open-ended extraction; field dictation writes interim text and stops the previous recognizer before switching inputs. Browser field dictation uses the browser default microphone, while ElevenLabs sessions honour the app-selected microphone.
- Credit mutations notify all mounted credit widgets to reload authoritative values so sidebar XP and balances stay synchronized.
- Normalize ElevenLabs messages through the shared conversation adapter and apply single-question instructions before session startup; the installed SDK emits source/message rather than raw socket events.
- Use the voice SDK's input-volume analyser for connected microphone levels rather than starting a second capture; hosted first-message and prompt overrides must be enabled for app-controlled onboarding questions.
- Reuse events and creator-scoped writes for calendar event/meeting management; preserve cancelled records and keep judges read-only.
- Demo leaderboard data is local and clearly illustrative; reward explanations derive from the existing credit catalogue rather than granting new credits.
 - Normalize uploaded CVs through the shared CV-content adapter; destination-specific imports must not implicitly overwrite the main profile.
 - Save voice interview transcripts to protected interview sessions before reusing the existing assessment flow; history derives analytics from stored feedback.

- Hackathon page visibility is controlled solely by src/config/features.ts and a shared route gate using protected owner access; backend functions remain enabled for dependent workflows.

- Stripe payment functions share a provider-resource mode guard in `_shared/stripe-test-mode.ts`; validate Stripe's balance before payment actions so a changed credential cannot silently enable live processing.
- Every project change must append a CHANGELOG.md row with Date, Change, Suggested by, Implemented by and Notes; default Suggested by to Anthony when unspecified.
- Keep versioned terms acceptance in a dedicated protected table and gate signup and authenticated pages; server timestamps are authoritative.
- Keep owner/team/judge access in protected admin_access alongside user_roles; verified auth email assignment, database policies and server handlers enforce privileges, never UI-only checks.
- Admin user lists use the protected registered-account query rather than profile rows so incomplete profiles remain visible; password-reset emails are owner-authorized on the server and target the account's verified auth email.
- ElevenLabs voice sessions share local microphone selection and a free input test; release test/permission streams before SDK capture and pass the chosen inputDeviceId to session startup to avoid unused captures and wrong-device routing.