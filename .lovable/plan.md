## Copy Consistency Fixes

1. Replace all "Live Call Radar" with "Call Compass" in:
   - `src/routes/__root.tsx` (title, og:title, twitter:title)
   - `src/routes/auth.tsx` (header logo text)
   - `src/components/app-sidebar.tsx` (sidebar logo text)
   - `src/styles.css` (comment only — optional, not user-facing)

2. Replace app meta description in `src/routes/__root.tsx`:
   - Remove "Zoom-native live call intelligence..."
   - Use: "Call Compass helps advisors, consultants, and revenue leaders prepare for calls, analyze conversation signals, and generate better follow-up."
   - Update `description`, `og:description`, and `twitter:description`.

No schema changes, no route changes, no Zoom integration logic changes.