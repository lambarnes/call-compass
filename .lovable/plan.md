## Plan

Update only `src/lib/ai.functions.ts` to add server-side backward compatibility for legacy `actionButton` strings.

## Changes

1. Add a small normalization helper near `ACTION_BUTTONS`:
   - `"Analyze Current Moment"` → `"What are they really saying?"`
   - `"What Are They Really Saying?"` → `"What are they really saying?"`
   - `"Suggest A Smarter Question"` → `"What should I ask now?"`
   - `"Detect Buying Signal vs Stall"` → `"Is this a buying signal?"`
   - `"Risk / Red Flag Check"` → `"Is this a risk signal?"`

2. Apply that helper inside `generateLiveInsight.inputValidator(...)` before the Zod enum parse, so legacy values are converted before enum validation runs.

3. Keep the existing Zod enum and processing logic unchanged after normalization.

## What will not change

- No UI changes
- No schema changes
- No auth changes
- No routing changes
- No redesign

## Verification

Confirm the validator now accepts the five legacy labels by normalizing them into approved enum values, while still rejecting any truly unknown action labels.