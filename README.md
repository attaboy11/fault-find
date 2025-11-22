# BMU Fault Finder

BMU Fault Finder is a tiny BMU diagnostic helper for façade-access engineers. Pick a model, subsystem, and symptom, then run the analysis to see likely causes, checks, and safety notes. The app also includes quick parts lookup and a simple job log.

## Getting started

```bash
npm install       # no external deps, keeps workflow consistent
npm run dev       # starts the server on http://localhost:3000
```

Open <http://localhost:3000> in your browser.

## What you get

- **New Fault**: Select model + subsystem + symptom, press **Run fault analysis**, and view likely causes, checks, safety guidance, and raw JSON for the matched fault flows.
- **Search Parts**: Filter components by model, subsystem, and text search over name/part/location.
- **Jobs**: Log jobs (site, model, reported, diagnosis, notes) and copy summaries for reports.

## Tech notes

- Backend: Node.js built-in `http` server (no external packages) serving JSON APIs and static assets.
- Data: In-memory seed data in `data/store.js` (models, subsystems, symptoms, components, flows, safety notes, jobs) and an optional external library at `data/fault_library.json` that is normalized into flows at startup.
- Data: In-memory seed data in `data/store.js` (models, subsystems, symptoms, components, flows, safety notes, jobs).
- Frontend: Single-page HTML/CSS/JS in `public/` with simple panel navigation.
