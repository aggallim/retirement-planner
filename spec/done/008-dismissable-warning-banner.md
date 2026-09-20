# 008 — Dismissable warning banner

## Status

Resolved — ready for implementation. Fleshed out from
`intent/008-dismissable-warning-banner.md`; the intent left no open
decisions, so this spec is about the concrete mechanics only.

## Problem

See `intent/008-dismissable-warning-banner.md`. Relevant code today:

- `warnings` (`index.html:2041-2056`) — a `useMemo` recomputing the list of
  active warning strings from `d.p1`/`d.p2`/`household`/`longevity` on every
  relevant input change. Pure, derived, no dismiss state.
- The banner itself (`index.html:2189-2198`) — rendered whenever
  `warnings.length > 0`, listing every string in `warnings` with an
  `AlertTriangle` icon (`index.html:411-421`).
- Persistence (`index.html:700-718`) — a single `localStorage` key,
  `STORE_KEY = 'ukRetirementPlanner.v1'`, written by the debounced auto-save
  effect (`index.html:1852-1870`) with exactly the fields in
  `PERSISTED_FIELDS` (`index.html:727`), and cleared by `resetAll`
  (`index.html:1871-1875`, via `clearSaved()`).
- An `X` icon component already exists (`index.html:523+`) and can be
  reused for the dismiss control without adding a new icon.

## Outcome

### 1. New, separate localStorage key — not part of `PERSISTED_FIELDS`

Add a second key alongside `STORE_KEY`:

```js
const DISMISSED_WARNINGS_KEY = 'ukRetirementPlanner.dismissedWarnings.v1';
```

Deliberately **not** added to `PERSISTED_FIELDS` and **not** folded into the
`STORE_KEY` blob — `PERSISTED_FIELDS` is "what's in a plan" (read by
autosave, `exportPlan`, and `importPlanFields` alike per the comment at
`index.html:724-726`); dismissal is device-local UI state, not plan data,
per the intent's resolved non-goal. Keeping it in its own key means
`exportPlan`/`importPlanFields` need zero changes to stay correct — they
simply never see it.

### 2. Dismiss state, keyed to the exact warning set

On mount, read the stored snapshot once:

```js
const DISMISSED = (() => {
  try {
    const raw = localStorage.getItem(DISMISSED_WARNINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();
```

In the component, track dismissal as state seeded from that snapshot:

```js
const [dismissedWarnings, setDismissedWarnings] = useState(DISMISSED);
```

Compare the live `warnings` array against the snapshot to decide whether to
render the banner — order-sensitive is fine since `warnings` is built in a
fixed, deterministic order (`index.html:2041-2056`) for a given input set,
so two equal warning sets always produce the same array:

```js
const warningsDismissed = dismissedWarnings !== null &&
  JSON.stringify(dismissedWarnings) === JSON.stringify(warnings);
```

Replace the banner's render condition
(`warnings.length > 0 && ...`, `index.html:2189`) with
`warnings.length > 0 && !warningsDismissed && ...`.

### 3. Dismiss control

Add an `onClick` handler, memoised with `useCallback` per `CLAUDE.md` §5.3:

```js
const dismissWarnings = useCallback(() => {
  setDismissedWarnings(warnings);
  try {
    localStorage.setItem(DISMISSED_WARNINGS_KEY, JSON.stringify(warnings));
  } catch {}
}, [warnings]);
```

Add a small `X` button (reusing the existing `X` icon component) inside the
banner (`index.html:2189-2198`), e.g. absolutely positioned top-right of the
`bg-red-50 border-l-4 ...` container, `aria-label="Dismiss warnings"`,
`onClick={dismissWarnings}`. No new subcomponent needed — this stays inline
in the same top-level component the banner already renders in, same as the
rest of that JSX.

### 4. Reappearing when the warning set changes

No extra code needed beyond §2's comparison: if any input change alters
`warnings` (a figure changes, a warning is added or removed), `warnings`
recomputes to a different array, `JSON.stringify(dismissedWarnings) ===
JSON.stringify(warnings)` goes false, and the banner reappears automatically
on the next render. `dismissedWarnings` itself is never recomputed from
inputs — it only changes via `dismissWarnings` (dismiss) or `resetAll`
(clear, below).

### 5. Reset clears dismissal

`resetAll` (`index.html:1871-1875`) already calls `clearSaved()` then
reloads the page. Add a call to remove the new key too, before the reload:

```js
const resetAll = useCallback(() => {
  if (!window.confirm('Reset all figures back to defaults? Your saved plan will be cleared.')) return;
  clearSaved();
  try {
    localStorage.removeItem(DISMISSED_WARNINGS_KEY);
  } catch {}
  window.location.reload();
}, []);
```

(A full page reload also re-seeds `DISMISSED` from the now-cleared key, so
even without the explicit `removeItem` the *next* load would show
`dismissedWarnings = null` — but clearing it explicitly keeps `resetAll`
self-contained and avoids relying on reload-as-cleanup.)

### 6. `docs/TOOL_DOCUMENTATION.md` updates

- §3.5 ("Warnings", `docs/TOOL_DOCUMENTATION.md:109-117`) gets a line noting
  the banner can be dismissed via its close control, persists dismissed
  across reloads, and reappears if the active warning set changes.
- §3.6 or a new note near it should mention dismissal is cleared by
  ↺ Reset, alongside the rest of the saved plan.
- Worth a short note distinguishing this from the *other* dismiss-like
  warning already documented at §7 (`docs/TOOL_DOCUMENTATION.md:390`, "The
  pre-export warning shows every time, not once ... deliberately not gated
  behind a `localStorage` 'seen it' flag") — that one is a data-handling
  caution shown to whoever has the Data panel open, potentially not the
  same person who dismissed it before; this one is a planning-condition
  banner aimed at the person actively building their own plan, which is a
  different risk profile and the reason a persistent per-set dismiss is
  appropriate here but wasn't there. §7 itself doesn't need to change, since
  the reasoning it already gives still holds for that unrelated warning.
- §8 (Build history) gets a new entry once implemented, per `CLAUDE.md`.
- No changes to §4 (financial technicals) or §5.4 (verification checklist)
  — `projectJoint()` is untouched.

### 7. `CHANGELOG.md` and `USER_CHANGELOG`

- `CHANGELOG.md` entry under the date this merges, naming
  `intent/008-dismissable-warning-banner.md`.
- `USER_CHANGELOG` entry in `index.html` (user-facing — the banner's
  behaviour visibly changes), versioned with whatever `sw.js` `CACHE` value
  this PR bumps to.

### 8. Verification

No automated test covers this (`tests/test-engine.js` only exercises
`projectJoint()`, which this doesn't touch). Verify manually per
`CLAUDE.md`'s "No build step" guidance:

- Trigger at least two different warnings (e.g. a State Pension gap and
  income below the PLSA minimum), dismiss, confirm the banner disappears
  immediately.
- Reload the page — banner stays hidden.
- Change an input so the warning set differs (e.g. close the State Pension
  gap by raising retirement age) — banner reappears with the new set.
- Dismiss again, then click ↺ Reset and confirm — banner is visible again
  (plan back to defaults, whatever warnings defaults trigger, if any).
- Confirm Export plan's downloaded JSON contains no dismissal-related key,
  and that Import plan doesn't touch `DISMISSED_WARNINGS_KEY`.

## Non-goals

Carried over unchanged from `intent/008-dismissable-warning-banner.md`:

- No per-warning-line dismissal.
- No change to warning conditions, wording, or thresholds.
- No snooze/mute-for-N-days mechanic.

## Constraints

Carried over from the intent, made concrete above:

- `SliderWithInput`, `PersonInputs`, `CustomTooltip`, `WealthChart` and
  `IncomeChart` stay module-level and memoised, per `CLAUDE.md` §5.3 — this
  change adds no new subcomponent, so no new risk there.
- Single-file PWA constraint holds; bump `CACHE` in `sw.js` on ship.
- `docs/TOOL_DOCUMENTATION.md` §8, `CHANGELOG.md`, and a `USER_CHANGELOG`
  entry all land in the same PR, per `CLAUDE.md`.
- Per the lifecycle, this PR also moves
  `intent/008-dismissable-warning-banner.md` and this spec file into
  `intent/done/` / `spec/done/` once implemented and merged, and removes
  `plan.md`.

## Open questions

None — the intent left nothing open.
