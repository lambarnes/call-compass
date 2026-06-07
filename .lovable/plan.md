## Zoom Integration — UI Shell Only

Build a non-functional UI scaffold for future Zoom integration. No OAuth, no API calls, no SDKs, no token storage.

### Scope

Pure frontend presentational shell. State held in local component state only (no persistence, no schema changes). All Zoom controls are visibly marked as "Coming Soon" / disabled where they would otherwise trigger real calls.

### Files changed

1. **`src/routes/_authenticated/settings.tsx`** (edit)
   - Add a new `Card` section: **"Zoom Integration"**
   - Contains:
     - Status badge: `Not Connected` (default) — variants prepared for `Connected` / `Error` but hardcoded to `Not Connected` for now
     - **Connect Zoom** button — `disabled`, with tooltip/helper text "Coming soon"
     - Helper copy explaining future capability
     - Error message area (`Alert` variant=destructive) — hidden by default, rendered only when local `error` state is set (no triggers wired yet)

2. **`src/routes/_authenticated/calls.new.tsx`** (edit)
   - Add **Meeting URL** input (optional) inside the existing "The call" card
   - Stored in local form state only; **not** sent to `createCall` (no schema change). Field is purely visual scaffolding; will be wired later when schema/metadata column is added.

3. **`src/routes/_authenticated/calls.$id.live.tsx`** (edit)
   - Add a small **"Transcript Source"** selector above the existing transcript textarea:
     - `Manual Transcript` (selected, only working option)
     - `Zoom Transcript (Coming Soon)` (disabled `SelectItem`)
   - Add a collapsed **"Live Zoom Transcript"** placeholder panel — shown only when Zoom source is selected (which is disabled), so effectively a static empty-state card with copy: *"Zoom live transcript will stream here once connected."*
   - Add a hidden `Alert` slot for future Zoom connection errors (rendered only if local `zoomError` state set; no triggers).
   - **Do not touch** any AI button logic, insight rendering, Cockpit zones, server functions, or transcript-driven AI flow.

### Schema changes

**None.** Meeting URL is local-only state. No new columns, no new tables, no migration. Connection status is hardcoded `Not Connected` (no `zoom_connections` table yet).

### UI changes

- Settings page: +1 card (Zoom Integration) with disabled Connect button + status badge + error slot.
- New Call Brief: +1 optional "Meeting URL" input (no backend effect).
- Live Radar: +1 Transcript Source selector, +1 placeholder Zoom stream panel, +1 error slot.

### Out of scope (explicit)

- No `@zoom/*` SDK install
- No OAuth route, callback, or redirect handler
- No server function for Zoom
- No secret added (no `ZOOM_CLIENT_ID` etc.)
- No `fetch` to `zoom.us`
- No new DB column or migration
- No change to existing AI / insight / Cockpit behavior

### Confirmation

No real Zoom API calls, SDK imports, OAuth flows, or token storage will be added in this pass. Everything is static UI + local React state.
