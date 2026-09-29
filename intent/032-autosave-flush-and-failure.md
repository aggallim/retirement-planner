# 032 — Reliable autosave: flush on exit and report failures

## Status

Bug report from the UI/UX review of 2026-09-29 (Notion: "UI/UX Form &
Data-Entry Review", P0). Decisions settled by grilling with the owner on
2026-09-29. Ships with 030 and 031 as one release.

## What's broken

Two ways a user can lose or misjudge saved data:

1. **Last edit lost.** Autosave waits 600ms after the last change. If the
   tab is closed or backgrounded and killed (common on mobile) inside that
   window, the final edit is never written. There is no `pagehide` or
   `visibilitychange` flush.
2. **"Saved" can be wrong.** Storage errors (quota, private mode, disabled
   storage) are swallowed by `try/catch`, yet the header still flashes
   "Saved".

Also, in the autosave effect the `clearTimeout(h)` cleanup is returned from
inside the `setTimeout` callback, so it never runs; the "Saved" timer can
fire after unmount.

## Resolved decisions

- **Flush:** on `pagehide` and `visibilitychange` to hidden, save
  immediately if a save is pending. Keep the 600ms debounce otherwise.
- **Failure state:** `saveState` returns success/failure. On failure, show a
  persistent (not flashing) header message, "Not saved on this device —
  export a backup", linking to the Data menu's Export. It clears on the next
  successful save. "Saved" only appears on success.
- **Startup:** no probe write on load; the notice appears only after a
  save actually fails.
- **Cleanup fix:** move the "Saved" timer into its own effect with proper
  cleanup.
- **Out of scope:** multi-tab `storage` events, undo for reset,
  `navigator.storage.persist()` (P2, separate).
- **Storage format:** unchanged; no migration.

## Delivery

`index.html` (autosave effect, `saveState`, header status);
`docs/TOOL_DOCUMENTATION.md` §3.6; `CHANGELOG.md`; `USER_CHANGELOG`
(user-facing); `sw.js` cache and `APP_VERSION` bump. Tests: extend
`tests/test-engine.js` only if `saveState` is testable without a DOM;
otherwise verify manually by editing then closing the tab within 600ms, and
by forcing a storage failure (throwing `setItem`).
