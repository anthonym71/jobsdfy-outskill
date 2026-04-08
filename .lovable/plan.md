

# Plan: Save Phone Number Before Verification

## Problem
Currently, if a user enters a phone number but OTP verification fails (or they abandon the flow), the number is lost. We want to save it immediately so we have a contact number on file, but show it as "unverified" and gate privileges behind verification.

## Changes

### 1. Update `handleSendOtp` in Settings.tsx
After the OTP is successfully sent, immediately save the phone number to `user_profiles` with `phone_verified: false`. This ensures the number is persisted even if the user never completes verification.

### 2. Update phone display in Settings.tsx
- Show the current phone number with a verification badge: green "Verified" or amber "Not Verified"
- Load `phone_verified` from `user_profiles` on mount alongside the phone number
- If phone exists but is unverified, show a "Verify Now" button that goes straight to the OTP send step

### 3. Update verify-phone edge function
The `send` action already stores the phone in user metadata for OTP purposes. After sending OTP, also update `user_profiles` with the new phone number and set `phone_verified = false` so it's saved server-side regardless of client behavior.

### 4. Update Onboarding.tsx
If a phone number is entered during onboarding, save it with `phone_verified: false` and allow the user to proceed. They can verify later from Settings.

## Files Changed
1. `src/pages/Settings.tsx` — save phone on OTP send, show verified/unverified badge, add "Verify Now" for unverified numbers
2. `supabase/functions/verify-phone/index.ts` — save phone to `user_profiles` with `phone_verified: false` during the `send` action

## Build Order
1. Update edge function to save phone on send
2. Update Settings.tsx UI

