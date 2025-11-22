# BMU Fault Finder

BMU Fault Finder is a small web app to help façade-access / BMU engineers
diagnose faults, look up parts, and log jobs while on site.

## Features

- **New Fault**: Pick BMU model + subsystem + symptom, add free-text notes,
  click **Run fault analysis**, and see:
  - Likely causes
  - Checks (as a tickable checklist)
  - Safety notes
  - Raw JSON (for debugging and future AI integration)
- **Parts search**: Filter components by model, subsystem, and search term.
- **Jobs**: Simple job log with site, model, reported fault, diagnosis, notes.

## Tech

- Backend: Node.js built-in `http` server (`server.js`), no external deps.
- Data: In-memory store (`data/store.js`).
- Frontend: Single-page HTML/CSS/JS from `public/`.

## Running locally

```bash
npm install       # no deps, but keeps the workflow standard
npm run dev       # starts HTTP server on http://localhost:3000
