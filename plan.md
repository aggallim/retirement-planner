# Plan — 012 explorable assumptions panel

Implements `spec/012-assumptions-panel.md` (intent:
`intent/012-assumptions-panel.md`). Work `index.html` as generated JS
(`React.createElement`), not JSX — see `CLAUDE.md`. Push each numbered
step (or small group of steps) as its own commit as you go, not one
batched commit at the end — PR #15 is open and should show live progress
(`CONTRIBUTING.md` step 6).

Line numbers below were verified against the current `index.html` at plan
time; re-check them as you go since earlier steps shift later ones.

## Implementation sequence

1. **`scrollAndHighlight()` helper** (spec §1). Add near `planSucceeds`
   (currently `index.html:1910+`, module level, after
   `findSupportableDelta`'s definitions) — pure function, no props/refs.
   Verify: no syntax errors, function unused so far (fine).

2. **Highlight CSS** (spec §1). Add to the existing inline `<style>`
   block (`index.html:2392+`, right after the `@import`/`*` rules) —
   `.assumption-highlight` keyframes + `.dark .assumption-highlight`
   variant, exactly as given in the spec.

3. **DOM anchor ids** (spec §2) — do this before step 5 so the panel has
   real targets to test against as it's built. All are additive
   `id`-bearing wrapper `<div>`s or an `id` prop added to an existing
   wrapper; no other structural change.
   - a. `PersonInputs` (`index.html:1106-1293`): add a `personKey` prop
     to its destructured params.
   - b. Wrap Retirement Age slider (`1126-1134`) in
     `React.createElement("div", { id: \`assumption-retirement-age-${personKey}\` }, ...)`.
   - c. Wrap Life Expectancy slider (`1135-1142`) similarly with
     `assumption-life-expectancy-${personKey}`.
   - d. Wrap the pension `GrowthProfile` (`1232-1237`) similarly with
     `assumption-return-${personKey}`.
   - e. Wrap the State Pension (Annual) slider (`1263-1273`, NOT the
     State Pension Age slider above it) similarly with
     `assumption-state-pension-${personKey}`.
   - f. At both `PersonInputs` call sites, add the prop: `personKey: 'p1'`
     (`index.html:2693-2699`) and `personKey: 'p2'` (`2720-2726`).
   - g. Shared Annual Expenses slider (`2748-2757`, in "Living Costs"):
     wrap in `React.createElement("div", { id: "assumption-spending" }, ...)`.
   - h. Shared Inflation Assumption block: its existing outer
     `React.createElement("div", null, ...)` at `index.html:2793` becomes
     `React.createElement("div", { id: "assumption-inflation" }, ...)` —
     no new wrapper, just add the `id`.
   - i. "Assumptions & Disclaimers" outer card (`index.html:2920-2921`,
     the always-rendered container): add `id: "assumptions-disclaimers"`
     to its existing `className` object.
   - Verify: app still renders, no console errors, existing spacing
     (`space-y-*`) unaffected — each wrap adds one nesting level around a
     single child only.

4. **Hoist `nameAtAge` / add `nameValue`** (spec §3 formatting helpers).
   - a. Add `nameAtAge` and `nameValue` as module-level consts near
     `scrollAndHighlight` (step 1's location).
   - b. In `VerdictHero` (`index.html:1616-1695`), delete its local
     `nameAt` (currently `index.html:1649`) and change its two call
     sites (`currentAges`, `supportableAges`, `1650-1651`) to call
     `nameAtAge(name, age, isCouple)` instead of `nameAt(name, age)`.
   - Verify: `VerdictHero`'s rendered headline text is byte-identical to
     before (this is a pure refactor, not a copy change) — spot-check
     individual mode and couple mode.

5. **Build `AssumptionsPanel`** (spec §3). Add directly after
   `VerdictHero`'s definition (`index.html:1695+`), as a `memo(function
   AssumptionsPanel({...}) {...})` per `CLAUDE.md` §5.3 (module-level,
   memoised, alongside `SliderWithInput`/`PersonInputs`/`CustomTooltip`/
   `WealthChart`/`IncomeChart`/`VerdictHero`).
   - Props exactly as spec §3's signature.
   - Container: `id: "assumptions-panel"`, same wrapper className as
     `VerdictHero` (`"mb-8 bg-white rounded-xl shadow-lg p-6 border
     border-slate-200"`).
   - Heading "Your projection assumes..." + subtitle "Click any figure to
     jump to where it's set."
   - Six rows in roadmap order: Return, Inflation, Retirement age, Life
     expectancy, Spending, State Pension — exact copy/anchors/tooltip per
     spec §3's numbered list. Each clickable value is a `<button
     type="button">` with the given Tailwind classes, `onClick: () =>
     scrollAndHighlight(anchorId)`. Couple mode: two buttons per
     per-person row separated by a plain `", "` text node; individual
     mode: one value, no name prefix (via `nameAtAge`/`nameValue`'s own
     `isCouple` branch).
   - Footer button "See full assumptions & disclaimers ↓",
     `onClick: onShowFullAssumptions`.
   - Verify: component compiles standalone (no `d`/state leakage — it
     only reads props).

6. **Wire into `RetirementCalculator`** (spec §4).
   - a. Add `jumpToFullAssumptions` `useCallback` (calls
     `setShowAssumptions(true)` then `scrollAndHighlight('assumptions-disclaimers')`),
     placed near `showAssumptions`'s declaration (`index.html:2113`) or
     alongside the render method — wherever the file's other
     `useCallback` handlers live.
   - b. Render `<AssumptionsPanel ... />` directly after `<VerdictHero
     ... />` (`index.html:2564-2576`) and before the summary card row
     (`2576+`), passing all props from `d` (deferred values) exactly as
     spec §4's JSX block — not from raw `person1`/`person2`/
     `inflationRate`/`annualExpenses` state.
   - Verify: panel appears between headline and summary cards in both
     layouts; six lines populate with real figures on load.

7. **Repoint `VerdictHero`'s caveat** (spec §5). Change the caveat `<p>`
   (`index.html:1692-1694`) so "Assumptions panel" becomes a `<button
   type="button" onClick={() => scrollAndHighlight('assumptions-panel')}
   className="underline hover:text-slate-700">` per spec §5's JSX, rest
   of the sentence unchanged. No new prop on `VerdictHero`.

8. **`sw.js` cache bump** (spec §9). `CACHE = 'retirement-planner-v10'` →
   `'retirement-planner-v11'` (`sw.js:2`).

9. **`docs/TOOL_DOCUMENTATION.md` §3.4 update** (spec §6). In §3.4
   (currently `docs/TOOL_DOCUMENTATION.md:101-108`), insert a new bullet
   after "Supportable retirement age" and before "Summary cards"
   describing the new panel: the six lines in roadmap order (return as
   pension growth rate, inflation, retirement age, life expectancy,
   spending, State Pension), that each is clickable through to where
   it's set with scroll-and-brief-highlight, and the panel's own link
   down to "Assumptions & Disclaimers". Add one clause to the existing
   headline-caveat bullet noting "the Assumptions panel" is now that
   clickable link, not prose. Leave §3.3, §5.4 and §7 unchanged (spec §6
   confirms no verification-checklist or known-limitations change is
   needed).

10. **`CHANGELOG.md` entry** (spec §7). New entry under a heading dated
    the day this PR merges, naming `intent/012-assumptions-panel.md` /
    `spec/012-assumptions-panel.md`, covering: the new panel, its six
    lines and scroll-and-highlight click-through, the caveat repoint,
    and that no calculation logic changed. Match the existing entries'
    style/detail level (see the 011 entry immediately above it).

11. **`USER_CHANGELOG` entry** (spec §7, user-facing). Add to
    `USER_CHANGELOG` in `index.html` (near `PERSISTED_FIELDS`,
    currently starting `index.html:853`), as the new first (newest)
    entry, `version: 'v11'`, dated the day this merges, using the
    draft title/copy given in spec §7 verbatim (or lightly polished,
    keeping register/length consistent with the `v10` entry above it).

12. **Run tests** (spec §8 / lifecycle step 6). `node
    tests/test-engine.js` from repo root — expect it to still pass with
    no new cases (no `projectJoint()`/`findSupportableDelta()` change in
    this requirement). If it fails, something leaked into calculation
    code that shouldn't have — investigate before proceeding.

13. **Manual verification in a browser** (spec §8) — actually check each
    of these, don't skip:
    - [ ] Each of the six lines shows the value matching its input
      field, in both individual and couple mode, after editing that
      field (once the `useDeferredValue` lag settles).
    - [ ] Clicking a line's value smooth-scrolls to the correct input
      card and it visibly highlights briefly — on both the desktop
      multi-column layout and the mobile stacked layout.
    - [ ] Clicking the same value twice in quick succession restarts the
      highlight (doesn't no-op on the second click).
    - [ ] `VerdictHero`'s caveat "Assumptions panel" link scrolls to and
      highlights `AssumptionsPanel` itself.
    - [ ] `AssumptionsPanel`'s "See full assumptions & disclaimers ↓"
      button expands the bottom section (if collapsed) and scrolls
      to/highlights it — check both when it starts collapsed and when
      it's already expanded.
    - [ ] Highlight is visibly legible in both light and dark mode.
    - [ ] Individual mode renders only `p1` lines/anchors — no broken
      links or console errors from a nonexistent `p2` target.
    - [ ] Existing "Assumptions & Disclaimers" section content and its
      expand/collapse behaviour are otherwise unchanged.

14. **Cleanup, same PR** (lifecycle step 9 / `CLAUDE.md`):
    - `git mv intent/012-assumptions-panel.md intent/done/`
    - `git mv spec/012-assumptions-panel.md spec/done/`
    - `git rm plan.md`

15. **Mark PR #15 ready for review** once steps 1–14 are pushed (update
    the PR body's "Status" line first if it's still tracking an earlier
    stage).

## Notes

- Steps 1–2 (helper + CSS) and step 3 (anchors) have no ordering
  dependency between them, but both must land before step 5
  (`AssumptionsPanel`) and step 6 (wiring), since those reference the
  anchor ids and call `scrollAndHighlight`. Step 4 (hoisting
  `nameAtAge`) must land before step 5 too, since `AssumptionsPanel`
  calls it.
- Step 7 (caveat repoint) only depends on step 1 (`scrollAndHighlight`
  existing) and step 5 (`assumptions-panel` id existing on the new
  panel's container) — do it after step 6 so the target it points at
  already renders.
- Steps 8–11 (cache bump, docs, changelogs) can happen any time after
  the behaviour they describe is implemented (steps 1–7) — no strict
  ordering among themselves, but all must land before step 15.
- No `PERSISTED_FIELDS` change anywhere in this requirement (spec
  non-goals) — don't add one.
