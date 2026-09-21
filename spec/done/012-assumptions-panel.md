# 012 — Explorable assumptions panel

## Status

Resolved — ready for implementation. Fleshed out from
`intent/012-assumptions-panel.md`, whose grilling interview left no open
branches; this spec is about concrete mechanics only.

## Problem

See `intent/012-assumptions-panel.md`. Relevant code today:

- `VerdictHero` (`index.html:1616-1695`) — the "Can I retire?" headline
  (`spec/done/011-can-i-retire-headline.md`). Its final line
  (`index.html:1692-1694`) is a plain, non-interactive `<p>` ending "...see
  Known limitations in the Assumptions panel." — `"the Assumptions panel"`
  is prose only, not a link, per 011's own note that "if the Assumptions
  panel doesn't already surface known limitations, a plain
  non-interactive caveat line is sufficient."
- `VerdictHero`'s internal `nameAt` helper (`index.html:1649`):
  `(name, age) => isCouple ? \`${name} at ${age}\` : \`age ${age}\`` — the
  couple-mode age-formatting convention this spec reuses.
- `PersonInputs` (`index.html:1106-1293`) — one shared, memoised component
  rendered once per person (`index.html:2693-2699` for person1,
  `2720-2726` for person2). Relevant fields inside it: Retirement Age
  slider (`1126-1134`), Life Expectancy slider (`1135-1142`), the pension
  `GrowthProfile` (`1232-1237`), State Pension Age slider (`1255-1262`)
  and State Pension (Annual) slider (`1263-1273`). None of these carry a
  DOM `id` today.
- `GrowthProfile` (`index.html:970-987`) — shared between all four account
  types (Cash ISA, Stocks & Shares ISA, LISA, Pension) per person; no
  `id`/anchor concept exists.
- Shared (non-per-person) fields: Annual Expenses
  (`index.html:2748-2757`, inside the "Living Costs" card) and the
  Inflation Assumption button group (`index.html:2793-2810`, inside the
  "Inflation & Risk" card, itself wrapped in a plain
  `React.createElement("div", null, ...)` at `2793`).
- The "Assumptions & Disclaimers" card (`index.html:2920-2950`) — a
  `showAssumptions`/`setShowAssumptions` (`index.html:2113`)
  collapsed-by-default section. Its outer container
  (`index.html:2920-2921`, `bg-white rounded-xl shadow-lg border
  border-slate-200 overflow-hidden`) always renders, regardless of
  `showAssumptions`; only the inner detail block
  (`index.html:2930-2950`) is conditional. No `id` on either.
- `VerdictHero` is rendered at `index.html:2564-2576`, directly above the
  summary card row (`2576+`) that decision 4 of 011 already demoted to
  "below the hero."
- `d` (`index.html:2246-2262`) holds the `useDeferredValue`-wrapped inputs
  actually driving `projections`/`verdict`/`longevity` — `d.p1`, `d.p2`,
  `d.infl`, `d.exp` etc. — distinct from the raw, un-deferred
  `person1`/`person2`/`inflationRate`/`annualExpenses` state that
  `PersonInputs`/the sliders themselves read and write.
- `formatCurrency` and the `tooltip-trigger`/`tooltip-content` CSS classes
  (used by `SliderWithInput`'s own `Info` tooltip, `index.html:931-936`)
  already exist and are reused, not reinvented.
- `USER_CHANGELOG` (`index.html:853-893`) and `sw.js`'s `CACHE`
  (`sw.js:2`, currently `'retirement-planner-v10'`) are at `v10`,
  matching the `intent/done/011` ship.

## Outcome

### 1. `scrollAndHighlight()` — module-level, stateless scroll+highlight helper

Placed near the other small module-level helpers (alongside `planSucceeds`/
`findSupportableDelta`, `index.html:1911+`), **not** inside any component —
it closes over nothing and needs no props, refs or component state:

```js
// Scroll+highlight for any assumption anchor (spec/012-assumptions-panel.md
// decision 4). Pure DOM: getElementById + a CSS animation class, restarted
// on repeat clicks via a forced reflow. No React state needed — this is
// the "plain refs/DOM ids are enough for a single-file app" case the
// intent's constraints call out.
function scrollAndHighlight(anchorId) {
  const el = document.getElementById(anchorId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('assumption-highlight');
  void el.offsetWidth; // restart the animation if the same target is clicked again quickly
  el.classList.add('assumption-highlight');
}
```

CSS (added to the existing inline `<style>` block, `index.html:2380+`,
alongside the other hand-written dark-mode overrides per
`spec/done/010-dark-mode.md` decision 1):

```css
@keyframes assumption-highlight-flash {
  0% { background-color: rgba(37,99,235,.18); box-shadow: 0 0 0 3px rgba(37,99,235,.35); }
  100% { background-color: transparent; box-shadow: 0 0 0 3px rgba(37,99,235,0); }
}
.assumption-highlight { animation: assumption-highlight-flash 1.6s ease-out; border-radius: 0.75rem; }
.dark .assumption-highlight { animation-name: assumption-highlight-flash-dark; }
@keyframes assumption-highlight-flash-dark {
  0% { background-color: rgba(96,165,250,.18); box-shadow: 0 0 0 3px rgba(96,165,250,.35); }
  100% { background-color: transparent; box-shadow: 0 0 0 3px rgba(96,165,250,0); }
}
```

Because the trigger is a global `id` lookup, no ref plumbing or context is
needed between `AssumptionsPanel` (§3) and the input cards it targets —
consistent with the intent's constraint that this needs "no new state
library," just DOM ids.

### 2. DOM anchors — ten `id`s added to existing cards

A small, additive wrap around six existing elements (four inside
`PersonInputs`, doubled per person; two shared) — no restructuring of
`PersonInputs` or the account components themselves:

- `PersonInputs` gains one new prop, `personKey` (`'p1'` or `'p2'`),
  passed at both call sites (`index.html:2693-2699`, add `personKey:
  'p1'`; `2720-2726`, add `personKey: 'p2'`). It's used only to build
  anchor ids — no other behaviour changes.
- Inside `PersonInputs`, four existing elements are each wrapped in a
  one-line `id`-bearing `<div>` (adding one level of nesting around that
  single child does not change `space-y-*`'s direct-child count, so no
  spacing regression):
  - Retirement Age slider (`1126-1134`) → wrapped with
    `id: \`assumption-retirement-age-${personKey}\``
  - Life Expectancy slider (`1135-1142`) → wrapped with
    `id: \`assumption-life-expectancy-${personKey}\``
  - The pension `GrowthProfile` (`1232-1237`) → wrapped with
    `id: \`assumption-return-${personKey}\``
  - State Pension (Annual) slider (`1263-1273`) → wrapped with
    `id: \`assumption-state-pension-${personKey}\`` (this single anchor
    covers both the age and amount sliders for that line — see §3's copy
    for why no separate age anchor is needed)
- Shared Annual Expenses slider (`2748-2757`, inside "Living Costs") →
  wrapped with `id: "assumption-spending"`.
- Shared Inflation Assumption block (`2793-2810`, inside "Inflation &
  Risk") → no new wrapper needed; its existing outer
  `React.createElement("div", null, ...)` at `2793` already wraps exactly
  this content, so it becomes `React.createElement("div", { id:
  "assumption-inflation" }, ...)`.
- "Assumptions & Disclaimers" outer card (`2920-2921`, the
  always-rendered container, not the conditional inner block) → gains
  `id: "assumptions-disclaimers"`. Because this sits on the
  always-rendered outer `<div>`, `scrollAndHighlight('assumptions-disclaimers')`
  works whether or not `showAssumptions` is currently `true` — no need to
  wait a frame for the conditional content to mount before scrolling.

Resulting anchor ids: `assumption-return-p1`, `assumption-return-p2`,
`assumption-retirement-age-p1`, `assumption-retirement-age-p2`,
`assumption-life-expectancy-p1`, `assumption-life-expectancy-p2`,
`assumption-state-pension-p1`, `assumption-state-pension-p2`,
`assumption-spending`, `assumption-inflation`, plus
`assumptions-disclaimers` and (§3) `assumptions-panel` itself.

### 3. `AssumptionsPanel` — new module-level, memoised component

Placed directly after `VerdictHero` in the source
(`index.html:1695+`), alongside `SliderWithInput`/`PersonInputs`/
`CustomTooltip`/`WealthChart`/`IncomeChart` per `CLAUDE.md` §5.3 — no
inline component definition, no new state beyond what it's passed.

```js
const AssumptionsPanel = memo(function AssumptionsPanel({
  isCouple,
  p1Name, p2Name,
  p1PensionGrowth, p2PensionGrowth,
  p1RetirementAge, p2RetirementAge,
  p1LifeExpectancy, p2LifeExpectancy,
  p1StatePensionAmount, p1StatePensionAge,
  p2StatePensionAmount, p2StatePensionAge,
  inflationRate,
  annualExpenses,
  onShowFullAssumptions
}) { /* ... */ });
```

**Formatting helpers** (module-level, placed alongside `scrollAndHighlight`
— `nameAt` is hoisted out of `VerdictHero`'s function body into this
shared helper rather than duplicated, a small behaviour-preserving
refactor of an already-shipped, tested component; `VerdictHero`'s own
`currentAges`/`supportableAges` computations call it exactly as before):

```js
// Shared couple-mode age formatting (was VerdictHero's local `nameAt`,
// index.html:1649 — hoisted so AssumptionsPanel can reuse it without
// duplicating the string logic).
const nameAtAge = (name, age, isCouple) => isCouple ? `${name} at ${age}` : `age ${age}`;
// Non-age per-person values (%, £) read oddly with "at" ("Aaron at 6%"),
// so they get their own separator rather than forcing nameAtAge's pattern.
const nameValue = (name, value, isCouple) => isCouple ? `${name}: ${value}` : value;
```

**The six rows, in the roadmap's own stated order** (Problem section,
`intent/012-assumptions-panel.md`), one row per category, each rendered as
a label + a clickable value calling `scrollAndHighlight`:

1. **Return** — value `${growth}%` per person via `nameValue` (e.g. "Aaron:
   6%, Partner: 6%" / "6%" individual). Anchors:
   `assumption-return-p1`/`-p2`. Carries a small `Info`-icon tooltip (same
   `tooltip-trigger`/`tooltip-content` classes `SliderWithInput` already
   uses) reading: "Shown as each person's pension growth rate — the
   figure most closely tied to retirement outcomes. Cash ISA, Stocks &
   Shares ISA and LISA growth rates are set separately below." (decision 3
   of the intent — this is the one row whose simplification needs a word
   of explanation).
2. **Inflation** — value `${inflationRate}%`, single shared value, no
   per-person split. Anchor: `assumption-inflation`.
3. **Retirement age** — value via `nameAtAge` (e.g. "Aaron at 62, Partner
   at 60" / "age 62"). Anchors: `assumption-retirement-age-p1`/`-p2`.
4. **Life expectancy** — value via `nameAtAge` (e.g. "Aaron at 90, Partner
   at 88" / "age 90"). Anchors: `assumption-life-expectancy-p1`/`-p2`.
5. **Spending** — value `${formatCurrency(annualExpenses)}/yr (excl.
   mortgage)`, single shared value. Anchor: `assumption-spending`.
6. **State Pension** — value `${formatCurrency(amount)}/yr from age
   ${age}` per person, combining the State Pension Age and State Pension
   (Annual) figures into this one line rather than adding a seventh row
   or a second anchor (e.g. "Aaron: £12,548/yr from 66, Partner:
   £10,200/yr from 67" / "£12,548/yr from age 66"). Anchor:
   `assumption-state-pension-p1`/`-p2` (covers both sliders, which sit
   adjacent in `PersonInputs`).

Each clickable value is a `<button type="button">` (not a real link — no
navigation, just an in-page jump), styled as inline text
(`text-sm font-semibold text-slate-900 hover:text-blue-600 underline
decoration-dotted underline-offset-2`), `onClick: () =>
scrollAndHighlight(anchorId)`. In couple mode, a category with two people
renders two independently-clickable buttons separated by a plain `", "`
text node — each jumps to that person's own card, not both at once.

**Container**: `id: "assumptions-panel"`, `className: "mb-8 bg-white
rounded-xl shadow-lg p-6 border border-slate-200"` (matching
`VerdictHero`'s own wrapper exactly, for visual consistency between the
two headline-area cards). Heading: `<h2>` reading **"Your projection
assumes..."** — the roadmap's own phrase (Problem section) — with a
subtitle `<p>`: "Click any figure to jump to where it's set." A footer
button below the six rows, **"See full assumptions & disclaimers ↓"**,
`onClick: onShowFullAssumptions` (§4 below) — decision 2 of the intent's
"new panel links down to the existing section for full detail."

### 4. Wiring in `RetirementCalculator`

`AssumptionsPanel` is rendered directly after `VerdictHero`
(`index.html:2564-2576`) and before the summary card row, reading from
`d` (the deferred inputs) rather than raw `person1`/`person2`/
`inflationRate`/`annualExpenses` state — this keeps the panel's displayed
figures consistent with whatever `verdict`/`longevity` are currently
computed from, rather than momentarily showing a newer value than the
headline above it reflects during a `useDeferredValue` lag:

```js
const jumpToFullAssumptions = useCallback(() => {
  setShowAssumptions(true);
  scrollAndHighlight('assumptions-disclaimers');
}, []);
```

```jsx
<VerdictHero ... />
<AssumptionsPanel
  isCouple={isCouple}
  p1Name={d.p1.name} p2Name={d.p2.name}
  p1PensionGrowth={d.p1.pensionGrowth} p2PensionGrowth={d.p2.pensionGrowth}
  p1RetirementAge={d.p1.retirementAge} p2RetirementAge={d.p2.retirementAge}
  p1LifeExpectancy={d.p1.lifeExpectancy} p2LifeExpectancy={d.p2.lifeExpectancy}
  p1StatePensionAmount={d.p1.statePensionAmount} p1StatePensionAge={d.p1.statePensionAge}
  p2StatePensionAmount={d.p2.statePensionAmount} p2StatePensionAge={d.p2.statePensionAge}
  inflationRate={d.infl}
  annualExpenses={d.exp}
  onShowFullAssumptions={jumpToFullAssumptions}
/>
{/* existing summary card row, unchanged */}
```

`jumpToFullAssumptions` is the only new state-touching code this
requirement adds; `AssumptionsPanel` itself and `scrollAndHighlight` hold
no state of their own (per `intent/012-assumptions-panel.md`'s
constraint that this is "a small, additive DOM change," not new state
management).

### 5. Repointing `VerdictHero`'s caveat (decision 2)

`VerdictHero`'s caveat line (`index.html:1692-1694`) keeps its existing
wording — "...see Known limitations in the Assumptions panel." reads
correctly once "the Assumptions panel" *is* this new, adjacent panel — but
"Assumptions panel" changes from plain text to a clickable target. No new
prop is threaded through `VerdictHero`: `scrollAndHighlight` is a
module-level function it can call directly, exactly like
`AssumptionsPanel` does, so `VerdictHero`'s existing prop signature is
untouched.

```jsx
<p className="text-xs text-slate-500 mt-3">
  Based on a fixed average return, no tax on retirement income, and no
  sequence-of-returns risk — see Known limitations in the{' '}
  <button
    type="button"
    onClick={() => scrollAndHighlight('assumptions-panel')}
    className="underline hover:text-slate-700"
  >
    Assumptions panel
  </button>.
</p>
```

This is the "item 1's existing inline caveat link... is repointed at the
new panel" from decision 2 — it now jumps to `AssumptionsPanel` (a few
hundred pixels down), not the old bottom section (previously several
screens down). The chain to the bottom section's actual "Important"
disclaimer content is one further click, via `AssumptionsPanel`'s own
"See full assumptions & disclaimers ↓" button (§3/§4) — decision 2's "new
panel links down to the existing section for full detail."

### 6. `docs/TOOL_DOCUMENTATION.md` updates

- §3.4 ("Reading the outputs", currently `docs/TOOL_DOCUMENTATION.md:101-108`):
  a new bullet is inserted after the existing "Supportable retirement age"
  bullet and before "Summary cards" (matching the new panel's actual
  render position — between the headline and the summary cards),
  describing: the six assumption lines in their roadmap order (return
  shown as pension growth rate, inflation, retirement age, life
  expectancy, spending, State Pension), that each is clickable through to
  where it's set with a scroll-and-brief-highlight, and the panel's own
  link down to the full "Assumptions & Disclaimers" section. The existing
  headline-caveat bullet gets one clause added noting "the Assumptions
  panel" is now that clickable link, not prose.
- §3.3 ("What each section covers") is **not** changed — this feature adds
  an in-page navigation aid over sections already documented there, not a
  new input section.
- §5.4 (verification) gets **no new checklist item** — confirmed per the
  intent's own note and this spec's mechanics: `AssumptionsPanel` only
  reads state `projectJoint()`/`verdict`/`longevity` already compute or
  that the sliders already hold; `scrollAndHighlight` and
  `jumpToFullAssumptions` are DOM/state-toggle side effects with no
  calculation content to regress-test. §5.4's manual-verification
  convention (as used for 011's UI pieces) covers this instead — see §8
  below.
- §7 (known limitations) is unchanged — nothing here removes, narrows or
  adds a deliberate simplification; §7's existing list is exactly what
  the (already-existing) caveat chain still points at.

### 7. `CHANGELOG.md` and `USER_CHANGELOG`

- `CHANGELOG.md` entry under the date this merges, naming
  `intent/012-assumptions-panel.md`, covering: the new panel, its six
  lines and their scroll-and-highlight click-through, the caveat repoint,
  and that no calculation logic changed.
- `USER_CHANGELOG` entry in `index.html`, user-facing (a new panel and
  new click-through navigation are directly visible/usable), versioned
  with whatever `sw.js` `CACHE` bumps to (`v10` → `v11`; see §9). Draft
  copy, plain language, no file/function names — matching the existing
  `v10` entry's register:

  > title: `"Your projection assumes..." panel added near your results`
  > items: `["A new panel just below the \"Can I retire?\" headline lists
  > the six assumptions behind it — expected investment growth, inflation,
  > retirement age, life expectancy, spending and State Pension. Click any
  > figure to jump straight to where it's set, with a brief highlight so
  > you can find it. It also links down to the full Assumptions &
  > Disclaimers section for more detail."]`

### 8. Verification

No `projectJoint()`/`findSupportableDelta()` changes, so no new
`tests/test-engine.js` cases are needed — `node tests/test-engine.js`
is still run (per the usual lifecycle step) to confirm nothing regressed,
but this requirement adds nothing for it to cover. Manual verification
per `CLAUDE.md`'s "No build step" guidance:

- Each of the six lines shows the value that matches its corresponding
  input field, in both individual and couple mode, immediately after any
  change to that field (once the `useDeferredValue` lag settles).
- Clicking a line's value smooth-scrolls to the correct input card and it
  visibly highlights briefly — on both the desktop multi-column layout and
  the mobile stacked layout (decision 4: no layout-conditional
  suppression).
- Clicking the same value twice in quick succession restarts the
  highlight rather than doing nothing on the second click.
- `VerdictHero`'s caveat "Assumptions panel" link scrolls to/highlights
  `AssumptionsPanel` itself.
- `AssumptionsPanel`'s "See full assumptions & disclaimers ↓" button
  expands the bottom section (if collapsed) and scrolls to/highlights it,
  including when it's already expanded.
- The highlight is visibly legible in both light and dark mode.
- Individual mode renders only `p1` lines/anchors — no broken links or
  console errors from a nonexistent `p2` target.
- The existing "Assumptions & Disclaimers" section's content and its
  expand/collapse behaviour are otherwise unchanged.

### 9. `sw.js` cache bump

User-facing `index.html` change, so per `CLAUDE.md`'s "Bump the cache
version after any deploy-worthy change": `sw.js`'s `CACHE` moves from
`'retirement-planner-v10'` to `'retirement-planner-v11'`, matching the
`USER_CHANGELOG` version in §7.

## Non-goals

Carried over from `intent/012-assumptions-panel.md`, plus mechanics-level
ones this spec's design confirms:

- No change to `projectJoint()` or any calculation logic.
- No attempt to surface all eight underlying growth-rate figures (4
  account types × 2 people) — only each person's pension growth rate
  (decision 3).
- No removal or restructuring of the existing "Assumptions & Disclaimers"
  section's content or its `showAssumptions` collapse behaviour — only an
  `id` added to its outer container and a way to jump-and-expand it.
- No new state-management/routing library, no React Context, no new
  `useState` beyond `jumpToFullAssumptions`'s reuse of the existing
  `showAssumptions` setter — the scroll/highlight mechanism is plain DOM
  ids and a CSS animation class.
- No new fields added to `PERSISTED_FIELDS` — the panel only reads
  existing persisted/derived state, nothing new is saved.
- No layout-conditional click-through behaviour (decision 4) — identical
  on desktop and mobile.

## Constraints

Carried over from the intent, made concrete above:

- `AssumptionsPanel` joins `SliderWithInput`/`PersonInputs`/
  `CustomTooltip`/`WealthChart`/`IncomeChart`/`VerdictHero` as a
  module-level, memoised component per `CLAUDE.md` §5.3.
- Single-file PWA constraint holds; `sw.js`'s `CACHE` bumps to `v11` (§9).
- `docs/TOOL_DOCUMENTATION.md` (§3.4 only — §3.3, §5.4 and §7 explicitly
  unchanged per §6 above), `CHANGELOG.md`, and a `USER_CHANGELOG` entry
  all land in the same PR, per `CLAUDE.md`.
- Per the lifecycle, this PR also moves
  `intent/012-assumptions-panel.md` and this spec file into
  `intent/done/` / `spec/done/` once implemented and merged, and removes
  `plan.md`.
- This session continues on the harness-assigned branch
  `claude/pensive-newton-rymumn` (no fresh `feature/012-...` branch), per
  `intent/012-assumptions-panel.md`'s own constraints section and
  `CONTRIBUTING.md`'s "Agent sessions bound to a pre-named branch." The
  draft PR is opened against `main` from this branch once implementation
  begins, per the usual lifecycle.
- `main`'s branch protection (PR + green `test-engine` check) applies as
  usual — no direct push to `main`.

## Open questions

None — the intent's grilling interview left nothing open, and this spec
resolves every "spec detail" it deferred (exact anchor ids, exact copy for
all six lines, the highlight mechanism, the caveat repoint, and the
doc/changelog/cache-bump implementation steps). Exact pixel-level styling
(button hover colours, animation duration/easing, row spacing) is ordinary
UI polish left to implementation, not a spec-level decision — the same
latitude `spec/done/011-can-i-retire-headline.md` left for its own hero's
exact copy.
