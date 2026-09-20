# 011 — "Can I retire?" headline verdict

## Status

Proposed. Resolved via the `grilling` skill, run in two rounds — an initial
pass covering the shape of the feature, and a second pass re-examining two
decisions (supportable retirement age for couples, and verdict language)
where the chosen answer diverged from the recommended one.

## Problem

Raised via the project's Notion roadmap (the declared source of truth for
future work since `intent/done/009-tool-docs-history-cleanup.md` removed
the in-repo "Possible future additions" list) — High priority item #1, the
reviewer's top pick: reframe the results page to lead with plan
sustainability (a clear good/needs-attention verdict, target vs.
supportable retirement age, a "what matters most" insights panel) instead
of leading with a bare pot-size number and charts.

What's actually there today:

- The top of the results page is a card row — **Retirement Years, Combined/
  Total Pot, Household Income, Living Standard (PLSA band)** — with no
  verdict above it.
- A **"Longevity Analysis"** section further down the page already computes
  a three-state verdict (excellent/warning/critical) from the projection:
  `depleted` is the first year, scanned from the household's first
  retirement year onward, at which combined pension + ISA + other savings
  drops below £1,000; the horizon (`planEnd`) is the *longer* of the two
  life expectancies in couple mode. Status is `critical` if funds run out
  more than 10 years before `planEnd`, `warning` if within 10 years, else
  `excellent`.
- There is **no** existing concept of a "supportable" or "achievable"
  retirement age anywhere. `projectJoint()` takes each person's
  `retirementAge` as a fixed input and never searches over it — computing
  one is a genuinely new capability (a wrapper that calls `projectJoint()`
  repeatedly for candidate ages), not a rename or surfacing of something
  that already exists.
- The per-person `retirementAge` input is already UI-bounded to
  `[max(50, currentAge + 1), 75]`.
- Next intent number available: 011.

## Outcome

Resolved via `grilling`:

1. **Success definition — reuse the existing depletion test as-is.** The
   headline verdict is driven by the same test the Longevity Analysis
   section already uses: combined pension + ISA + other savings dropping
   below £1,000 at any point from first retirement onward, against a
   horizon of the longer life expectancy. No new margin/buffer/safety
   window is introduced — that would be an unreviewed assumption this
   requirement doesn't need to make.
2. **Verdict scope — single combined household verdict.** One "Can we
   retire?" read for the household, not a separate verdict per person —
   `projectJoint()` already models the couple's finances together.
3. **Supportable retirement age — computed in both individual and joint
   mode.**
   - Individual mode: holding all other inputs fixed, find the latest
     retirement age at which the plan still succeeds (if it currently
     fails), or the earliest age it could still work (if it already
     succeeds).
   - Joint mode: a **single shared delta** applied equally to both
     people's current retirement ages (e.g. "retire 3 years later than
     currently planned"), not two independently-solved ages.
   - **Bidirectional in both modes**: if the plan currently fails, search
     for the smallest positive delta that fixes it; if it already
     succeeds, search for the largest negative delta that still succeeds.
     A couple that's already on track gets the same "you could actually
     retire earlier" read an individual in the same position would get.
   - **Bounds**: the search is clamped so neither person's resulting age
     leaves the existing per-person slider limits,
     `[max(50, currentAge + 1), 75]` — reusing a constraint that's already
     visible to the user rather than inventing a new one. If no in-range
     delta fixes a currently-failing plan, the feature shows a "no
     supportable retirement age found within typical limits" state
     instead of a number (exact wording is a spec/UI detail).
   - This is new: `projectJoint()` itself is untouched; the search is a
     wrapper that calls it repeatedly for candidate ages/deltas.
4. **The existing "Longevity Analysis" section is promoted, not
   duplicated.** The new top-of-page hero component absorbs its verdict
   and adds the "what matters most" insights panel; the old mid-page
   section is deleted. The existing card row (Retirement Years/Pot/Income/
   Living Standard) moves below the new hero as secondary detail.
5. **Insights panel scope — lightweight, rule-based callouts only.**
   Built from data the engine already produces (e.g. "your pot runs out at
   82 — 6 years before your life expectancy of 88"). No full
   sensitivity-driven analysis ("retiring 2 years later would fix this")
   — that's the separate Medium-priority roadmap item #7, not pulled
   forward into this one.
6. **Verdict language — direct status, hedged detail.** The
   good/needs-attention status itself stays a clear, unambiguous
   badge/icon/colour (reusing decision 1's existing excellent/warning/
   critical-style status), satisfying the roadmap item's own ask for "a
   clear good/needs-attention verdict." The supporting sentence that states
   a specific age uses hedged/probabilistic framing per roadmap Low-priority
   item #20's convention — e.g. "Under these assumptions, currently
   supports retiring around age 58" — rather than a flat "Yes, retire at
   58." This borrows item #20's wording convention intentionally: unlike
   item #7 (an uncomputed dependency), item #20 is pure phrasing with no
   computation behind it, so there's nothing substantive being pulled
   forward, only a word choice.
7. **Caveat the verdict against known model limitations.** A short inline
   caveat/link sits near the verdict noting the model's known
   simplifications (no retirement income tax, a fixed average return, no
   sequence-of-returns risk, no working-partner salary offset) — this is
   precisely the headline users will trust most, so it's the one place a
   caveat earns its keep.

## Non-goals

- No change to `projectJoint()`'s calculation model. Decision 3's
  supportable-age search calls the existing engine repeatedly with
  different candidate retirement ages/deltas; it doesn't alter how any
  single projection is computed.
- No full sensitivity analysis (multi-factor "what would fix this"
  insights) — stays roadmap item #7's job, not pulled into this one.
- No real confidence intervals or probabilistic modelling behind decision
  6's hedged language — the wording changes, not the underlying
  deterministic model. Item #20 remains free to build something more
  substantive later without this item's structure needing to change.
- No per-person verdict in couple mode (decision 2) — a single household
  read only.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` gets bumped per the
  usual deploy convention, since this is user-facing.
- `SliderWithInput`, `PersonInputs`, `CustomTooltip`, `WealthChart` and
  `IncomeChart` stay module-level and memoised (`CLAUDE.md` §5.3); any new
  hero/insights component follows the same pattern.
- This introduces a new, non-trivial calculation-adjacent code path (the
  age/delta search wrapper around `projectJoint()`), so
  `docs/TOOL_DOCUMENTATION.md` §5.4's verification checklist needs a new
  item for it even though `projectJoint()` itself is unchanged, alongside
  the usual §3/§4 updates for the new verdict, hedged-language convention,
  and supportable-age search.
- `docs/TOOL_DOCUMENTATION.md` §7 (known limitations) should reference the
  new inline caveat (decision 7) rather than duplicate its wording.
