# 001 — Engine test harness

## Status

Proposed.

## Problem

The financial engine (`projectJoint()`) has no automated tests. Every check
currently listed in `docs/TOOL_DOCUMENTATION.md` §5.4 ("Verification") was
done by hand, once, at the end of a build pass — there's nothing in the repo
that re-runs those checks when the code changes again.

That gap has already cost real accuracy. §8 of the same doc ("Build
history") lists nine separate defects found in a single after-the-fact
review, several of which are exactly the kind of thing a small unit test
would have caught immediately instead of shipping silently:

1. The 25% lump sum was calculated for display but never actually applied
   to the projection — pension balances were 25% overstated.
2. The 4% withdrawal rule was implemented as 4%-of-declining-balance each
   year instead of a fixed initial amount uprated by inflation.
3. Target expenses were calculated inconsistently between the projection
   and the income chart (mortgage in vs. out).
4. The wealth chart started one year late — showing balances after a year
   of growth instead of today's actual figures.
5. Retirement balances stopped growing after withdrawals began, understating
   how long the money would last.
6. PLSA and State Pension reference figures went stale and needed refreshing.

(The remaining three fixes in §8 — an always-zero field feeding the income
chart, a `BarChart`/`Line` combination that silently dropped the expenses
line, and unevenly-scaled gauge thresholds — are rendering bugs in the React
layer, not the engine. A `node` script exercising `projectJoint()` in
isolation can't catch those; see Non-goals.)

Every one of the six engine-layer defects above is a regression that had
already been "fixed" once, informally, and could silently come back the
next time someone touches the calculation code — which, per
`CLAUDE.md`, means editing generated JS directly inside an 844 KB
`index.html`. There is currently nothing that would fail loudly if it did.

## Outcome

A `test-engine.js` script, runnable with a bare `node test-engine.js` (no
install step, no config, exit code 0/1), that exercises `projectJoint()`
directly and asserts, at minimum, the full checklist already specified in
`docs/TOOL_DOCUMENTATION.md` §5.4:

- Opening balances appear at the current age with no phantom year of growth.
- Monthly compounding matches an independently-computed manual calculation
  exactly.
- The 25% lump sum leaves precisely 75% of the pre-lump-sum balance in the
  pension, and the other 25% lands in the ISA.
- The 4% rule fixes the withdrawal amount in the retirement year and
  uprates it by inflation thereafter — it must **not** be recalculated as a
  percentage of the declining balance in later years.
- Mortgage debt clears in exactly the specified year, and mortgage payments
  drop out of target expenses from that year onward.
- The State Pension starts in the correct year for each person and is
  correctly inflation-uprated from today.
- Joint-mode combined totals reconcile exactly against the sum of the two
  individual pots.
- Depletion (combined pension + ISA < £1,000, from first retirement onward)
  is detected correctly in a deliberately under-funded scenario.
- Individual-mode results are byte-for-byte identical to a known-good
  baseline — the regression guard the original build called out as
  mattering most, since it's the easiest one to break silently while
  working on joint-mode logic.

Running `node test-engine.js` after any change to `projectJoint()` should be
enough to catch a reintroduction of any of the six engine-layer defects
listed above.

### Non-goals

- **Not a UI or rendering test.** The three build-history defects that were
  React/Recharts wiring bugs (wrong field name, `BarChart`+`Line`
  combination, gauge scale) are out of scope. `docs/TOOL_DOCUMENTATION.md`
  §5.4 already notes the built PWA gets a manual headless-browser smoke
  check separately — this intent doesn't replace or automate that.
- **Not a coverage target.** The goal is "the nine known failure modes
  can't come back unnoticed," not exhaustive coverage of the engine.

## Constraints

- **No build tooling.** There is no `package.json`, no bundler, no test
  runner dependency, and per `CLAUDE.md` that's a deliberate choice, not a
  gap to fill. `test-engine.js` must run under plain Node with whatever
  ships in it (e.g. `node:assert`) — no `npm install` step.
- **The deployed app must stay a single `index.html`.** GitHub Pages hosts
  that one file as-is with no build step (`.github/workflows/pages.yml`
  just copies the repo root). Whatever this test harness needs to do to get
  at `projectJoint()` cannot turn the hosted artifact into multiple files
  or introduce a compile/bundle step before deploy.
- **`index.html` is already a precompiled artifact.** Per `CLAUDE.md`,
  there is no separate `.jsx` source in this repo — `index.html` contains
  `React.createElement(...)` calls, not JSX, and there's no in-browser
  Babel to lean on. `test-engine.js` needs some way to get a runnable
  `projectJoint()` out of that file (e.g. extracting and evaluating the
  relevant section, or another approach) without depending on a browser DOM,
  since Recharts/React/the DOM are not available under plain `node`. Exactly
  how it gets there is a design decision for the follow-up implementation,
  not settled by this document.
- **Keep it debuggable by hand.** Given the history here, a test that fails
  should point clearly at which of the checklist items broke — a single
  pass/fail bit for the whole script isn't enough to trust it.
