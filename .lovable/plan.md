
# Live Radar → Executive Discovery Cockpit (UI/IA Only)

Scope: presentation-only refactor of the right panel in `src/routes/_authenticated/calls.$id.live.tsx`. No backend, schema, AI logic, Supabase, or route changes. The 8 action buttons keep their existing `actionButton` values (untouched), only their visual grouping changes.

## Proposed Layout

Three-column shell stays the same (Brief | Transcript | Cockpit). The Cockpit column is restructured into 4 stacked zones:

```text
┌─────────────────────────────────────────┐
│ ZONE 1 — Call Status Card  (sticky top) │
│  Discovery Stage  ● Yellow              │
│  Primary Constraint: Ownership          │
│  Recommended Move:  Continue Discovery  │
│  Confidence: 82%                        │
├─────────────────────────────────────────┤
│ ZONE 2 — Action Buttons (4 groups, 2x)  │
│  Understanding | Discovery              │
│  Qualification | Control                │
├─────────────────────────────────────────┤
│ ZONE 3 — Latest Insight (hero card)     │
│  What I'm Hearing       (large)         │
│  Hidden Risk            (large)         │
│  Recommended Move       (pill)          │
│  Recommended Question   (large)         │
│  ▸ Evidence & analysis  (collapsed)     │
├─────────────────────────────────────────┤
│ ZONE 4 — ▸ Insight History (collapsed)  │
│  Timeline of prior insights, condensed  │
└─────────────────────────────────────────┘
```

### Zone 1 — Call Status Card (always visible, sticky)
Derived purely on the client from the most recent insight + brief context (no new fields):
- **Discovery Stage**: Green / Yellow / Red — mapped from latest insight's `risk_level`.
- **Primary Constraint**: short label from latest `hidden_risk` (truncated, first clause).
- **Recommended Move**: latest `recommended_next_move` rendered as a pill.
- **Confidence**: same deterministic % already shown today.
- Empty state before first insight: "Awaiting first signal — choose a lens below."

### Zone 2 — Grouped Action Buttons
Same 8 buttons, same `runAction(...)` values. Visual grouping only, via 4 small labeled clusters in a 2×2 grid:
- **Understanding**: What are they really saying? · What emotion or hesitation is showing?
- **Discovery**: What should I ask now? · Should I probe, pause, or close?
- **Qualification**: Is this a buying signal? · Is this a risk signal?
- **Control**: Am I moving too fast? · What should I avoid saying?

Group headers are 10px uppercase muted labels; buttons remain compact `outline` size-sm.

The center column's existing "Analyze Current Moment" sparkles button stays as-is (it routes through the legacy normalizer server-side).

### Zone 3 — Latest Insight (hero card)
Renders only the most recent insight, with 4 prominent fields:
1. What I'm Hearing
2. Hidden Risk
3. Recommended Move (pill)
4. Recommended Question

Typography is bumped up vs. today (text-sm → text-base for values; labels stay micro-caps). Risk badge + lens name move to a compact header strip.

A single `<Collapsible>` "Evidence & analysis" at the bottom of the card holds:
- Transcript Evidence (existing quoted chunk)
- Signal Type (if present on the insight)
- Risk Level (full label, not just badge)
- Any additional analysis fields the schema already returns

### Zone 4 — Insight History (collapsed by default)
A single `<Collapsible>` "Previous insights (N)" that expands into a condensed vertical timeline:
- One row per prior insight: `#003 · LENS · risk dot · Recommended Move (truncated)`
- Click a row to expand inline into the same 4-field mini layout (reusing Zone 3's renderer in compact mode).
- Latest insight is excluded from this list (it lives in Zone 3).

## Design Principles Applied
- Recommendation-first: Zone 1 + Zone 3 surface decisions before explanations.
- Progressive disclosure: evidence + signal metadata behind one click; history behind another.
- One-screen cockpit: Zones 1–3 fit above the fold on a 1080p laptop; only history requires expand.
- No new colors — reuses existing `risk-red/yellow/green` tokens and `primary` pill style.

## Files That Would Change
- `src/routes/_authenticated/calls.$id.live.tsx` — restructure right column into the 4 zones, add Zone 1 status card, regroup buttons, collapse evidence + history.
- (Optional, only if the cockpit file grows past ~350 lines) extract presentational helpers into:
  - `src/components/live/CallStatusCard.tsx`
  - `src/components/live/LatestInsightCard.tsx`
  - `src/components/live/InsightHistory.tsx`
  - `src/components/live/ActionButtonGroups.tsx`

No other files touched. No new dependencies (uses existing `Collapsible`, `Card`, `Badge`, `Button`, `ScrollArea`, lucide icons).

## Out of Scope (explicit)
- No changes to `src/lib/ai.functions.ts`, server functions, Zod enums, or DB.
- No new insight fields; Zone 1 is computed from existing fields on the client.
- No route, auth, or schema changes.
- No mockup screenshots in this plan — visual rendering will come during implementation. If you want rendered design directions first, say the word and I'll generate 3 cockpit variants before building.
