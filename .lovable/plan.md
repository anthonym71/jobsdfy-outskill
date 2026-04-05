

# Fix: Chrome Extension to Job Pipeline

## Root Cause

Two issues are causing the extension flow to fail:

1. **Auth redirect loses query params**: When the extension opens `https://www.jobsdfy.com/app/new-job?source=extension&text=...`, if the user is not logged in, they get redirected to `/auth`. After login, the original URL with search params is lost, so the text never reaches the NewJob page.

2. **No auto-extraction**: Even when the text does arrive, the user must manually click "Extract Job". Since the tab defaults to "url", users may accidentally click Extract with the wrong tab, causing the app to try scraping its own URL via Firecrawl.

3. **LinkedIn feed vs job page**: The extension grabs entire page content. On LinkedIn's feed/home page, this captures profile info, navigation, ads, and multiple job snippets instead of a single job description. This is a user guidance issue.

## Plan

### Step 1: Preserve extension params through auth redirect
In `ProtectedRoute` (inside `App.tsx`), when redirecting to `/auth`, save the current `location.pathname + location.search` so that after login the user is returned to the original URL with query params intact.

Update `Auth.tsx` to redirect back to the saved return URL after successful login.

### Step 2: Auto-trigger extraction from extension
In `NewJob.tsx`, when text arrives from the extension (`source=extension`), automatically trigger the extraction after setting the text. This removes the manual step and prevents the wrong-tab issue.

### Step 3: Repackage the Chrome extension
Rebuild the zip file with the updated content.js and popup.js already in the codebase.

### Step 4: Add LinkedIn guidance to extension popup
Add a small note in `popup.html` reminding users: "Navigate to a specific job posting page first, then click Send." This helps avoid scraping the LinkedIn feed.

## Files Changed
- `src/App.tsx` — pass return URL on auth redirect
- `src/pages/Auth.tsx` — redirect to return URL after login
- `src/pages/NewJob.tsx` — auto-extract when source=extension
- `extension/popup.html` — add guidance text
- `public/ai-job-os-extension.zip` — repackage

