# 015 — "Explain this" breakdown on the Pot figure

## Status

Resolved via the `grilling` skill, run in two rounds. Third of five
bundled Wave 1 items (9, 20, 17, 18, 10) — see
`intent/013-today-vs-nominal-money.md`'s Status section for the bundling
decision. This item is the third addition landing on the same Pot summary
card as items 013 and 014 (decision 6 below).

## Problem

Raised via the project's Notion roadmap — Low priority item #17: "'Explain
this' breakdown button on every headline number (e.g. click £1,247,382 →
see starting balance, contributions, growth, withdrawals that produced
it)." Framed as a trust-building UI treatment layered on top of the
Medium-priority assumptions panel (`intent/done/012-assumptions-panel.md`)
— "same instinct, applied per-number rather than once at the top."

What's actually there today:

- **`projectJoint()`'s per-year rows carry only ending balances and that
  year's withdrawal** (`p1Pension`, `p1CashIsa`, ..., `pensionWithdrawal`,
  `isaWithdrawal`, `otherSavingsWithdrawal`) — contributions and growth
  are never recorded as discrete numbers; they're implicit in the
  monthly compounding/contribution loop and immediately folded into the
  next year's balance.
- **The row pushed for a given year reflects the balance *before* that
  year's growth, contributions, and withdrawal are applied** — withdrawal
  and growth/contribution updates happen after `data.push(row)`. So
  `household.totalPot` (read at `year === bothYear`) is effectively "the
  accumulated balance at the start of the year both people retire,
  before that year's drawdown" — a pre-retirement accumulation snapshot,
  not a post-drawdown figure.
- **In couple mode with staggered retirement ages, the earlier-retiring
  partner can already be drawing down** in the years between their own
  retirement and `bothYear` — so a "withdrawals" component of the Pot
  figure's history is not always zero, even though the figure itself is
  measured before *that* year's drawdown.
- **The Household Income figure's natural breakdown already exists,
  unexpanded**: the Living Standard card already shows "Pension £X ·
  State £Y" inline next to `household.annualIncome`, with no click
  required.
- **No modal/dialog pattern exists anywhere in the app.** The only
  precedent for progressive disclosure is the existing
  `showAssumptions` boolean (`useState`) driving the collapsible
  "Assumptions & Disclaimers" section, with a chevron icon indicating
  expanded/collapsed state.
- **The Pot summary card is already accumulating additions from this
  bundle**: item 013 adds a "≈£X in today's money" secondary line, item
  014 adds/edits a hedged caption. This item is the third addition to
  land on the same card.
- The per-person breakdown grid (couple mode) already shows Pension/
  ISA/Other Savings/Total per person, directly above/near the household
  cards.
- Next intent number available: 015.

## Outcome

Resolved via `grilling`:

1. **Scope — the Pot figure only.** Of the app's headline numbers, only
   Total/Combined Pot gets an "Explain this" button in this bundle. It's
   the one figure the roadmap's own example actually describes (a
   stock value with a genuine, non-obvious accumulation history), and
   it's the only headline figure without an existing breakdown already
   visible: Income's composition (Pension drawdown vs. State Pension)
   is already shown, unexpanded, in the Living Standard card. Extending
   this to per-person figures was considered and rejected — it would
   double the work for a Low-priority item without a clear additional
   payoff.
2. **Mechanism — reuse the existing collapse/expand pattern.** A
   `useState` boolean plus chevron icon, expanding the breakdown inline
   beneath the Pot card — the same interaction `showAssumptions` already
   uses for "Assumptions & Disclaimers." No modal/dialog/popover is
   introduced; the app has no existing precedent for one, and the
   roadmap's own phrasing ("click... → see...") doesn't require it.
3. **Computation — a post-hoc reconstruction helper, `projectJoint()`
   untouched.** A separate function walks the existing per-year data
   array from today to `bothYear`, using:
   - **Starting balance**: today's actual input balances (`pensionPot`,
     `cashIsaBalance`, `ssIsaBalance`, `lisaBalance`, other-savings
     balances) for both people, summed.
   - **Contributions**: computed directly from the known input
     contribution rates (rate × 12 × years elapsed per account/person)
     — deterministic, not reconstructed from balance deltas.
   - **Withdrawals**: summed directly from each row's existing
     `pensionWithdrawal`/`isaWithdrawal`/`otherSavingsWithdrawal`
     fields, for years before `bothYear` (nonzero only for staggered
     couple retirement).
   - **Growth**: the residual — `endBalance − startBalance −
     contributions + withdrawals` — not tracked directly anywhere.
   This matches the constraint already established across 013/014:
   `projectJoint()` and its output shape stay unchanged; this is a
   display-layer computation over values (and known inputs) the app
   already has.
4. **Granularity — one aggregate line per category, not per-person or
   per-account.** The breakdown shows four lines total — "Starting
   balance / Contributions / Growth / Withdrawals" — summed across both
   people and all account types, in both individual and couple mode.
   Splitting by person (b) or by person-and-account-type (c) was
   rejected: that level of detail already exists in the per-person
   breakdown grid sitting elsewhere on the page: this feature answers
   "how did we get to this number," not "what does the current balance
   split look like."
5. **Zero-value lines stay visible.** All four category lines are always
   shown, including "Withdrawals: £0" when nothing was drawn down before
   `bothYear`. Unlike other conditionally-hidden UI in the app (e.g.
   `VerdictHero` omitting a State-Pension mention when there isn't one
   yet), a £0 withdrawals line is itself informative here — it tells the
   user directly that no drawdown had started by this point.
6. **Stacking with items 013/014 — nominal only, flagged for the shared
   spec.** The expanded breakdown's four figures are shown in nominal
   terms only — no today's-money equivalents per line (013's scope
   already excludes denser displays from dual-treatment for the same
   reason: added complexity for a secondary disclosure feature). Because
   the Pot card now carries three bundle additions (013's secondary
   line, 014's hedged caption, this item's expand button/breakdown), the
   shared spec needs to lay out the final card structure explicitly to
   confirm it still reads sensibly with all three present.

## Non-goals

- No breakdown for any headline figure other than Pot (decision 1) —
  Income, Living Standard, and the per-person grid are untouched.
- No modal, dialog, or other new disclosure UI pattern (decision 2).
- No change to `projectJoint()` or its output shape (decision 3) — a
  separate, display-layer reconstruction helper only.
- No per-person or per-account-type breakdown rows (decision 4).
- No today's-money treatment inside the expanded breakdown (decision 6)
  — stacks with 013/014 visually, not computationally.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` bump happens once
  for the whole bundled delivery (per `intent/013`'s Constraints), not
  repeated here.
- The new breakdown-reconstruction helper is module-level, matching
  `CLAUDE.md` §5.3's convention for `SliderWithInput`, `PersonInputs`,
  `ChartTooltip`, `WealthChart`, `IncomeChart` and `VerdictHero`.
- `docs/TOOL_DOCUMENTATION.md` §3 should document the "Explain this"
  breakdown and its four categories; §5.4's verification checklist
  should gain an item confirming `startingBalance + contributions +
  growth − withdrawals === totalPot` reconciles exactly for a range of
  individual- and couple-mode fixtures, since decision 3's residual
  growth calculation is new logic even though it doesn't touch
  `projectJoint()` itself.
- The shared spec must resolve decision 6's card-layout question (three
  bundle additions on one card) before implementation.
