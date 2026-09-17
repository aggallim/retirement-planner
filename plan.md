# Plan — 004 JSON import/export

Implementation sequence for `intent/004-json-import-export.md` /
`spec/004-json-import-export.md`. Working file only — deleted before this
PR merges (`CLAUDE.md` step 4 / `CONTRIBUTING.md` step 5).

## Current state (what this plan builds on)

- **Persistence** lives at `index.html` §"Persistence (localStorage)"
  (~line 657): `STORE_KEY = 'ukRetirementPlanner.v1'`, `loadSaved`,
  `saveState`, `clearSaved`, `pick(key, fallback)`.
- **The saved state shape** is exactly the object built in
  `RetirementCalculator`'s debounced auto-save effect (~line 1626–1644):
  `hasPartner, person1, person2, annualExpenses, healthcareCosts,
  mortgagePayment, mortgageYears, inflationRate, withdrawalRate`. This is
  also the export shape (intent point 2) — the two must stay in sync.
- **`migratePerson()`** (~line 1380, used at ~1596/1599) already maps an
  old single-ISA person shape onto the current sub-account shape on load.
  Import needs to run the same function, not a copy of it — an imported
  file can be just as stale as an old `localStorage` save.
- **Header controls** are a flex row at ~line 1868–1895: the "Saved"
  indicator span, the Reset button (`RotateCcw` icon, calls `resetAll` at
  ~line 1645 which does a `window.confirm` then `clearSaved()` +
  `window.location.reload()`), and the Add-a-partner/Couple toggle button.
- **Icons** are hand-written module-level inline SVG components (~line
  355–550: `Info, TrendingUp, PiggyBank, Home, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Wallet, Users, User, UserPlus, X, RotateCcw`),
  each `React.createElement('svg', {...}, ...)` with real Lucide path data.
  No `Download`/`Upload`/`Settings` (gear) icon exists yet.
- **`sw.js`** `CACHE` version needs bumping, as with any `index.html` change.

## Sequence

1. **Add three icon components** — `Download`, `Upload`, `Settings` (gear),
   module-level, immediately after the existing icon set (~line 550),
   matching their exact shape (`{ className } => React.createElement('svg',
   {...}, ...)`, real Lucide path data, same prop contract as `RotateCcw`).

2. **Export/import helpers**, added to the Persistence section (~after line
   678), next to `loadSaved`/`saveState`/`clearSaved`/`pick`:
   - `SCHEMA_VERSION = 1`.
   - `exportPlan(state)` → `{ schemaVersion: SCHEMA_VERSION, ...state }` →
     `JSON.stringify` → `Blob` (`type: 'application/json'`) → a temporary
     `<a download="retirement-plan-YYYY-MM-DD.json">` via
     `URL.createObjectURL`, click it, then revoke the URL. Date from
     `new Date()`, ISO date portion only.
   - `validatePlanShape(parsed)` → `true` only if `parsed` is a non-null
     object and not an array (spec point 5's "not garbage" bar — no
     per-field checks here).
   - `importPlanFields(parsed)` → picks each of the nine known state keys
     off `parsed` when present, leaves the rest `undefined` for the caller
     to fall back on. Unknown keys in `parsed` are simply never read — that
     *is* the "ignored" half of the per-field tolerance, no explicit
     rejection needed.

3. **New `SettingsMenu` component** — module-level, memoised (same
   convention as `SliderWithInput`/`PersonInputs`, §5.3), defined before
   `RetirementCalculator`. Props: `onExport()`, `onImport(parsedJson)`.
   - Owns its own open/closed popover state locally (`useState`) — this is
     transient UI state, not app data, so it doesn't need to live in
     `RetirementCalculator` or be persisted.
   - **Export row**: the spec's warning line, shown as static text
     whenever the panel is open (not a dismissible/acknowledged banner —
     spec's resolved decision) + an Export button calling `onExport`.
   - **Import row**: a visible button triggering a hidden
     `<input type="file" accept="application/json">`. `onChange` → read via
     `FileReader` → `JSON.parse` → `validatePlanShape`. Invalid → inline
     error text in the panel, current plan untouched, no further action.
     Valid → `window.confirm('This will replace your currently saved plan
     on this device — continue?')` (mirrors `resetAll`'s existing
     `window.confirm` pattern at ~line 1646 for UI consistency) → declined
     is a no-op → confirmed calls `onImport(parsed)`.

4. **Wire into `RetirementCalculator`** (~line 1594 on):
   - `handleExport`, `useCallback`, calls `exportPlan` with the exact same
     nine-field object as the auto-save effect (~line 1628) — comment
     noting the two must be kept in sync.
   - `handleImport`, `useCallback(parsed => {...}, [])`: runs
     `importPlanFields(parsed)`, then for each of the nine fields, sets it
     from the imported value if present, otherwise **leaves current state
     untouched** (not reset to app defaults — per-field tolerance means
     "missing → don't change that field," consistent with a partial/older
     export not wiping fields it never had). `person1`/`person2` go through
     `migratePerson()` on the way in, same as initial load.
   - Render `<SettingsMenu onExport={handleExport} onImport={handleImport}
     />` in the header button row (~1868–1895), alongside Reset and
     Add-a-partner — a new control, not folded into the existing Reset
     button, per the confirmed "new settings/data menu" decision.

5. **Bump `sw.js`'s `CACHE` version** by one.

## Manual verification

Spec explicitly expects no new `tests/test-engine.js` cases — this isn't an
engine change (`projectJoint()` untouched). Verify by hand instead:

- [ ] Export → open the downloaded file → `schemaVersion` present, every
      field matches on-screen state.
- [ ] Export → Reset → Import the just-exported file → restored plan
      matches the original exactly (the round trip the spec calls for).
- [ ] Import a file missing several fields → those fields keep their
      current values, no crash.
- [ ] Import a file with extra/unknown fields (simulated future schema) →
      silently ignored, no crash.
- [ ] Import non-JSON / a JSON array / a bare JSON string → rejected with a
      clear inline error, current plan untouched.
- [ ] Import a hand-crafted old single-ISA-shape export → `migratePerson()`
      runs on import, not just on initial `localStorage` load.
- [ ] Couple-mode round trip: export with `hasPartner: true`, reset,
      import → couple mode and both people's figures restore correctly.
- [ ] `node --check` (or equivalent) on the extracted script after edits —
      no build step to otherwise catch a syntax error.
- [ ] Visual pass in a browser: menu opens/closes, warning text visible
      before export, confirm dialog blocks import until accepted, no
      console errors.

## Docs updates (same PR, per `CLAUDE.md`)

- `docs/TOOL_DOCUMENTATION.md` §3 — new subsection documenting the
  Export/Import controls, the pre-export warning, and the
  confirm-before-overwrite import behaviour.
- §7 — revise limitation #9 ("Device-local storage…") to note manual
  export/import now bridges devices (sync still isn't automatic); remove
  the now-implemented "Export and import a plan as JSON…" line from
  "Possible future additions".
- §8 — new Build history entry: the `schemaVersion` field, the
  per-field-tolerant import design, and why the warning shows on every
  export rather than once (spec's resolved decision).
- `CHANGELOG.md` — new dated entry naming `intent/004`.

## Explicitly out of scope (intent/spec Non-goals — don't drift into these)

No merge-import, no live cross-device sync, no encryption/password/redaction
on the exported file, no drag-and-drop import, no concrete schema-migration
transform (only the `schemaVersion` field itself).
