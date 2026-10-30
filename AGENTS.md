# Architecture rules

- Stripe payment functions share a provider-resource mode guard in `_shared/stripe-test-mode.ts`; validate Stripe's balance before payment actions so a changed credential cannot silently enable live processing.