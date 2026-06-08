## Goal
Add user-level Zoom authorization readiness on `profiles`, surface its status in Settings, and keep the Connect button as a stub. No tokens, no OAuth, no SDK.

## Schema change (migration)
Add to `public.profiles`:
- `zoom_auth_status text not null default 'not_connected'` (allowed: `not_connected`, `pending`, `connected`, `error`) — enforced via CHECK constraint
- `zoom_auth_connected_at timestamptz null`
- `zoom_auth_email text null`

No token columns. No changes to `calls` — `zoom_meeting_link` stays on calls.

## Code changes

### `src/lib/calls.functions.ts`
- Extend `getProfile` return (no change needed — `select("*")` already covers new columns once types regenerate).
- Extend `updateProfile` input validator to optionally accept the three new fields (not used by UI now, but allows future writes). Keep payload narrow and validated.

### `src/routes/_authenticated/settings.tsx` — `ZoomIntegrationCard`
- Read `zoom_auth_status`, `zoom_auth_connected_at`, `zoom_auth_email` from the existing `profile` query (no new query).
- Map status → badge:
  - `not_connected` → muted "Not Connected"
  - `pending` → amber "Pending"
  - `connected` → green "Connected" (show email + connected-at when present)
  - `error` → red "Error"
- Replace existing static "Not Connected" badge logic with this status-driven version.
- `Connect Zoom` button: keep disabled visual, on click show toast: *"Zoom authorization is not enabled yet. This beta uses manual transcript mode."*
- Add a small "Future permissions" list under the description:
  1. Read meeting metadata
  2. Receive live transcript stream
  3. Match Zoom meeting to Call Compass brief
- No redirect, no `signInWithOAuth`, no fetches.

No changes to call brief form, AI routing, or live radar.

## Files changed
- `supabase/migrations/<new>.sql` (schema)
- `src/lib/calls.functions.ts` (validator extension only)
- `src/routes/_authenticated/settings.tsx` (Zoom card reads status from profile)

## Confirmations after apply
- Schema changes: yes — 3 nullable/defaulted columns on `profiles`, none on `calls`.
- Zoom auth status stored on `profiles`: yes.
- `zoom_meeting_link` remains on `calls`: yes (untouched).
- No Zoom tokens added: confirmed — no access/refresh token columns.
- No Zoom API calls added: confirmed — button only shows a toast.
