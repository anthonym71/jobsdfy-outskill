# Architecture rules

- Stripe payment functions share a provider-resource mode guard in `_shared/stripe-test-mode.ts`; validate Stripe's balance before payment actions so a changed credential cannot silently enable live processing.
- Every project change must append a CHANGELOG.md row with Date, Change, Suggested by, Implemented by and Notes; default Suggested by to Anthony when unspecified.
- Keep versioned terms acceptance in a dedicated protected table and gate signup and authenticated pages; server timestamps are authoritative.
- Keep owner/team/judge access in protected admin_access alongside user_roles; verified auth email assignment, database policies and server handlers enforce privileges, never UI-only checks.