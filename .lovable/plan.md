## Goal

Make each of the 8 Live Call Radar buttons produce a clearly distinct analysis lens. Only `src/lib/ai.functions.ts` changes. Same insight card fields, same Zod shape, same DB columns, same UI, same routing, same schema.

## Scope

- File: `src/lib/ai.functions.ts`
- Function: `mockInsight(action, transcriptText)`
- No other files. No migrations. No UI/route/auth/schema changes.

## Approach

Replace the current shared `base` object + small `switch` overrides with a per-action builder. Each branch fully owns the 9 card fields so the lens is unmistakably different:

- `signal_type`
- `risk_level`
- `what_im_hearing`
- `likely_true_intent`
- `emotional_signal`
- `hidden_risk`
- `recommended_question`
- `question_to_avoid`
- `recommended_next_move`

Keep the existing seeded `risk` and `move` derivation so output still varies with transcript content, but each branch decides which fields lead and how the prose is framed.

### Per-button lens

1. **"What are they really saying?"** — `signal_type: "True intent"`. `likely_true_intent` and `hidden_risk` lead (true intent, hidden concern, internal politics, unstated decision issue). `what_im_hearing` references transcript snippet.

2. **"What should I ask now?"** — `signal_type: "Best next question"`. `recommended_question` leads with one specific question. `likely_true_intent` reframed as "why this question matters". `what_im_hearing` describes what a progress-signaling answer vs. risk-signaling answer would sound like. `hidden_risk` = risk-signal answer.

3. **"What emotion or hesitation is showing?"** — `signal_type: "Emotional signal"`. `emotional_signal` leads with hesitation/confidence/uncertainty/fear/caution/urgency/frustration/defensiveness varied by seeded `risk`. `what_im_hearing` cites tonal cues. `hidden_risk` = what the emotion is masking.

4. **"Is this a buying signal?"** — `signal_type: "Buying signal"`. `what_im_hearing` rates buying strength (weak/moderate/strong via seed). `likely_true_intent` covers commercial + budget + authority readiness. `recommended_next_move` = next-stage probability move. `hidden_risk` = what would kill the deal.

5. **"Is this a risk signal?"** — `signal_type: "Risk signal"`, `risk_level: "red"`. `hidden_risk` enumerates authority/budget/timeline/scope/decision-stall risks. `what_im_hearing` points to the specific risk surfacing. `recommended_next_move` = de-risk move.

6. **"Am I moving too fast?"** — `signal_type: "Pacing check"`. `what_im_hearing` judges whether caller has clarity. `likely_true_intent` calls out solutioning-too-early risk. `recommended_next_move: "Pause — do not push"` (or "Proceed — they're ready" when seed = green). `recommended_question` = a slow-down question.

7. **"Should I probe, pause, or close?"** — `signal_type: "Call-control move"`. `recommended_next_move` is one of probe / pause / confirm / move-to-next-step chosen from seed + risk. `what_im_hearing` justifies the choice. `recommended_question` matches the chosen move.

8. **"What should I avoid saying?"** — `signal_type: "Language to avoid"`. `question_to_avoid` leads with concrete phrasings (budget pressure, premature promises, scope commitments, trust-damaging language). `hidden_risk` = the resistance that bad phrasing triggers. `recommended_question` = the safer reframe.

### Implementation shape

Refactor `mockInsight` so the `switch` returns a fully-formed object per case (no shared `base` mutated after the fact). Keep helper for seeded `risk` and `move`. Default branch keeps current "What are they really saying?" behavior as fallback (defensive only — Zod enum already constrains input).

## Out of scope

- UI, routing, auth changes
- Schema / migration changes
- New fields on `live_insights`
- `generateAfterCallSummary` (untouched)

## Verification

After build, on `/calls/$id/live`:
1. Click each of the 8 buttons in sequence.
2. Confirm each rendered insight card leads with the field matching its lens (e.g. emotion button leads with emotional_signal copy; risk button shows red and enumerated risk types; avoid button shows concrete question_to_avoid phrasings).
3. Confirm rows in `live_insights` differ across buttons in `signal_type` and the lens fields.
4. No console / network 400s.

## Return after change

- files changed: `src/lib/ai.functions.ts`
- schema changes: no
- each button has distinct logic: yes (8 dedicated branches)
