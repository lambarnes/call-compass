# Diagnosis: "Analyze Current Moment" does not exist in the codebase

## Evidence

I ran three exhaustive searches across the entire repo (excluding `node_modules`, `.git`, `dist`, generated files):

1. `rg "Analyze Current Moment|Analyze current moment|analyze_current_moment"` → **zero matches**
2. `rg -i "analyze"` → **zero matches**
3. `rg -i "current moment|analyze|seedAction|defaultAction|initialAction"` → **zero matches**

The only places `actionButton` / `generateLiveInsight` are wired are:

- `src/lib/ai.functions.ts` — `ACTION_BUTTONS` enum has the 8 correct labels.
- `src/routes/_authenticated/calls.$id.live.tsx` — `ACTIONS` array (lines 36–45) has the same 8 correct labels, and the only call site is line 111:
  ```ts
  await fnGenInsight({ data: { callId: id, actionButton: action, ... } });
  ```
  where `action` is mapped directly from the `ACTIONS` array via `.map((a) => ...)` at line 196.

There is no other caller, no default value, no seed action, no localStorage/IndexedDB seed, no hardcoded fallback. The string "Analyze Current Moment" is not present in any source file.

## Root cause

The error is coming from a **stale client bundle** running in the browser tab. The console log immediately preceding the ZodError is:

```
[vite] server connection lost. Polling for restart...
```

That means: the dev server restarted (with the new code), but the browser tab is still running the previous JS bundle which had the old label. When you click a button, it sends the old string over the wire to the new server, which correctly rejects it.

The server-side rejection is **proof the fix is deployed correctly** — the server enum is the new one. Only the browser's in-memory JS is stale.

## Fix (no code change needed)

**Hard-reload the preview tab**: Cmd/Ctrl + Shift + R (or close and reopen the preview). After that, every button click will send one of the 8 approved enum values and succeed.

## Optional hardening (only if you want it)

I can add a defensive guard in `calls.$id.live.tsx` so that if the runtime button label is ever not in the enum, we surface a clean toast instead of a 500. This does not change UI, schema, or routing — it only adds a client-side check before the RPC call. Tell me if you want this; otherwise no change is required.

## Output requested

- exact files changed: **none** (the codebase is already correct)
- exact old value found in source: **none** ("Analyze Current Moment" is not in the repo)
- exact new value used: the 8 labels already in `ACTION_BUTTONS` / `ACTIONS`
- action required from you: **hard-reload the browser preview**
