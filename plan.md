# Plan — 018 UK income tax in retirement

Breaks `spec/018-uk-income-tax.md` into an ordered implementation sequence
inside `index.html` (+ `tests/test-engine.js`,
`tests/fixtures/individual-baseline.json`, `sw.js`,
`docs/TOOL_DOCUMENTATION.md`, `CHANGELOG.md`). This file does not re-derive
any decision — every signature, formula, row field, class list and piece of
copy comes from the spec; **when in doubt, the spec section cited beside
each step is the source of truth, not this file.**

One requirement (roadmap #3, #12, #26, #19), one branch, one PR, one build
version (`sw.js` `v12` → `v13`). This is a **high-stakes change to
`projectJoint()`**, so the order is: pure, inert engine helpers and their
tests first → behaviour-neutral rewire of hard-coded figures (the unchanged
baseline proves it neutral) → the engine behaviour change on its own, with
the deliberate baseline regeneration → UI consumers → docs/changelogs →
cleanup.

Commit and push after each phase's checkpoint (not just at the end) — the
draft PR (#17) is already open, and every push updates it. Never push a
commit where `node tests/test-engine.js` is red (CI runs it on every push).

No build step, so "checkpoint" means: reload `index.html` directly (or
`python3 -m http.server 8000`) and eyeball it with the console open, plus
`node tests/test-engine.js` wherever anything in an `ENGINE-EXTRACT` span
changed. **`index.html` must stay loadable after every single edit** —
prefer several small, always-loadable edits over one giant one.

## 0. Preconditions

- Confirm draft PR #17 (`claude/pensive-newton-rymumn` → `main`) is open.
- Run `node tests/test-engine.js` before touching anything. Expected today:
  **21 passed, 0 failed** (the spec's "20 existing checks" plus the
  byte-for-byte baseline check).
- Spec §15 step 1: copy `tests/fixtures/individual-baseline.json` to the
  scratchpad as `baseline-before.json` now, before any engine edit (git has
  it too, but the copy makes the Phase 3 diff a one-liner).

## 1. Engine foundations — inert helpers + their tests (no behaviour change)

Everything here is added but not yet called by `projectJoint()` or any
component, so the page and the baseline must be unchanged.

- **`UK_REFERENCE`** (spec §1.1–§1.2) — inside the **first**
  `ENGINE-EXTRACT` span, directly after `const CURRENT_YEAR = 2026;`
  (~`index.html:682`). Copy the §1.2 block verbatim (every URL, label and
  figure) — don't retype it.
- **`taxThresholdsFor` / `incomeTaxFor`** (spec §2) — inside the second
  span, directly after `drawFromTier` and before `projectJoint`
  (~`index.html:1828`/`1840`). Verbatim from the spec.
- **Move `deflate`** (spec §4.1, R8) — cut the existing
  `const deflate = ...` (~`index.html:2128`, just after `nameValue`,
  outside the span) and paste it verbatim directly before
  `// ENGINE-EXTRACT-END` (~`index.html:2098`), after
  `computePotBreakdown`. `formatToday` stays where it is. Its existing call
  sites (`ChartTooltip`, Pot/Income/Living Standard cards) are all
  render-time, so the new position is fine.
- **`lifetimeTaxTotals`, `TAX_NOTE_ORDER`, `computeTaxNotes`** (spec §4.2,
  §4.3) — after `deflate`, still before `// ENGINE-EXTRACT-END`. Verbatim.
- **Harness plumbing** (spec §14 "Harness plumbing") in
  `tests/test-engine.js`'s `loadEngine`:
  - append `var __UK_REFERENCE = UK_REFERENCE;` beside `__CURRENT_YEAR`;
  - `deflate` is a top-level **`const`** arrow function, not a `function`
    declaration, so it will **not** appear as `sandbox.deflate` (same reason
    the harness already needs `__CURRENT_YEAR`). The spec moves it
    "verbatim", so don't rewrite it as a declaration — append
    `var __deflate = deflate;` too and read that;
  - `typeof === 'function'` sanity checks for `taxThresholdsFor`,
    `incomeTaxFor`, `lifetimeTaxTotals`, `computeTaxNotes`, `deflate`
    (`__deflate`), and a sanity check that `UK_REFERENCE` is an object;
  - wrap `taxThresholdsFor`, `lifetimeTaxTotals`, `computeTaxNotes` and
    `UK_REFERENCE` in the existing `JSON.parse(JSON.stringify(...))`
    cross-realm round trip;
  - update the header comment to name the new extracted functions/consts.
- **Tests that need only the pure helpers** (spec §14 cases 1–3): band
  boundaries over every row of the §2 table, the taper (+1.20 for +£2,
  allowance zero at 125,140, 150,000 → 53,703), and freeze-then-uprate
  (2026–2030 = 12,570 at 3%; 2031 = 12,570 × 1.03; 2035 at 2% =
  12,570 × 1.02⁵; 2060 at 0% = 12,570; `taper + 2·PA === ART` in 2040 at
  3%). Use `SCENARIO_TAX_...` naming and a "Covers:" comment, per file
  convention.
- Cases 4–11 read row fields (`p1Tax`, `incomeTax`, `p1LumpSum`, …) that
  don't exist until Phase 3, so they land there — including case 10
  (`lifetimeTaxTotals`) and 11 (`computeTaxNotes`), even though those
  functions are added now. Here they are only typeof-checked.

**Checkpoint:** `node tests/test-engine.js` — all 21 original checks plus
the new cases green, **baseline still byte-for-byte identical** (the
engine hasn't changed behaviour). This is also the proof that the new
consts/functions are actually visible to the harness — run it, don't
assume. Reload `index.html`: renders exactly as before, no console errors
(in particular, no `deflate is not defined` / TDZ error from the move).
Commit + push.

## 2. Rewire hard-coded figures to `UK_REFERENCE` (behaviour-neutral)

Spec §1.3 and the §1.4 table, minus the rows that change visible text or
behaviour (those go in their own phases, noted below).

- **`PLSA` alias** (§1.3): replace the `const PLSA = {...}` literal
  (~`index.html:691`) with `const PLSA = UK_REFERENCE.plsa;` — it sits after
  the first span, so `UK_REFERENCE` is already initialised.
- **`makePerson`**: `statePensionAmount: UK_REFERENCE.statePension.fullNewAnnual`.
- **`PersonInputs` strings**: Cash ISA / S&S ISA `IsaTypeAccount`
  `tooltip` + `contributionSubtitle`; LISA `tooltip` + `contributionSubtitle`;
  employer-contribution slider `tooltip`; State Pension slider `tooltip`.
  Template literals exactly as in §1.4. Each must render the same text as
  today (`formatCurrency(20000)` → "£20,000", `0.25 * 100` → 25, etc.).
- **Engine constants**: `projectJoint`'s `const cap = 60000` (~`1851`),
  LISA monthly credit `* 1.25` (~`1992`), LISA tier `x.age >= 60`
  (~`1942`); `computePotBreakdown`'s `cap` and `* 1.25` (~`2071`, `2085`).
  **Not** the lump-sum `* 0.25` — that's Phase 3 (§3.1).
- **`warnings` memo** (~`index.html:2540-2544`): the three comparisons and
  their strings, via `formatCurrency(...)`; output text must be identical.
- **Deferred to later phases** because they change what the user sees:
  lump-sum checkbox label (R2 → Phase 4), "How we calculate this" body
  (§11 → Phase 7), footer (§12 → Phase 7).
- Leave alone (spec §1.4 "Deliberately not rewired"): historical
  `USER_CHANGELOG` entries, partner defaults, slider `max`es, gauge
  `gMin`/`gMax`, the £1,000 depletion floor.

**Checkpoint:** `node tests/test-engine.js` — same count as Phase 1, all
green, **baseline still byte-for-byte identical** (this is what makes the
rewire provably neutral). Reload: every rewired tooltip/subtitle/warning
reads exactly as before (trigger the three warnings with oversized
contributions to check their text); PLSA gauge and Living Standard verdict
unchanged. `grep -n "60000\|20000\|4000\|12548\|\* 1\.25" index.html`
should now hit only the deliberately-not-rewired sites. Commit + push.

## 3. Engine behaviour change — tax in `projectJoint()` + Lump Sum Allowance

The one phase that changes numbers. Keep it to engine + tests + fixture.

- **LSA cap** (§3.1): replace the lump-sum lines in the
  `pp = people.map(...)` block (~`index.html:1881-1888`) with the §3.1
  block; add `lumpSum, lumpSumExcess` to that block's returned object.
- **Tax and the gap** (§3.2): replace `let gap = Math.max(0, targetExpenses - totalSP - totalPenW);`
  (~`1908`) with the §3.2 block. Nothing else in the tier-draw logic
  changes.
- **Row fields** (§3.3): the 10 `p1*/p2*` fields appended after
  `p2OtherSavings`; `row.incomeTax` and `row.netIncome` next to
  `row.totalPension = ...` (~`1973`).
- Run `node tests/test-engine.js` **before** touching the fixture.
  **Expected: exactly one failure — the byte-for-byte baseline check.**
  Every other original check (including "precisely 75%") must pass
  unchanged. Record the failure output for the CHANGELOG. Any other
  failure means the implementation diverges from the prototype — stop and
  fix, don't regenerate.
- **Add spec §14 cases 4–11** (shared retired-from-y=0 fixture helper per
  §14; `SCENARIO_TAX_...` names with "Covers:" comments): per-person
  allowances (1486/1486/2972 vs 5486); LSA cap (above / exactly at
  £1,073,100 / below / couple with one person over); ISA/savings untaxed
  (incl. every row of `SCENARIO_DRAW_ORDER`); tax widens the savings draw
  (5486 / 34514); withdrawal rate changes tax (7486); State Pension
  taxable with freeze interaction (2031 → 14547 / 320, 2030 → 0);
  `lifetimeTaxTotals` on `BASELINE_INPUT` (Σ deflated 2056–2086, and ≠
  `deflate(nominal, 2086, 3)` — uses `__deflate` from Phase 1);
  `computeTaxNotes` (all seven bullets). Don't edit the existing checks
  (case 12).
- **Regenerate the baseline deliberately** (§15 steps 3–4):
  `node tests/test-engine.js --update-baseline`, then
  `node tests/test-engine.js` (all green). Diff `baseline-before.json`
  against the new fixture and confirm every §15 expected figure against
  the real implementation: 12 new fields per row; existing fields differ
  only from 2056; LSA binds (£285,410 → £268,275, £17,135 stays in);
  2056 pension draw 34,249 → 34,935, ISA draw 55,560 → 56,439, tax £1,565;
  2058 tax £8,123, ISA draw 26,631 → 34,027; 2091 `totalIsa` 525,244 → 0,
  `totalPension` 684,991 → 698,699; no depletion; lifetime tax
  £370,489 (≈ £92,769 today). Write the confirmed before/after into a
  scratchpad note for the `CHANGELOG.md` entry (Phase 8). If a figure
  doesn't match, stop and reconcile before committing.

**Checkpoint:** `node tests/test-engine.js` fully green with the
regenerated fixture. Reload `index.html`: loads without errors; balances
and the verdict reflect tax (UI labels not yet updated — expected
interim). Commit engine + tests + regenerated fixture together (message
states the baseline was regenerated deliberately for 018) + push, so CI is
never red.

## 4. Row consumers, after-tax household, after-tax labels

- **`summaryOf`** (§5.1, ~`index.html:2468`): `lumpSum: row[\`p${key}LumpSum\`]`;
  fallback keeps `lumpSum: 0`.
- **`household`** (§5.2, ~`2474`): replace with the §5.2 memo — note the
  deps array gains `d.infl`; copy it exactly.
- **New memos** (§5.3): `lifetimeTax` and `taxNotes`. The spec says
  "next to `potBreakdown`/`verdict`", but `potBreakdown` is declared
  **before** `longevity` (~`2491` vs `2492`) and both new memos read
  `longevity.firstRet/planEnd` — declare them **after `longevity`**
  (next to `verdict`, ~`2519`) or the render throws a TDZ
  `ReferenceError`. Copy deps exactly.
- **After-tax labels** (§6): full-size Income card `h3` (~`2843`); sticky
  bar middle label → `'Income after tax'` in both modes (~`2736`, R10);
  Living Standard caption (~`3103`); the new "Tax −£Z" sub-line span after
  the State span (R11), verbatim from §6.
- **Lump-sum checkbox label** (§1.4 row, R2, ~`1276`) — deferred from
  Phase 2 because it changes visible text.

**Checkpoint:** Income card/sticky bar read "…after tax"; the Living
Standard sub-line shows Pension · State · Tax and Pension + State − Tax
equals the big figure (check individual and couple); the per-person
"Incl. £X tax-free lump sum" reads £268,275 on a £1.5m+ pot; PLSA gauge
marker moved down accordingly; no console errors. Commit + push.

## 5. `IncomeChart` tax bar, tooltip, lifetime tax line

- **`incomeData`** (~`2563`): add `'Income Tax': -r.incomeTax` (§7).
- **`IncomeChart`** (~`1583`): `ComposedChart` gains `stackOffset: "sign"`;
  `ReferenceLine y: 0` after `CartesianGrid` (uses the existing `isDark`
  prop); new `Income Tax` `Bar` after the `State Pension` bar, before the
  `Line`; `Tooltip` content passes the §7 `totalLabel`.
- **`ChartTooltip`** (~`1327`): add `totalLabel = "Total (today's money)"`
  prop, rendered in place of the literal (R13). `WealthChart` unchanged.
  Tax is **not** added to `excludeFromTotal`.
- **`formatCurrencyK`** (~`690`, R12): negative-aware version from §7 (the
  `−` is U+2212, not a hyphen).
- **Card subtitle** (~`3085`): append " Income Tax is shown below the line."
- **Lifetime tax line** (§8): the `div` directly after the `IncomeChart`
  element, verbatim.

**Checkpoint:** grey tax bar hangs below zero with positive bars still
starting at 0; zero line visible in both themes; Y-axis shows "−£5k"-style
ticks (and `WealthChart`'s mortgage-debt ticks now read "−£…k" too);
tooltip lists "Income Tax £X" and "Total after tax (today's money)";
lifetime line shows nominal, "≈ … in today's money" and a "2026/27 tax
year" pill. Commit + push.

## 6. Tax notes panel

- **`taxNoteText`** (§9.2) — plain module-level function, **outside** the
  engine span (it uses `formatCurrency`), near `VerdictHero`/
  `AssumptionsPanel`. Rates and "25%" read from `UK_REFERENCE`, not
  literals (60% = `higherRate * 1.5 * 100`). Returns `{ text, href, label }`.
- **`TaxNotesPanel`** (§9.3) — module-level, `memo`-wrapped, alongside
  `VerdictHero`/`AssumptionsPanel`. Never define it inside
  `RetirementCalculator` (CLAUDE.md / docs §5.3).
- Render it directly after the lifetime tax `div` (§8), same card.
- Check every template against the §9.1 fact-only wording rule word by
  word before moving on (no "consider", "you could", "to reduce", etc.).

**Checkpoint:** default plan shows the `statePensionOverAllowance` note
(e.g. "From 2058, your State Pension alone (£32,312) …"); a £2m pot adds
`lumpSumCapped` + `higherRate`; a very large pot shows `taper` or
`additionalRate` per R7; couple mode uses names and year order; panel is
hidden when there are no notes (R14); links open in a new tab; moving the
Safe Withdrawal Rate slider updates notes and tax live; blue panel legible
in dark mode. Commit + push.

## 7. SWR tooltip, `VerdictHero` caveat, "How we calculate this", footer

- **SWR slider tooltip** (§10, ~`3060`): append the sentence verbatim.
- **`VerdictHero` caveat** (§10, ~`1734`): replace only the opening string;
  the `Info` tooltip and "Assumptions panel" button untouched.
- **`sourceLink`** helper (§11) — module-level plain function.
- **"How we calculate this"** (§11, ~`3167`): keep
  `id: "assumptions-disclaimers"`, `showAssumptions` and
  `onShowFullAssumptions` exactly; rename the `h2`; rebuild the body as
  the 12 blocks in §11's order, every figure from `UK_REFERENCE`, links
  joined with `" · "`. Do this in several small edits (e.g. heading + "last
  updated" line; then blocks 4–7; then 8–10; then 11–12), reloading
  between each.
- **`AssumptionsPanel` button** (R15, ~`1797`): "See how we calculate this ↓".
- **Footer** (§12, ~`3204`): second `<p>` only; privacy line untouched.

**Checkpoint:** the Assumptions panel link opens the section and
scroll + highlight still work; "Figures last updated: 6 April 2026
(2026/27 tax year)" is first; every figure matches `UK_REFERENCE`; each
link has `target="_blank"`; the amber Important box no longer says tax
isn't modelled; footer reads "Based on 2026/27 UK tax year figures and
PLSA Retirement Living Standards (2025/26)"; caveat no longer says "no
tax". Commit + push.

## 8. Shared closing steps

- **`docs/TOOL_DOCUMENTATION.md`** (spec §13): header line; §1 table row;
  §3.4 bullets (summary cards, gauge, Retirement Income vs Expenses,
  "Can I retire?", "Your projection assumes…"); new §3.10 (after §3.9
  Dark mode); §3.5 warnings wording; §4.2 step 1; §4.3 new step + "Income
  tax model" + "Annual allowance and MPAA" sub-blocks; §4.7 Source column
  and new rows; §5.2 and §5.3 additions; §5.4 amended item + new items;
  §7 limitation #1 replaced **in place** (don't renumber #2–#11).
- **`sw.js`**: `'retirement-planner-v12'` → `'retirement-planner-v13'`.
- **`USER_CHANGELOG`** (spec §16): new first `v13` entry, verbatim copy;
  `date` = actual merge date. (User-facing change → entry required.)
- **`CHANGELOG.md`** (spec §17): entry under the actual merge date, with
  the confirmed before/after baseline figures recorded in Phase 3 and
  R1–R15.
- **Full test run**: `node tests/test-engine.js` — count should match
  Phase 3's exactly (Phases 4–8 touch no engine code).
- **Manual verification sweep** (spec §18, all bullets): individual and
  couple × light and dark × desktop and narrow phone (~375px). Headless
  Chromium via Playwright is available (`executablePath:
  '/opt/pw-browsers/chromium'`) — serve with `python3 -m http.server 8000`,
  screenshot each combination, and check the console for errors. Sticky
  bar "Income after tax" must not wrap badly at phone width.
- `CLAUDE.md` still says "Retirement income tax is not modelled." — spec
  Q4 leaves this open; ask the user rather than editing it unprompted.

## 9. Cleanup + PR

- `git mv intent/018-uk-income-tax.md intent/done/` and
  `git mv spec/018-uk-income-tax.md spec/done/`.
- `git rm plan.md`.
- PR description: "Implements `intent/018-uk-income-tax.md`" (+ spec path),
  plus the spec §15 PR checklist (URLs opened by hand; §9.1 wording rule
  checked; baseline diff reviewed) and the open questions Q1–Q6 for the
  user to answer.
- **Do not mark ready until a human has opened every `UK_REFERENCE` URL
  (and the docs' Commons Library link) in a browser and ticked that box**
  — gov.uk is blocked from this environment, so the agent can't.
- Then mark PR #17 ready for review.
- After merge: `git checkout main && git fetch origin main && git merge
  --ff-only origin/main`, then `git branch -d claude/pensive-newton-rymumn`.
  Give the user https://github.com/aggallim/retirement-planner/branches to
  delete the remote branch (the git proxy rejects `git push --delete`).

## Watch for

- **Stale line numbers.** Every `~index.html:NNNN` above is as the branch
  stands before Phase 1; they drift after each edit. Locate by
  function/element/text (`function projectJoint`, `const household`,
  `"Assumptions & Disclaimers"`, `"Based on 2026/27"`) instead. Line 361 is
  the ~590K-char vendored bundle — never read or print it (pipe grep output
  through `cut -c1-200`).
- **Harness visibility.** `ENGINE-EXTRACT` markers are text markers; the
  harness only sees top-level `function` declarations as sandbox
  properties. Top-level `const`s (`UK_REFERENCE`, `deflate`,
  `TAX_NOTE_ORDER`) are visible to code inside the spans but need a
  `var __X = X;` line to reach the tests.
- **Absent Tailwind classes.** `underline`, `mt-4`, `pt-2`, `space-y-1`,
  `space-y-2`, `gap-1`, `hover:text-blue-700` and `hover:text-slate-700`
  are **not** in the inlined CSS build — silent no-ops. Don't use them in
  new JSX, don't rely on existing uses of them, and don't "fix" them here
  (spec Q5). Use only the classes the spec lists (checked against the build
  and `.dark` overrides); if you need a different one, grep the `<style>`
  block for it first.
- **TDZ ordering.** `UK_REFERENCE` must stay in the first span (before
  `PLSA`/`makePerson` use it); `lifetimeTax`/`taxNotes` memos must follow
  `longevity`.
- **gov.uk links.** Copy every URL from the spec's `UK_REFERENCE` block —
  never from memory — and remember they were confirmed only via search
  index; the by-hand click-through before "ready" is mandatory.
- **Fact-only notes.** §9.1 is binding and has no automated check — the
  Phase 6 word-by-word review and the PR checklist are the only guard.
- **Minus sign.** `formatCurrencyK` and "Tax −£Z" use U+2212 `−`, not `-`.
