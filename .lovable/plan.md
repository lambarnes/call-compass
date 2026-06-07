## Root cause

`src/lib/ai.functions.ts` validates `actionButton` against a Zod enum (`ACTION_BUTTONS`) listing the old 8 labels. The UI now sends the 8 renamed labels, so every button click fails Zod validation before `generateLiveInsight` can insert into `live_insights`.

## Fix (one file)

`src/lib/ai.functions.ts`:

1. Replace `ACTION_BUTTONS` array with the 8 current UI labels (exact strings):
   - "What are they really saying?"
   - "What should I ask now?"
   - "What emotion or hesitation is showing?"
   - "Is this a buying signal?"
   - "Is this a risk signal?"
   - "Am I moving too fast?"
   - "Should I probe, pause, or close?"
   - "What should I avoid saying?"

2. Update the `switch (action)` block in `mockInsight` to key off the new labels so per-action variation still applies:
   - "Is this a buying signal?" → buying-signal variant
   - "Is this a risk signal?" → risk/red-flag variant
   - "Am I moving too fast?" → pacing/authority-style variant
   - "Should I probe, pause, or close?" → next-best-move variant
   - "What should I avoid saying?" → question-to-avoid emphasis
   - "What emotion or hesitation is showing?" → emotional-signal emphasis
   - "What should I ask now?" → recommended-question emphasis
   - "What are they really saying?" → default (likely true intent)

No changes to the Zod shape, handler logic, DB insert columns, UI, routing, auth, or schema. `action_button` column already stores free text.

## Out of scope

- No UI changes
- No routing/auth changes
- No schema/migration changes
- No new fields

## Verification

After build, click each of the 8 buttons on `/calls/$id/live`:
1–8. Each call to `generateLiveInsight` passes Zod, returns an insight, and a new row appears in `live_insights` with `action_button` = the clicked label. Confirm no console/network 400s.
