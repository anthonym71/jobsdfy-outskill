

# Plan: Voice-Driven Profile Builder + Per-Field Mic Input

## Problem
The current "Talk to Me" button on all profile tabs uses the same ElevenLabs conversational agent (`agent_9501kncarackfv1vkxevndvsjahk`) which is configured for interview practice, not for structured CV data collection. It does not ask the right questions, and the extracted data is not populated back into the form fields.

There are two distinct features needed:

1. **Guided Voice CV Builder** — A conversational flow that walks the user through each Work History field, extracts structured data, and populates the form.
2. **Per-field mic icon** — A small microphone button next to each field label that uses speech-to-text to dictate into that specific field. For dropdowns, it reads the options aloud so the user can choose by voice.

---

## Architecture Decision

The current VoiceCVBuilder uses an **ElevenLabs Conversational Agent** (a full voice agent with its own personality and flow). This is appropriate for the guided "walk me through adding a job" flow, BUT:

- The agent needs to be configured in ElevenLabs to ask the right questions for CV building (not interview practice)
- Per-field dictation does NOT need a conversational agent — it needs simple **Speech-to-Text (STT)**

### Approach
- **Guided flow**: Keep using ElevenLabs Conversational AI but with a **new dedicated agent** configured for CV data collection
- **Per-field mic**: Use the browser's built-in `webkitSpeechRecognition` / `SpeechRecognition` API (free, no API calls, instant) rather than ElevenLabs STT (which would be overkill and costly for single-field dictation)

---

## What You Need to Do in ElevenLabs

You need to create a **new ElevenLabs Agent** specifically for CV profile building. Here are the exact steps:

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Click **Create Agent**
3. Set the agent name to something like "Joby CV Builder"
4. Configure the **System Prompt** with something like:

```
You are Joby, a friendly career assistant helping someone build their CV/resume profile. 
You should walk them through adding a new job to their work history.

Ask these questions one at a time, conversationally:
1. "What was your job title?"
2. "Which company did you work for?"
3. "Was this full-time, part-time, contract, freelance, fractional, internship, or volunteer?"
4. "Where was the job located?"
5. "Was it onsite, remote, or hybrid?"
6. "When did you start? What month and year?"
7. "Are you still working there? If not, when did you finish?"
8. "Can you describe what you did in this role? Focus on your key responsibilities."
9. "Did you have any notable achievements, awards, or performance highlights?"
10. "What were the main skills you used in this role?"

Be encouraging and conversational. After getting all answers, summarize what you've captured and ask if they want to make any changes.
```

5. Set the **First Message** to: "Hi! I'm Joby. Let's add a new job to your work history. What was your job title?"
6. Choose a voice (e.g., "Roger" or whichever voice you're using for Joby)
7. Enable **User Transcripts** and **Agent Response** events in the agent settings
8. Save and copy the new **Agent ID**
9. Give me the Agent ID and I'll update the code

---

## Implementation Plan

### Phase 1: Per-Field Voice Input Component (Browser STT)

**New file: `src/components/profile/VoiceFieldInput.tsx`**

A small reusable component that renders a mic icon button next to a field label. When clicked:
- For **text/textarea fields**: Starts browser SpeechRecognition, transcribes speech, appends to field value
- For **select/dropdown fields**: Reads the available options (via a toast or spoken prompt), then matches the spoken word to the closest option and selects it
- Shows a pulsing mic indicator while recording
- Uses `window.SpeechRecognition` or `window.webkitSpeechRecognition` (no API cost)

### Phase 2: Update WorkHistoryTab with Per-Field Mic Icons

**Edit: `src/components/profile/WorkHistoryTab.tsx`**

- Add "Fractional" to `EMPLOYMENT_TYPES` array
- Add `VoiceFieldInput` next to every field label (Job Title, Company, Employment Type, Location, Location Type, Start/End dates, Description, Awards, Achievements, Performance, Skills)
- For dropdowns (Employment Type, Location Type, Months, Years), pass the options list so the component can match spoken input

### Phase 3: Restructure VoiceCVBuilder for Profile Data Collection

**Edit: `src/components/profile/VoiceCVBuilder.tsx`**

- Accept a new prop `agentId` (optional) to allow different agents per category
- Pass `category` context to the edge function token endpoint so the right agent is used
- Update `onDataExtracted` callback in WorkHistoryTab to actually populate the form fields from extracted JSON

**Edit: `supabase/functions/elevenlabs-conversation-token/index.ts`**

- Accept an optional `agent_id` parameter from the request body
- Use the CV Builder agent ID when `category === "work"` (or other profile categories)
- Fall back to the default interview agent for interview practice

**Edit: `supabase/functions/voice-profile-extract/index.ts`**

- Improve the `work` category extraction to use tool calling (structured output) instead of `response_format: json_object` for more reliable field mapping
- Return data in a shape that directly maps to the `WorkEntry` interface

### Phase 4: Wire Up Data Extraction to Form Population

**Edit: `src/components/profile/WorkHistoryTab.tsx`**

- Add `onDataExtracted` handler to the `VoiceCVBuilderDialog` that takes the extracted JSON and creates new `WorkEntry` objects, appending them to the entries array
- Auto-populate all fields including employment type, dates, location type

### Phase 5: Add Per-Field Mic to AboutMeTab and Other Tabs

**Edit: `src/components/profile/AboutMeTab.tsx`**, **EducationTab.tsx**, **ReferencesTab.tsx**, **AchievementsTab.tsx**

- Add `VoiceFieldInput` next to field labels across all profile tabs

---

## Files Changed/Created

| File | Action |
|------|--------|
| `src/components/profile/VoiceFieldInput.tsx` | **Create** — Reusable per-field mic button using browser STT |
| `src/components/profile/WorkHistoryTab.tsx` | **Edit** — Add Fractional, add mic icons, wire up voice data extraction |
| `src/components/profile/VoiceCVBuilder.tsx` | **Edit** — Support custom agent IDs, improve data extraction wiring |
| `src/components/profile/AboutMeTab.tsx` | **Edit** — Add mic icons to all fields |
| `src/components/profile/EducationTab.tsx` | **Edit** — Add mic icons |
| `src/components/profile/ReferencesTab.tsx` | **Edit** — Add mic icons |
| `supabase/functions/elevenlabs-conversation-token/index.ts` | **Edit** — Support multiple agent IDs |
| `supabase/functions/voice-profile-extract/index.ts` | **Edit** — Use tool calling for structured work history extraction |

---

## ElevenLabs Action Items (for you)

Before I implement, you need to:

1. **Create a new agent in ElevenLabs** for CV building (instructions above)
2. **Share the Agent ID** with me so I can configure the code

Alternatively, if you want me to proceed immediately, I can:
- Use the **same agent** for now and update later when you create the new one
- The per-field mic input (browser STT) works independently and needs no ElevenLabs setup

---

## Technical Notes

- Browser SpeechRecognition works in Chrome, Edge, Safari (not Firefox). A fallback message will be shown for unsupported browsers.
- The per-field mic is zero-cost (uses browser API, no server calls).
- The guided voice flow still uses ElevenLabs (costs per minute of conversation).
- "Fractional" employment type will be added to the form options.

