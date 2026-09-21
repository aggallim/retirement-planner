# 016 — Plain-language terminology pass

## Status

Resolved via the `grilling` skill, run in one round. Fourth of five
bundled Wave 1 items (9, 20, 17, 18, 10) — see
`intent/013-today-vs-nominal-money.md`'s Status section for the bundling
decision. This item's decision 1(c) makes it explicitly review the new
copy introduced by 013/014/015.

## Problem

Raised via the project's Notion roadmap — Low priority item #18:
"Plain-language terminology pass — e.g. 'Estimated portfolio value' not
'Projected nominal portfolio value' — with the technical detail moved
into a tooltip rather than removed." Described on the roadmap itself as
"low effort, real readability win; doesn't unlock anything else on its
own."

What's actually there today:

- **The roadmap's literal example string doesn't exist anywhere in the
  app** — it's illustrative, not a quote of current copy.
- **Input sliders already mostly follow the plain-label-plus-tooltip
  convention.** E.g. `"Safe Withdrawal Rate"` already carries a tooltip
  ("The 4% rule: withdraw 4% of the pot in year one, then increase with
  inflation each year.") via the existing `tooltip` prop on
  `SliderWithInput`, reusing a hover-triggered `tooltip-trigger`/
  `tooltip-content` CSS pattern already used across ~10 other inputs
  (ISA/LISA/pension allowance explanations, etc.).
- **One clear, un-tooltipped jargon instance exists in results-page
  prose**: `VerdictHero`'s caveat sentence states "no sequence-of-returns
  risk" as plain visible text, with no tooltip or plain-language
  rewording — the exact pattern the roadmap's own example describes.
- **No other comparably technical un-tooltipped terms were found** in
  user-facing copy during this item's fact-finding (searched for
  "drawdown", "compounding", "amortisation", "glidepath", "de-risk",
  "annuit" — all either don't appear in user-facing text, or only in
  code comments).
- **`docs/TOOL_DOCUMENTATION.md`'s own known-limitations wording** also
  uses technical terms like "sequence-of-returns risk" — but that's
  developer/spec documentation, not user-facing app copy, so it's a
  different audience with different needs.
- **This bundle's other four items (013, 014, 015, and the not-yet-
  drafted 017) are all adding new user-facing copy** to the same results
  page in the same PR — a today's-money caption, hedge-language
  sentences, breakdown category labels, and (017) privacy messaging.
- Next intent number available: 016.

## Outcome

Resolved via `grilling`:

1. **Scope — a targeted results-page prose pass, not a full slider
   re-audit.**
   - Fix the one located instance: `VerdictHero`'s "no sequence-of-returns
     risk" caveat sentence gets reworded to plain language, with the
     technical term and its full explanation moved into a tooltip.
   - During implementation, apply the same plain-language-plus-tooltip
     principle to any other comparably technical, un-tooltipped phrase
     encountered in user-facing results-page prose — this item doesn't
     require an exhaustive line-by-line audit beyond the one instance
     already found, since none turned up in fact-finding.
   - Review the new copy items 013, 014, and 015 introduce in this same
     bundle (today's-money captions, hedge-language sentences, and
     "Starting balance / Contributions / Growth / Withdrawals" breakdown
     labels) against this same plain-language standard before the PR
     ships, catching any jargon those items' own drafting introduced.
   - A full re-audit of every input slider/tooltip in the app — even
     ones that already follow the convention — is explicitly out of
     scope: nothing concrete drives it, and it's real scope creep for a
     "low effort" item.
2. **Mechanism — reuse the existing tooltip pattern verbatim.** The
   visible sentence is rewritten in plain language; the technical term
   and its detail move into a tooltip using the same
   `tooltip-trigger`/`tooltip-content` hover mechanism already used for
   slider tooltips (not a new disclosure pattern). The app already has
   exactly one hover-tooltip convention and one click-to-expand
   convention (the latter reused by item 015) — this reuses the former
   rather than introducing a third UI idiom.
3. **`docs/TOOL_DOCUMENTATION.md`'s own technical wording is untouched.**
   Developer/spec documentation is a different audience with different
   needs; "sequence-of-returns risk" and similar terms stay as-is there
   even as the equivalent user-facing sentence changes.

## Non-goals

- No full audit or rewording of input sliders/tooltips that already
  follow the plain-label-plus-tooltip convention (decision 1).
- No change to `docs/TOOL_DOCUMENTATION.md`'s own technical language
  (decision 3) — user-facing copy only.
- No new disclosure UI pattern (decision 2) — reuses the existing
  tooltip mechanism.
- No calculation or engine changes of any kind — this item is a pure
  copy/wording pass.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` bump happens once
  for the whole bundled delivery (per `intent/013`'s Constraints), not
  repeated here.
- No new module-level components are introduced; this item only edits
  string literals and adds `tooltip` props within already-module-level
  components (`VerdictHero`).
- No new §5.4 verification checklist item expected — no calculation
  changes.
- Because decision 1's third bullet makes this item's implementation
  depend on 013/014/015's copy already being drafted, this item's
  implementation should run after those three (or at minimum after
  their spec sections are written), even though all four share one
  spec/plan/PR.
