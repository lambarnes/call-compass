
# Live Call Radar — Build Plan (v2, approved with corrections)

Premium executive-grade SaaS for Zoom-native live call intelligence. Mock AI now; real schema, real auth, real persistence.

## Corrections applied

1. `src/routes/index.tsx` is a pure redirect: authed → `/dashboard`, unauthed → `/auth`. No marketing content.
2. No transcript autosave. `transcript_chunks` rows are created only when the user clicks **Save Transcript Segment** or **Analyze Current Moment**.
3. `calls.transcript_session_text` (text, nullable) holds the working live transcript for the current session. Debounced save to `calls` row only (single row update, not new chunks).
4. `live_insights` gets `sequence_number` (int, per-call monotonic via DB trigger), `transcript_chunk_id` (uuid, nullable FK → `transcript_chunks.id`), `created_at`. UI shows newest first; sequence preserved for history/export.
5. Immediately after Lovable Cloud is enabled and the schema migration runs, I'll prompt you to connect GitHub before continuing feature work.

## Scope

Login → Dashboard → New Call Brief → Call Brief Detail → Live Call Radar cockpit → After-Call Summary → Saved Calls → Settings. Nothing else.

## Design

- Executive (Linear / Superhuman / Gong). Dark navy primary in oklch, near-white light surface, single cool-blue accent.
- Inter Tight (display) + Inter (body), loaded via `<link>` in `__root.tsx`, registered in `@theme` in `src/styles.css`.
- Risk semantic tokens: `--risk-green`, `--risk-yellow`, `--risk-red` (used only on badges).
- Fixed left sidebar: Dashboard, New Call, Saved Calls, Settings.

## Backend (Lovable Cloud / Supabase)

Enable Lovable Cloud → run migration → **prompt to connect GitHub** → continue.

Tables (RLS scoped to `auth.uid()`, explicit GRANTs to authenticated + service_role, no anon):

- `profiles` — id (=auth.users.id), full_name, company_name, role, created_at, updated_at. Auto-created via `on_auth_user_created` trigger.
- `calls` — all spec fields + `transcript_session_text text`, `status` enum (draft, ready, live, completed, follow_up_done).
- `transcript_chunks` — id, call_id, user_id, transcript_text, `source` enum (manual, zoom_transcript_future), created_at. Created only on explicit Save Segment / Analyze action.
- `live_insights` — id, call_id, user_id, action_button, signal_type, risk_level (green/yellow/red), what_im_hearing, likely_true_intent, emotional_signal, hidden_risk, recommended_question, question_to_avoid, recommended_next_move, **sequence_number int not null**, **transcript_chunk_id uuid null references transcript_chunks(id) on delete set null**, created_at. Unique(call_id, sequence_number). Trigger assigns next sequence on insert.
- `after_call_outputs` — all spec fields, one-row-per-call (unique call_id).

Auth: email/password + Google OAuth via Lovable broker. `/auth` and `/reset-password` routes.

## Routes (TanStack Start)

```
src/routes/
  index.tsx                          → redirect-only (authed→/dashboard, else→/auth)
  auth.tsx
  reset-password.tsx
  _authenticated/
    route.tsx                        → integration-managed gate, hosts sidebar shell
    dashboard.tsx
    calls.index.tsx                  → Saved Calls
    calls.new.tsx                    → New Call Brief
    calls.$id.tsx                    → Call Brief detail (view/edit, "Start Live Radar")
    calls.$id.live.tsx               → Live Call Radar cockpit
    calls.$id.summary.tsx            → After-Call Summary
    settings.tsx
```

## Live Call Radar cockpit

- **Left:** read-only Call Brief panel (objective, what to learn, planned questions, risks, desired outcome, authority, budget).
- **Center:** transcript textarea labeled "Live transcript input — Zoom integration pending." Debounced update to `calls.transcript_session_text` (single-row UPDATE, no chunk creation). Two explicit buttons: **Save Transcript Segment** (creates a `transcript_chunks` row with current text, clears or marks segment), **Analyze Current Moment** (creates chunk + triggers default analysis insight).
- **Right:** AI Guidance Panel — 8 spec action buttons. Each click → server fn → mock structured insight saved to `live_insights` with `transcript_chunk_id` linked to the most recent chunk (or null if none). Cards render newest-first; `sequence_number` shown as `#012` on each card.

Insight card: signal type, colored risk badge, all 10 structured fields, next-move pill.

## After-Call Summary

Server fn `generateAfterCallSummary({ callId })` consumes brief + chunks + insights, writes mock structured `after_call_outputs` row, renders editable sections + follow-up email draft with copy button. `recommended_next_step` constrained to the 7 spec options.

## Mock AI architecture

`src/lib/ai.functions.ts` with `requireSupabaseAuth`:
- `generateLiveInsight({ callId, actionButton, transcriptChunkId | null })`
- `generateAfterCallSummary({ callId })`

Mock outputs today; swap internals to real LLM later without UI changes. No external AI keys this build.

## Zoom future-readiness

Enum value `zoom_transcript_future` exists on `transcript_chunks.source`. No Zoom SDK code added.

## Stack details

- TanStack Start + TanStack Query (`ensureQueryData` + `useSuspenseQuery`)
- All data via `createServerFn` + `requireSupabaseAuth`; `attachSupabaseAuth` wired in `src/start.ts`
- shadcn: Sidebar, Card, Button, Input, Textarea, Select, Badge, Dialog, Sonner
- `zod` + `react-hook-form` for the brief form
- No localStorage for app data

## Build order

1. Enable Lovable Cloud, run schema migration (all 5 tables, RLS, grants, profile trigger, sequence trigger)
2. **Prompt to connect GitHub** — pause for confirmation before step 3
3. Design tokens, sidebar shell, auth pages (email + Google)
4. Dashboard, New Call Brief, Saved Calls, Call Brief detail
5. Live Call Radar cockpit + mock insight server fn (with sequence + chunk linkage)
6. After-Call Summary + mock summary server fn + Settings
7. Empty states, loading skeletons, polish

## Out of scope

Real Zoom integration, real LLM calls, billing, team sharing, calendar sync, CRM sync, notifications.

Awaiting switch to build mode.
