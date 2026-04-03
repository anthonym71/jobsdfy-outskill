---
name: Stripe pricing tiers
description: Stripe product/price IDs for Free/Pro/Premium subscriptions and credit top-up packs
type: feature
---
## Subscription Tiers
- **Free**: 3 credits, $0/mo (no Stripe product)
- **Pro**: 30 credits/mo, $9/mo — prod_UGohHAEChdqTA8 / price_1TIH3z2E142c9AbtNq7hfT82
- **Premium**: 100 credits/mo, $19/mo — prod_UGohJceyyZQff3 / price_1TIH4T2E142c9Abt028kStMG

## Credit Packs (one-time)
- 10 credits $4.99 — price_1TIH512E142c9AbtUaWjCMWu
- 50 credits $14.99 — price_1TIH5S2E142c9AbtB9RhOqeH

## Edge Functions
- `create-checkout` — creates Stripe checkout session (subscription or payment)
- `check-subscription` — verifies active subscription status
- `customer-portal` — Stripe billing portal for managing subscription
