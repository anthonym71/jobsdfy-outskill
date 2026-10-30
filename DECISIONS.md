# Decisions made during the overnight build

Each line is a call I made without asking. Reverse any you disagree with.

- Added dev dependency `@testing-library/dom` (peer of the already-declared `@testing-library/react`; it was missing because the install needed `--legacy-peer-deps`). Needed for component render tests.
- Left `package-lock.json` untouched (npm rewrote ~6,500 lines of it); run `npm install --legacy-peer-deps` to refresh it. The repo also has `bun.lock`.
