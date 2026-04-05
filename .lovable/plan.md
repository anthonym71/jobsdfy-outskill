

# Implementation Plan: Admin Enhancements, Voice CV Builder, Knowledgebase & Social Integrations

This is a large request with 9 distinct features. Here is a phased plan to implement them.

---

## Phase 1: Admin User Management Enhancements (Items 1-3)

### 1A. Show First Name, Last Name, Email, Phone, Tag in Admin
- Split `full_name` display into first/last name columns (or show as-is since profile stores `full_name`)
- Fetch email from `auth.users` via a new edge function (RLS prevents direct access) or store email in `user_profiles` on signup
- Ensure phone number and tags are prominently displayed
- Add a table/grid view option for better data visibility

### 1B. User Groups
- **Database migration**: Create `user_groups` table (id, name, description, created_at) and `user_group_members` table (id, group_id, user_id, added_at) with admin-only RLS policies
- Add UI in AdminUsers to create groups, assign users to groups, and filter by group

### 1C. Email & Text Users from Admin
- Add "Send Email" and "Send SMS" action buttons per user in AdminUsers
- Email: Create a `send-admin-email` edge function (using Lovable email infrastructure or simple mailto for now)
- SMS: Create a `send-admin-sms` edge function using the existing Twilio connector gateway
- Add bulk-select to email/text groups

---

## Phase 2: Phone Verification (Item 4)

### Current State
Phone verification via Twilio already exists in the `verify-phone` edge function and is used during onboarding.

### Changes
- Make phone verification **required only once during account creation** (onboarding step)
- Store `phone_verified: true` in `user_profiles` permanently
- Remove any per-login phone verification checks
- Keep the existing admin OTP bypass (A@PSucks) toggle in `app_settings`
- Ensure the flow is fast: enter number, get SMS, enter code, done

---

## Phase 3: Voice CV Builder - "Talk to Me" Button (Items 5 & 9)

### 3A. Reusable Voice CV Component
- Create a new `VoiceCVBuilder` component (distinct from the interview practice `VoiceInterviewBot`)
- This component uses the same ElevenLabs Conversational AI agent but with a **different system prompt context** passed via `overrides` to guide the conversation toward extracting profile information for a specific category
- Categories: About Me, Work History, Education, References, Achievements

### 3B. "Talk to Me" Button on Each Profile Tab
- Add a "Talk to Me" button at the top of each tab (AboutMeTab, WorkHistoryTab, EducationTab, ReferencesTab, AchievementsTab)
- Clicking opens a **dialog/modal** with the voice interface
- The dialog shows:
  - Joby mascot avatar/icon
  - Audio waveform visualization (animated bars responding to audio levels using `getInputVolume()`/`getOutputVolume()`)
  - Mic receive level indicator
  - Clear status: "Joby is speaking..." / "Listening..." / "Processing..."
  - Microphone and speaker volume indicators so user can see it's working

### 3C. Voice-to-Profile Pipeline
- Create a new edge function `voice-profile-extract` that takes a conversation transcript and extracts structured data for the relevant category
- Uses STAR-method structuring for work achievements
- ATS-optimized formatting for CV-relevant content
- After voice session ends, extracted data is presented to user for review before saving to the relevant table

### 3D. Voice UI Polish (Item 9)
- Popup dialog with animated waveform bars
- Real-time input/output volume meters using ElevenLabs SDK methods
- Visual states: connecting, listening, agent speaking, processing
- Joby branding (reference mascot memory file)

---

## Phase 4: Knowledgebase (Items 6 & 7)

### 4A. Database
- **Migration**: Create `knowledgebase_entries` table (id, user_id, category, content, source_type, source_name, is_relevant, created_at, updated_at) with user-scoped RLS

### 4B. Knowledgebase View Page/Tab
- Add a "Knowledgebase" tab to the Profile page
- Shows ALL collected information across all categories (about me, work, education, references, achievements, plus uncategorized)
- Each entry is editable, deletable, and can be toggled relevant/irrelevant
- Grouped by category with expand/collapse

### 4C. Multi-Source Import
- Create an import panel with options:
  - **File upload**: PDF, DOCX, images (use existing CV parser pattern)
  - **URL**: Scrape content using Firecrawl connector (already connected)
  - **Cloud storage**: Google Drive, OneDrive, Dropbox - show as "coming soon" or use OAuth connectors
  - **Notion**: Available as MCP connector
  - **OneNote**: Show as coming soon
- Each import runs through an AI extraction edge function to categorize and structure the content

---

## Phase 5: Social Media & Messaging Integration (Item 8)

### 5A. Expand Social Platforms List
- Update the `PLATFORMS` array in AboutMeTab to include: LinkedIn, Twitter/X, GitHub, Instagram, TikTok, Facebook, YouTube, WhatsApp, Telegram, iMessage, Google Business, Pinterest, Reddit, Snapchat, Threads, URL/Website
- Allow multiple entries per platform
- Add fields for business pages vs personal profiles

### 5B. Connect/Integration Buttons
- For platforms with available connectors (Telegram, Slack), add a "Connect" button that uses the connector system
- For others, store URLs/handles for reference
- WhatsApp: Store number, generate wa.me link
- Google Business: Store profile URL

---

## Technical Details

### New Database Tables
1. `user_groups` - admin-managed groups
2. `user_group_members` - user-to-group mapping
3. `knowledgebase_entries` - all user knowledge data

### New Edge Functions
1. `send-admin-sms` - Twilio gateway SMS from admin
2. `send-admin-email` - email from admin to users
3. `voice-profile-extract` - AI extraction from voice transcript

### Modified Files
- `src/pages/AdminUsers.tsx` - groups, email/text, better user display
- `src/pages/Profile.tsx` - add Knowledgebase tab
- `src/components/profile/AboutMeTab.tsx` - Talk to Me button, expanded socials
- `src/components/profile/WorkHistoryTab.tsx` - Talk to Me button
- `src/components/profile/EducationTab.tsx` - Talk to Me button
- `src/components/profile/ReferencesTab.tsx` - Talk to Me button
- `src/components/profile/AchievementsTab.tsx` - Talk to Me button
- New: `src/components/profile/VoiceCVBuilder.tsx` - reusable voice CV component
- New: `src/components/profile/KnowledgebaseTab.tsx` - full knowledgebase view

### Implementation Order
1. Admin enhancements (groups, email/text, user display) - foundational
2. Phone verification cleanup - quick win
3. Voice CV Builder with waveform UI - core feature
4. Knowledgebase tab and multi-source import
5. Social media expansion

