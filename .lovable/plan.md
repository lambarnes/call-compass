
# Beta Completion Build — Plan

Prepare Call Compass for 25 friendly beta testers. No real Zoom work, no billing, no team accounts. Existing flows (Dashboard → New Brief → Live Radar → Summary, all 8 AI buttons, AI logic, transcript behavior) stay intact.

---

## A. Persist Zoom Meeting Link

**Schema migration** (one migration):
- `ALTER TABLE public.calls ADD COLUMN zoom_meeting_link text;` (nullable, no default).
- No RLS / grant changes needed (existing policies already cover all columns).

**Code:**
- `src/lib/calls.functions.ts` — add `zoom_meeting_link` to `CallBriefInput`, include in `createCall` insert and `updateCall` patch.
- `src/routes/_authenticated/calls.new.tsx` — promote the local-only `meetingUrl` to `form.zoom_meeting_link`, persist via `createCall`.
- `src/routes/_authenticated/calls.$id.index.tsx` — show "Zoom meeting link" row (clickable link if present) and allow editing in the brief form.
- `src/routes/_authenticated/calls.$id.live.tsx` — show the link in the left brief panel (read-only, opens in new tab). No Zoom API calls; the "Zoom Transcript (Coming Soon)" selector stays disabled.

## B. `/beta` — Beta Testing Guide

New public route: `src/routes/beta.tsx` (top-level, SSR ok, no auth gate).

Sections rendered with existing `Card` primitives:
1. What Call Compass is
2. What to test
3. How to create a Call Brief
4. How to use Manual Transcript mode
5. Which 4 buttons to test first (the four listed)
6. How to end and summarize a call
7. How to submit feedback

CTA: **Start Beta Test** button. On click, check `supabase.auth.getUser()`; navigate to `/dashboard` if signed in, else `/auth`.

## C. `/samples` — Sample Scenario Library

New authenticated route: `src/routes/_authenticated/samples.tsx`.

Static array of 6 scenarios (Telecom Cybersecurity Launch, SaaS Revenue Stalled, Scope Creep Client, Budget Avoidance Prospect, Strong Buying Signal, Founder Dependency / Operator Bottleneck) defined in `src/lib/sample-scenarios.ts`. Each: `title, company, contact_role, call_type, meeting_objective, business_context, transcript, suggested_buttons[]`.

Card grid; each card has **Use This Sample** button →
1. Calls `createCall` with the scenario fields (and `transcript_session_text` preloaded with the sample transcript — already a column on `calls`).
2. Navigates to `/calls/$id/live`.

No new server function needed — `createCall` already accepts the relevant fields; add `transcript_session_text` to `CallBriefInput` if not yet there.

## D. `/feedback` — Beta Feedback Form

**Schema migration** (separate migration, run together with A):

```sql
CREATE TABLE public.beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  role text,
  company text,
  scenario_tested text,
  most_useful_button text,
  least_useful_button text,
  usefulness_rating int,
  accuracy_rating int,
  clarity_rating int,
  would_use_again text,
  would_pay text,
  confusing_parts text,
  missing_features text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.beta_feedback TO authenticated;
GRANT ALL ON public.beta_feedback TO service_role;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback self insert" ON public.beta_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback self select" ON public.beta_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

No public read. No update/delete policies.

**Code:**
- `src/lib/feedback.functions.ts` — `submitFeedback` serverFn with `requireSupabaseAuth`, zod-validated input, inserts with `user_id = context.userId`.
- `src/routes/_authenticated/feedback.tsx` — form with all listed fields (ratings as `Slider` 1–10, would_use_again / would_pay as Select Yes/Maybe/No, rest text/textarea). Toast on success, then reset.

Route is authenticated so `user_id` is always set (matches RLS).

## E. Sidebar Navigation

Edit `src/components/app-sidebar.tsx` — add three items under Workspace:
- `Samples` → `/samples` (Library icon)
- `Beta Guide` → `/beta` (BookOpen icon)
- `Feedback` → `/feedback` (MessageSquare icon)

## F. Dashboard Beta CTA

Edit `src/routes/_authenticated/dashboard.tsx` — add a `Card` ("Beta Test Call Compass") above or beside Recent Calls, with two buttons:
- **View Sample Scenarios** → `/samples`
- **Submit Feedback** → `/feedback`

## G. Preservation

Untouched: AI logic in `src/lib/ai.functions.ts`, the 8 action buttons & Cockpit layout in `calls.$id.live.tsx`, summary flow, settings (Zoom card stays "Not Connected" placeholder), auth, routing.

No Zoom SDK, no OAuth, no token storage, no `fetch` to `zoom.us`.

---

## Deliverables Summary

**Files added:**
- `src/routes/beta.tsx`
- `src/routes/_authenticated/samples.tsx`
- `src/routes/_authenticated/feedback.tsx`
- `src/lib/sample-scenarios.ts`
- `src/lib/feedback.functions.ts`

**Files changed:**
- `src/lib/calls.functions.ts` (add `zoom_meeting_link`, ensure `transcript_session_text` in input)
- `src/routes/_authenticated/calls.new.tsx` (persist Zoom link)
- `src/routes/_authenticated/calls.$id.index.tsx` (display/edit Zoom link)
- `src/routes/_authenticated/calls.$id.live.tsx` (show Zoom link in brief panel)
- `src/components/app-sidebar.tsx` (3 new nav items)
- `src/routes/_authenticated/dashboard.tsx` (Beta CTA card)

**Routes added:** `/beta`, `/samples`, `/feedback`

**Schema changes:**
- `calls.zoom_meeting_link text` (nullable)
- new table `beta_feedback` with RLS (self insert + self select only)

**Zoom:** no APIs, no SDK, no OAuth, no tokens — link is a plain text field only.
