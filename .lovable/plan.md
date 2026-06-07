## Scope

Presentation-only change to insight cards on the Live Call Radar page. Single file: `src/routes/_authenticated/calls.$id.live.tsx`. No schema, auth, routing, layout, or button behavior changes.

## Changes

Rewrite the insight card JSX in the right-hand panel so each card renders fields in this exact order:

1. **Card title** — the `action_button` value (e.g. "What are they really saying?"), not `signal_type`
2. **Signal Type** — `signal_type`
3. **Risk Level** — `risk_level` badge (keep existing colored badge styling)
4. **Confidence %** — derived client-side (see Technical notes)
5. **Evidence From Transcript** — exact quote of the linked transcript chunk text (see Technical notes)
6. **What I'm Hearing** — `what_im_hearing`
7. **Likely True Intent** — `likely_true_intent`
8. **Emotional Signal** — `emotional_signal`
9. **Hidden Risk** — `hidden_risk`
10. **Recommended Question** — `recommended_question`
11. **Question To Avoid** — `question_to_avoid`
12. **Recommended Next Move** — `recommended_next_move` (keep existing pill styling)

Sequence number (`#001`) stays in the card header as today.

## Technical notes

The schema cannot change, so two of the required fields must be derived in the UI:

- **Evidence From Transcript**: build a `Map<chunkId, transcript_text>` from the already-loaded `chunks` query, then look up `insight.transcript_chunk_id`. Render as a blockquote-styled snippet. If no chunk is linked, render "—".
- **Confidence %**: not stored. Derive deterministically from `insight.id` (stable hash → 60–95% range) so the value is consistent across renders. Display as e.g. "82%".

Card title (`action_button`) is already persisted on every row, so no data work needed — just swap which field drives the title.

All other fields already exist on the `live_insights` row and only need to be reordered and conditionally rendered (skip empty values, matching today's behavior).

## Out of scope

- Server function `generateLiveInsight` and its mock generator
- The `ACTIONS` button list and click behavior
- Page layout, columns, brief panel, transcript panel
- Database schema, RLS, routing, auth

## Files touched

- `src/routes/_authenticated/calls.$id.live.tsx` (only)
