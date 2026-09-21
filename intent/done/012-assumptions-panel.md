# 012 — Explorable assumptions panel

## Status

Resolved via the `grilling` skill, run across four rounds: process-level
decisions for delivering the rest of Wave 1 (items 6, 9, 20, 17, 18, 10) as
separate requirements built with subagents, then this item's own content
decisions.

## Problem

Raised via the project's Notion roadmap (Wave 1, item #6, Medium priority):
"Make model assumptions prominent and explorable — a 'Your projection
assumes...' panel next to the main result (return, inflation, retirement
age, life expectancy, spending, State Pension), each assumption clickable
through to where it's set." Reviewer's reasoning: a headline result reads
as fact unless the assumptions behind it are equally visible.

What's actually there today:

- The "Can I retire?" headline (`intent/done/011-can-i-retire-headline.md`)
  sits at the top of the results page, with a short inline caveat that
  links to "the Assumptions panel."
- An existing, collapsed-by-default "Assumptions & Disclaimers" section
  sits at the very bottom of the results page (`showAssumptions` state),
  covering: the joint planning model, investment growth (generic text, not
  actual figures), the safe withdrawal rate mechanics, PLSA bands (2025/26
  reference figures), the State Pension reference figure, allowances, and a
  legal disclaimer. None of its content is interactive or clickable — it's
  what item 1's caveat link currently points at.
- The model has no single "return" figure: growth rates are set per
  account type (Cash ISA, Stocks & Shares ISA, LISA, Pension) and per
  person, via a shared `GrowthProfile` component — up to 8 distinct values
  in couple mode.
- Inflation and Annual Expenses (excluding mortgage) are single shared
  household figures, set once regardless of individual/couple mode.
- Retirement age, life expectancy and State Pension age are set per
  person; couple mode can have differing values for each.
- No DOM anchors/ids exist on individual input cards today — scroll-to/
  highlight-on-click is new interaction plumbing, not a reuse of something
  that already exists.
- Next intent number available: 012.

## Outcome

Resolved via `grilling`:

1. **Delivery process for the rest of Wave 1** (applies to this and the
   next five items — 9, 20, 17, 18, 10 — in the roadmap's stated order):
   - Each item is its own requirement: own intent, own spec, one branch,
     one PR — matching how item 1 (011) already shipped, not a single
     combined "wave" requirement, even though the roadmap frames the wave
     as "one coordinated redesign."
   - Intent (this grilling) and the mechanical branch/PR-open/PR-ready
     steps are handled directly; the spec, the plan, and the
     implementation (+ test + docs/changelog) stages are each delegated to
     a dedicated subagent.
   - No intermediate approval checkpoint between stages — each subagent's
     output is reviewed directly and the pipeline runs straight through to
     the draft PR, where GitHub's required review/status-check gate
     applies as usual.
   - Fully sequential across items: one item's PR is merged (by the user,
     not the agent) before the next item's work starts, since this is a
     single-file app and every Wave 1 item touches the same results-page
     region — parallel branches would conflict.
2. **New panel, existing section untouched.** A new, compact panel is
   added near the item-1 headline, listing exactly the 6 roadmap-named
   categories. It does not absorb or replace the existing bottom
   "Assumptions & Disclaimers" section — that section's content (PLSA
   bands, allowances, the joint-model explanation, the legal disclaimer)
   isn't something the user "set" and has nothing to link through to. The
   new panel links down to the existing section for full detail; item 1's
   existing inline caveat link (currently pointing at the old section) is
   repointed at the new panel.
3. **One simplified line per category, not the full per-account
   breakdown.** Couple-mode values are shown as a per-person pair only
   where the underlying figure is genuinely per-person (retirement age,
   life expectancy, State Pension age, pension growth rate); inflation and
   spending are shown as the single shared figure they already are. The
   panel does not attempt to surface all 8 possible growth-rate values (4
   account types × 2 people) — "return" is represented by each person's
   pension growth rate, the figure most directly tied to retirement
   outcomes. The full per-account figures remain reachable via the
   `GrowthProfile` controls themselves and via the linked full-assumptions
   section.
4. **Click-through behaviour: scroll + highlight, uniformly.** Clicking
   any panel line smooth-scrolls the page to the relevant input card and
   briefly highlights it, the same way on both desktop and mobile layouts
   — no layout-conditional behaviour (e.g. suppressing it on desktop
   because inputs are "already visible" in the multi-column layout) is
   introduced, since the page can be long enough that the target is
   off-screen either way.

## Non-goals

- No change to `projectJoint()` or any calculation logic — this is a
  display/navigation feature built on state the app already computes.
- No attempt to show every underlying growth-rate figure (4 account types
  × 2 people) in the new panel — decision 3.
- No removal or restructuring of the existing "Assumptions & Disclaimers"
  section — decision 2.
- No combined "wave" requirement — decision 1 keeps this and the
  remaining 5 Wave 1 items as separate intents/specs/branches/PRs.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` gets bumped, since
  this is user-facing.
- `SliderWithInput`, `PersonInputs`, `CustomTooltip`, `WealthChart` and
  `IncomeChart` stay module-level and memoised (`CLAUDE.md` §5.3); the new
  panel component follows the same pattern.
- Adding scroll/highlight targets means adding `id`/`ref` anchors to
  existing input cards — a small, additive DOM change, not a
  restructuring of `PersonInputs` or the shared-assumptions cards.
- `docs/TOOL_DOCUMENTATION.md` needs a §3 (user guide) update describing
  the new panel; since it only reads state the engine already computes
  and adds no new calculation, no new §5.4 verification checklist item is
  expected, but the spec should confirm that once the panel's data
  derivation is concrete.
- This session develops on the harness-assigned branch
  `claude/pensive-newton-rymumn` rather than a freshly created
  `feature/012-...` branch, per `CONTRIBUTING.md`'s "Agent sessions bound
  to a pre-named branch" section — branch creation is skipped for this
  first Wave 1 item. Later Wave 1 items in this session restart that same
  branch from the latest `main` after each item's PR merges, per the
  merged-branch-restart convention already established for this session.
