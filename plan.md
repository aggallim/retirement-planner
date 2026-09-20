# Plan — 008 dismissable warning banner

Implementation sequence for `spec/008-dismissable-warning-banner.md`. Branch-only
working file, deleted before this PR is marked ready.

1. `index.html` — persistence layer (near the existing `THEME_KEY` block,
   `index.html:776-792`): add `DISMISSED_WARNINGS_KEY` and a `DISMISSED`
   snapshot loaded once at module scope, following the same
   separate-from-`STORE_KEY` pattern as `THEME_KEY`.
2. `index.html` — `RetirementCalculator`: seed
   `const [dismissedWarnings, setDismissedWarnings] = useState(DISMISSED)`
   alongside the other `useState` seeds near the top of the component.
3. `index.html` — right after the `warnings` `useMemo`: add the
   `warningsDismissed` comparison and the `dismissWarnings` `useCallback`
   (depends on `warnings`, so must come after it's declared).
4. `index.html` — banner render: change the guard to
   `warnings.length > 0 && !warningsDismissed && ...` and add an `X` dismiss
   button (reusing the existing `X` icon component) inside the banner,
   wired to `dismissWarnings`.
5. `index.html` — `resetAll`: clear `DISMISSED_WARNINGS_KEY` before the
   reload.
6. `sw.js` — bump `CACHE` to `v9`.
7. `index.html` — add a `USER_CHANGELOG` entry versioned `v9`.
8. `docs/TOOL_DOCUMENTATION.md` — update §3.5/§3.6 (warnings section) and
   add a §8 build-history entry.
9. `CHANGELOG.md` — entry under today's date naming
   `intent/008-dismissable-warning-banner.md`.
10. Verify manually per spec §8 (trigger warnings, dismiss, reload, change
    inputs, reset, export/import) — no automated test covers this
    (`tests/test-engine.js` only exercises `projectJoint()`).
11. Move `intent/008-dismissable-warning-banner.md` and
    `spec/008-dismissable-warning-banner.md` into their `done/` dirs,
    `git rm plan.md`, push, mark PR ready for review.
