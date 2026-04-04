---
name: Stripe pricing tiers
description: Stripe product/price IDs for Free/Pro/Premium subscriptions, recruiter tiers, and credit top-up packs
type: feature
---
## Job Seeker Subscription Tiers
- **Free**: 3 credits, $0/mo (no Stripe product)
- **Pro**: 30 credits/mo, $9/mo — prod_UGohHAEChdqTA8 / price_1TIH3z2E142c9AbtNq7hfT82
- **Premium**: 100 credits/mo, $19/mo — prod_UGohJceyyZQff3 / price_1TIH4T2E142c9Abt028kStMG

## Recruiter Tiers
- **Free**: 3 job posts, $0/mo
- **Standard**: up to 10 active jobs, $9/mo — prod_UGqwkBswf8Qd90 / price_1TIJEi2E142c9AbtYY7H6JqG
- **Unlimited**: unlimited jobs, $49/mo — prod_UGqxnwGnSiBqLG / price_1TIJFB2E142c9Abt74jT8Dni

## Credit Packs (one-time)
- 10 credits $4.99 — price_1TIH512E142c9AbtUaWjCMWu
- 50 credits $14.99 — price_1TIH5S2E142c9AbtB9RhOqeH

## Edge Functions
- `create-checkout` — creates Stripe checkout session (subscription or payment)
- `check-subscription` — verifies active subscription status
- `customer-portal` — Stripe billing portal for managing subscription
