# 013 — Today's money vs. nominal money clarity

## Status

Resolved via the `grilling` skill, run in three rounds. Part of a bundled
Wave 1 delivery covering roadmap items 9, 20, 17, 18 and 10 together (one
shared `spec.md`/`plan.md`/branch/PR/build version), a deliberate reversal
of `intent/done/012-assumptions-panel.md` decision 1 (which chose separate
intent/spec/branch/PR per item) — the user asked to bundle the remaining
Wave 1 items directly, outside `grilling`, before this item's own design
tree was interrogated. Each bundled item still gets its own intent file;
this is the first of five (013–017).

## Problem

Raised via the project's Notion roadmap — Medium priority item #9:
"Make today's-money vs. future/nominal money unmistakable throughout the
UI — e.g. '£50,000/year in today's money — equivalent to approximately
£91,000/year when you retire.'" Reviewer's reasoning: without this, users
routinely misread nominal future figures as today's purchasing power.

What's actually there today:

- **No existing today's-money infrastructure at all** — no deflation
  helper, no "real terms" toggle, no precedent anywhere in `index.html`.
- **Inputs are already today's-money by construction.** Annual Expenses
  (`SliderWithInput` for `annualExpenses`) is explicitly framed as
  "current spending... adjusted for inflation in retirement" — the input
  itself needs no relabelling.
- **Every output figure is nominal, unlabelled.** `household.totalPot`
  and `household.annualIncome` (`useMemo`, results component) are
  calculated at `bothYear` — the future calendar year both people are
  retired — with no deflation back to today's terms anywhere.
- These nominal figures currently appear in **four distinct display
  sites**, not one:
  1. The full-size 3-card row (Combined/Total Pot, Household/Annual
     Income, Living Standard).
  2. The scroll-triggered sticky mobile recap bar — the same three
     figures, condensed into a `text-xs md:text-xl` 3-column strip.
  3. The per-person breakdown grid in couple mode (Pension/ISA/Other
     Savings/Total/lump sum per person) — already the most
     space-constrained display in the app.
  4. The Living Standard card's inline "Pension £X · State £Y"
     sub-breakdown next to the big income figure.
- **The PLSA "Living Standard" gauge has an actual apples-to-oranges
  comparison**, not just a labelling gap: `household.annualIncome`
  (nominal, future-year) is plotted directly against `PLSA.minimum/
  moderate/comfortable` (today's-money 2025/26 reference bands) via
  `gPos()`. This is documented as known limitation #6 in
  `docs/TOOL_DOCUMENTATION.md` §7, and is also separately roadmap item
  #23 (Low priority, "inflate PLSA bands forward") — a calculation fix,
  not in this bundle.
- **Both charts are nominal time series.** `WealthChart` stacks up to
  six series (`p1Pension`/`p1Isa`/`p1OtherSavings`/`p2Pension`/`p2Isa`/
  `p2OtherSavings`) plus a mortgage line; `IncomeChart` has five
  (`Other Savings`/`Pension`/`ISA`/`State Pension`/`Expenses`). Both
  share one module-level tooltip component, `ChartTooltip` (not
  `CustomTooltip` — `CLAUDE.md`'s name for it is slightly off), which
  lists each series' value for the hovered year with no total line and
  no today's-money equivalent.
- **`formatCurrency`** always renders exact whole-pound figures
  (`Intl.NumberFormat`, 0 decimal places) — no existing rounding/
  approximation convention to reuse for an inherently-approximate
  deflated figure.
- **The household's only inflation figure is `d.infl`**, a single global
  rate — no per-account or per-category inflation exists to complicate
  the deflation basis.
- Next intent number available: 013.

## Outcome

Resolved via `grilling`:

1. **Scope — four sites, two different treatments, two left alone.**
   - Dual-display (nominal + today's-money): the full-size 3-card row
     (site 1) and the Living Standard card's inline sub-breakdown
     (site 4).
   - Left nominal-only: the sticky mobile bar (site 2 — a
     scroll-triggered condensed recap of site 1, which stays reachable
     by scrolling up; no room for a second figure per cell without
     ugly wrapping) and the per-person breakdown grid (site 3 — already
     the densest display in the app, and every figure there mirrors a
     total already getting dual-display just above it).
   - Charts get a tooltip-only enhancement (see decision 3), not a
     display/axis change.
   - Input-side figures (Annual Expenses etc.) are untouched — already
     correctly framed as today's-money.
2. **Summary card mechanism — always-on inline secondary line, no
   toggle.** Nominal stays the large primary figure (preserves existing
   visual hierarchy, doesn't relitigate item 011's just-shipped
   headline); today's-money is added as a smaller line beneath it. No
   new preference/toggle state, no `PERSISTED_FIELDS` addition.
3. **Chart mechanism — one synthesized total line per tooltip, not
   per-series.** `ChartTooltip` gains a new "Total (today's money)" row
   — the sum of that year's payload values, deflated — added once per
   tooltip. Individual series (Pension/ISA/State Pension/Expenses etc.)
   are not each given a today's-money equivalent; that would clutter a
   tooltip that already lists up to six rows without adding much beyond
   what the one total line conveys. The chart axes themselves stay
   nominal-only.
4. **PLSA gauge — caveat only, calculation untouched.** A permanent,
   always-visible small-print line is added under the gauge, noting
   that the household's income is shown in future £ while the PLSA
   bands are today's-money figures. The underlying mismatch (comparing
   a nominal figure against today's-money bands) is *not* fixed here —
   that's roadmap item #23, deliberately left out of this bundle so it
   doesn't grow beyond the five items already agreed.
5. **Deflation basis — one shared helper, `d.infl`, `CURRENT_YEAR`
   anchor.** A single pure function (e.g. `deflate(nominalValue,
   targetYear)`), discounting from the value's target year back to
   `CURRENT_YEAR` at the household's single inflation rate `d.infl` —
   the only inflation figure the model has. No new inflation assumption
   is introduced.
6. **Precision — rounded and hedged, not exact.** Today's-money figures
   are rounded to the nearest £100 and prefixed "≈" (e.g. "≈ £680,000
   in today's money"), rather than reusing `formatCurrency`'s exact
   whole-pound precision. A deflated figure is inherently one inflation
   assumption removed from the primary nominal figure it's derived
   from, and showing it with the same apparent precision as the primary
   figure would misrepresent that — consistent with where item #20
   (confidence/risk language, next in this bundle) is headed anyway.
7. **Computation architecture — display-layer only, engine untouched.**
   The deflation helper (decision 5) is module-level and memoised per
   `CLAUDE.md` §5.3, called from the results component wherever a
   dual-display figure or tooltip total is rendered. `projectJoint()`
   and its output shape are not changed — this is a presentation-layer
   transform on values the engine already produces, matching item
   012's non-goal 1 precedent.

## Non-goals

- No "show in today's money" toggle or preference (decision 2) — the
  dual-display is always on, not a view mode.
- No fix to the PLSA gauge's actual nominal-vs-today's-money mismatch
  (decision 4) — stays roadmap item #23's job.
- No per-series today's-money figures in chart tooltips (decision 3) —
  one total line only.
- No dual-display on the sticky mobile bar or the per-person breakdown
  grid (decision 1) — both stay nominal-only.
- No change to `projectJoint()` or any calculation logic (decision 7) —
  purely a display-layer transform of already-computed values.
- No new inflation assumption — reuses the single existing `d.infl`
  (decision 5).

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` bump happens once,
  for the whole bundled delivery, not per item (per the user's bundling
  decision) — not repeated in each of the five items' intent files.
- `SliderWithInput`, `PersonInputs`, `ChartTooltip`, `WealthChart` and
  `IncomeChart` stay module-level and memoised (`CLAUDE.md` §5.3); the
  new deflation helper follows the same module-level convention.
- `docs/TOOL_DOCUMENTATION.md` needs a §3 (user guide) update describing
  the dual-display convention and the PLSA caveat; since decision 7
  keeps this a display-layer transform with no new calculation, no new
  §5.4 verification checklist item is expected for this item alone, but
  the shared spec should confirm that once all five items' calculation
  impact (if any) is known.
- This session continues on the harness-assigned branch
  `claude/pensive-newton-rymumn`, restarted from `main` after
  `intent/done/012-assumptions-panel.md`'s PR (#15) merged, per
  `CONTRIBUTING.md`'s pre-named-branch section and this session's
  established merged-branch-restart convention.
