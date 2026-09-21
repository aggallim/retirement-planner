# 014 — Confidence/risk language instead of false precision

## Status

Resolved via the `grilling` skill, run in two rounds. Second of five
bundled Wave 1 items (9, 20, 17, 18, 10) — see
`intent/013-today-vs-nominal-money.md`'s Status section for the bundling
decision. This item interacts directly with 013 (decision 4 below), since
both touch the same summary cards.

## Problem

Raised via the project's Notion roadmap — Low priority item #20:
"Confidence/risk language instead of false precision — 'your plan
currently supports a target retirement around age 58 under these
assumptions' rather than 'you can retire at 58.'" The roadmap page itself
notes this "rides along with items 1 and 2 rather than needing its own
build."

What's actually there today:

- **Item 1 (roadmap) already shipped this, partially.**
  `intent/done/011-can-i-retire-headline.md` decision 6 explicitly
  borrowed this item's wording convention for the "Can I retire?"
  headline: `"Under these assumptions, your plan currently supports
  retiring at ${ages}."` / `"...could support retiring as early as
  ${ages}."` — described there as "pure phrasing with no computation
  behind it," deliberately reusable. The headline's own status badge
  (on-track/needs-attention) deliberately stayed a "clear, unambiguous
  badge," with only the supporting sentence hedged (011 decision 6).
- **Other flat, unhedged statements exist elsewhere on the results
  page**, stated as plain fact next to precise-looking numbers:
  - `"Sustainable, year one"` (sticky bar) and `"Sustainable annual
    income, first year both retired"` (Income summary card caption).
  - `VerdictHero`'s own insight lines: `"Your pot is projected to last
    beyond your plan horizon."` / `"Your pot is projected to run out in
    ${fundedTo} — ${n} years before your plan horizon of ${planEnd}."`
    / `"You have a ${n}-year buffer past your target retirement
    age(s)."` — already partially hedged ("projected to") but not
    aligned with the headline's specific "under these assumptions"
    convention.
- **The warning banner is a separate, deliberately blunt component** —
  allowance breaches, a State Pension gap, income below minimum living
  standard, funds running out early — styled as an urgent red callout
  (`spec/done/008-dismissable-warning-banner.md`).
- **The Living Standard verdict is a categorical badge**
  (Minimum/Moderate/Comfortable/etc., `livingStandard.level`), not a
  numeric prediction — structurally similar to the headline's own
  on-track/needs-attention badge.
- **Item 013 (this bundle) adds a second line to the same summary
  cards** — a today's-money equivalent under the Pot/Income figures —
  landing in the same small card as this item's hedged captions.
- Next intent number available: 014.

## Outcome

Resolved via `grilling`:

1. **Scope — summary-card captions and `VerdictHero` insight lines, not
   the warning banner.** The `"Sustainable..."` captions on the Pot/
   Income summary cards, and `VerdictHero`'s insight lines, get hedged
   to match the headline's convention. The warning banner is
   deliberately left alone: it exists to prompt action on something
   wrong (an allowance breach, an income shortfall, funds running out),
   and softening `"Funds projected to run out in 2071, before plan end
   (2078)"` into hedged language would blunt a message that's supposed
   to read as urgent.
2. **Wording — reuse the headline's exact vocabulary, don't invent
   parallel phrasing.** Wherever it fits naturally, hedged copy reuses
   "under these assumptions" / "currently" verbatim from item 011's
   established convention, rather than each site finding its own
   rewording. One consistent hedge phrase across the results page reads
   as a deliberate product decision; several slightly different hedges
   would read as inconsistency — undermining the point of the change.
3. **The Living Standard badge itself stays plain and confident —
   only the surrounding captions get hedged.** This mirrors 011
   decision 6's own split for the on-track/needs-attention badge: a
   categorical classification is a direct read of a computed number,
   not a prediction, so hedging the badge text itself would undercut
   the "clear verdict" the roadmap's own item #1 asked for. Hedging
   applies to the prose around it (e.g. the income caption), not the
   badge/level text.
4. **Interaction with item 013's today's-money line — two separate
   lines, not merged.** On the Pot/Income summary cards, item 013 adds
   an "≈ £X in today's money" secondary line and this item adds/edits a
   hedged caption. These stay as two distinct lines rather than being
   combined into one longer sentence: they answer different questions
   (is this figure certain? / what's it worth in today's terms?), and
   merging them risks burying the today's-money figure — which 013
   deliberately made a visually distinct line, not inline prose — in a
   run-on caption. Flagged explicitly for the shared spec, since both
   items land in the same card markup.

## Non-goals

- No change to the warning banner's wording or tone (decision 1) — it
  stays deliberately blunt.
- No softening of the Living Standard classification badge itself
  (decision 3) — only its surrounding captions change.
- No real confidence intervals or probabilistic modelling — as
  `intent/done/011-can-i-retire-headline.md`'s own non-goals already
  state, this is a wording change, not a change to the underlying
  deterministic model. Nothing in this item alters that.
- No new computation of any kind — this item is a pure copy/wording
  pass over text the app already renders from values it already
  computes.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` bump happens once
  for the whole bundled delivery (per `intent/013`'s Constraints), not
  repeated here.
- `SliderWithInput`, `PersonInputs`, `ChartTooltip`, `WealthChart`,
  `IncomeChart` and `VerdictHero` stay module-level and memoised
  (`CLAUDE.md` §5.3); this item only changes string literals within
  already-module-level components, no new components.
- `docs/TOOL_DOCUMENTATION.md` §3 should document the hedge-language
  convention as a named, reusable pattern (echoing how 011 introduced
  it) so future roadmap items that touch confidence/precision (e.g.
  item #2 Monte Carlo, item #7 sensitivity analysis — neither in this
  bundle) have something concrete to extend rather than re-deriving the
  wording from scratch.
- No new §5.4 verification checklist item expected — no calculation
  changes.
