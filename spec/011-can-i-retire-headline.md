# 011 — "Can I retire?" headline verdict

## Status

Resolved — ready for implementation. Fleshed out from
`intent/011-can-i-retire-headline.md`, whose grilling interview (two
rounds) left no open branches; this spec is about concrete mechanics only.

## Problem

See `intent/011-can-i-retire-headline.md`. Relevant code today:

- `projectJoint()` (`index.html:1647+`) — the pure engine. Takes each
  person's `retirementAge` as a fixed field on `person1`/`person2`; never
  searches over it.
- `longevity` (`index.html:2165-2191`) — a `useMemo` computing
  `firstRet` (earliest of the household's retirement years), `planEnd`
  (latest of the household's life-expectancy years), `depleted` (first
  year, scanned from `firstRet` onward, where
  `totalPension + totalIsa + totalOtherSavings < 1000`), and a
  three-state `status`/`message` (`excellent` / `warning` / `critical`,
  the latter two when `depleted` falls at or before `planEnd`, split by
  whether the shortfall is more or less than 10 years early).
- `warnings` (`index.html:2192-2207`) already reuses
  `longevity.depleted`/`longevity.planEnd` for one of its lines — the same
  underlying test this spec reuses for the headline verdict.
- The "Longevity Analysis" card (`index.html:2672-2697`) renders
  `longevity.status`/`message`/progress bar. This is the section decision
  4 promotes into the new hero and then deletes from its current location.
- The top-of-results card row — Retirement Years, Combined/Total Pot,
  Household Income, Living Standard (`index.html:2426+`) — sits directly
  below the warning banner today; decision 4 moves it below the new hero
  instead.
- `SliderWithInput`'s `retirementAge` field is bounded to
  `min: Math.max(50, person.currentAge + 1), max: 75` (`index.html:1126-
  1127`) — the bound decision 3's search reuses.
- `formatCurrency`, `PLSA`, `livingStandardFor` and the `X`/`CheckCircle`/
  `AlertTriangle` icon components already exist and are reused, not
  reinvented.

## Outcome

### 1. `planSucceeds()` — extract the shared success test

A small pure helper, placed directly after `projectJoint()`
(`index.html:1647+`), factoring out the test `longevity` and `warnings`
already duplicate:

```js
// Same £1,000/first-retirement/longer-life-expectancy test longevity
// already uses (spec/done/011-can-i-retire-headline.md) — extracted so
// the supportable-age search can reuse it without duplicating the rule.
const planSucceeds = (projections, firstRet, planEnd) => {
  for (const r of projections) {
    if (r.year < firstRet) continue;
    if (r.totalPension + r.totalIsa + r.totalOtherSavings < 1000) {
      return r.year > planEnd;
    }
  }
  return true;
};
```

`longevity`'s own `depleted`/`fundedTo`/`status`/`message` computation is
otherwise unchanged — it's presentation detail the hero still needs
(decision 4 moves the card, doesn't change what it shows). `planSucceeds`
is the boolean the new verdict and the search both need.

### 2. `findSupportableDelta()` — the age-search wrapper

Placed alongside `planSucceeds`, also module-level, also a pure function
— `projectJoint()` itself is untouched:

```js
// Bidirectional shared-delta search (intent/011 decision 3). Individual
// mode is just this same function with person2 === null — no special
// case needed. A linear scan, not binary search: projectJoint()'s
// success isn't provably monotonic in retirement age (State Pension
// timing, the LISA age-60 threshold), and the scan range is small
// (at most 25 integer years) so the extra safety costs nothing.
const findSupportableDelta = (engineArgs, currentlySucceeds) => {
  const people = [engineArgs.person1, engineArgs.person2].filter(Boolean);
  const bound = p => [Math.max(50, p.currentAge + 1), 75];
  const maxDelta = Math.min(...people.map(p => bound(p)[1] - p.retirementAge));
  const minDelta = Math.max(...people.map(p => bound(p)[0] - p.retirementAge));
  const evaluate = delta => {
    const bump = p => p && { ...p, retirementAge: p.retirementAge + delta };
    const person1 = bump(engineArgs.person1);
    const person2 = bump(engineArgs.person2);
    const projections = projectJoint({ ...engineArgs, person1, person2 });
    const firstRet = Math.min(...[person1, person2].filter(Boolean).map(p => CURRENT_YEAR + (p.retirementAge - p.currentAge)));
    const planEnd = Math.max(...[person1, person2].filter(Boolean).map(p => CURRENT_YEAR + (p.lifeExpectancy - p.currentAge)));
    return planSucceeds(projections, firstRet, planEnd);
  };
  if (currentlySucceeds) {
    // Earliest workable retirement: scan from the most negative delta
    // upward, first success wins (handles non-monotonic gaps safely).
    if (minDelta >= 0) return null; // already at the floor for everyone
    for (let delta = minDelta; delta < 0; delta++) {
      if (evaluate(delta)) return delta;
    }
    return null;
  } else {
    // Smallest fix: scan outward from 0, first success wins.
    if (maxDelta <= 0) return null; // already at the ceiling for everyone
    for (let delta = 1; delta <= maxDelta; delta++) {
      if (evaluate(delta)) return delta;
    }
    return null; // no in-range delta fixes it
  }
};
```

`null` means "no supportable age found within typical limits" (decision
3) — the succeeding branch returns `null` when the plan already succeeds
at every in-range delta (nothing earlier to find within bounds); the
failing branch returns `null` when nothing in range fixes it.

### 3. `verdict` — the new top-level memo

Added in `RetirementCalculator` alongside `longevity`
(`index.html:2165+`), depending on it:

```js
const verdict = useMemo(() => {
  const succeeds = planSucceeds(projections, longevity.firstRet, longevity.planEnd);
  const engineArgs = {
    inflationRate: d.infl, withdrawalRate: d.wr, annualExpenses: d.exp,
    healthcareCosts: d.hc, mortgagePayment: d.mp, mortgageYears: d.my,
    person1: d.p1, person2: d.partner ? d.p2 : null
  };
  const supportableDelta = findSupportableDelta(engineArgs, succeeds);
  return { succeeds, supportableDelta };
}, [projections, longevity.firstRet, longevity.planEnd, d.infl, d.wr, d.exp, d.hc, d.mp, d.my, d.p1, d.p2, d.partner]);
```

`verdict.supportableDelta` is `null` (no figure to show) or an integer
(negative = "could retire earlier", positive = "would need to retire
later", per decision 3). Displayed ages are simple arithmetic —
`d.p1.retirementAge + verdict.supportableDelta` (and `d.p2`'s, in couple
mode) — not a separate stored value.

### 4. Hero component — replaces the Longevity Analysis card

A new module-level, memoised component (`VerdictHero`, alongside
`WealthChart`/`IncomeChart` per `CLAUDE.md` §5.3), rendered where the
Longevity Analysis card is today (`index.html:2672`), containing:

1. **Status badge** — direct, unhedged (decision 6): reuses
   `longevity.status`'s icon convention (`CheckCircle` for
   `excellent`/succeeding, `AlertTriangle` otherwise) and colour classes
   (`sc.t`/`sc.b`/`sc.br` already computed at `index.html:2196-2207+`).
   Label: "On track" / "Needs attention" (exact copy is a UI-polish
   decision, not a spec-level one — the structural point is the badge
   itself never contains a hedge word).
2. **Headline sentence** — hedged (decision 6): "Under these assumptions,
   your plan currently supports retiring at {age}" when `succeeds` and no
   earlier alternative was found; "...could support retiring as early as
   {age}" when `succeeds` and `supportableDelta !== null`; "...doesn't
   currently support retiring at {age} — retiring at {age + delta} would"
   when `!succeeds` and `supportableDelta !== null`; "...doesn't currently
   support retiring at {age}, and no later retirement age within typical
   limits fixes this" when `!succeeds` and `supportableDelta === null`. In
   couple mode, "{age}" becomes each person's own age
   (`retirementAge`/`retirementAge + delta`), joined per the app's
   existing "Name at age" convention (e.g. `index.html:2442`).
3. **Insights panel** — decision 5, lightweight rule-based callouts, e.g.:
   - If `!succeeds`: "Your pot runs out in {longevity.depleted} — {planEnd
     - depleted} years before your plan horizon of {planEnd}."
   - If `succeeds` and `longevity.fundedTo` is the final projection year
     (never depletes): "Your pot is projected to last beyond your plan
     horizon."
   - If `supportableDelta !== null` and negative: "You have a {-delta}-
     year buffer past your target retirement age."
   These reuse `longevity`'s existing fields — no new computation beyond
   what §2/§3 already produce.
4. **Caveat line** (decision 7) — small print beneath the panel, e.g. "Based
   on a fixed average return, no tax on retirement income, and no
   sequence-of-returns risk — see Known limitations in the Assumptions
   panel." (Exact link target is a UI decision; if the Assumptions panel
   doesn't already surface known limitations, a plain non-interactive
   caveat line is sufficient — no new panel is required by this spec.)

The existing progress bar (`index.html:2688-2697`, first-retirement-to-
plan-end) is retained inside the hero, unchanged, since it's presentation
of `longevity` fields the hero still has.

### 5. Card row moves below the hero

The Retirement Years / Combined Pot / Household Income / Living Standard
row (`index.html:2426+`) is unchanged in content and stays directly
following the hero in the results layout — it becomes supporting detail
under the new headline rather than the first thing shown (decision 4).

### 6. `docs/TOOL_DOCUMENTATION.md` updates

- §3.4 ("Reading the outputs", `docs/TOOL_DOCUMENTATION.md:101-107`): the
  "Longevity Analysis" bullet is replaced with a description of the new
  headline verdict (status badge, hedged supportable-age sentence,
  insights panel, caveat), and the "Summary cards" bullet is reworded to
  note they now sit below the verdict as supporting detail.
- New subsection (e.g. §3.4a or folded into §3.4) documenting the
  supportable-age search itself: what it computes, the bidirectional
  behaviour, and the "no supportable age found within typical limits"
  case, in plain language — this is new user-facing behaviour, not just a
  reshuffled section.
- §5.4 (verification) gets new checklist items for `findSupportableDelta`
  even though `projectJoint()` itself is unchanged: a plan that already
  succeeds returns a negative-or-null delta and never a positive one; a
  plan that currently fails returns a positive-or-null delta and never a
  negative one; a delta that would push either person's age outside
  `[max(50, currentAge+1), 75]` is never returned; individual mode
  (`person2 === null`) behaves identically to the general case.
- §7 (known limitations) is referenced by the new caveat line (decision
  7) but not itself changed — its existing limitations (no tax modelled,
  fixed growth rate, etc.) are exactly what the caveat points at.

### 7. `CHANGELOG.md` and `USER_CHANGELOG`

- `CHANGELOG.md` entry under the date this merges, naming
  `intent/011-can-i-retire-headline.md`, covering the new verdict, the
  supportable-age search and its bounds, and the Longevity Analysis
  section's removal in favour of the hero.
- `USER_CHANGELOG` entry in `index.html` (user-facing — the results page's
  layout and headline content visibly change), versioned with whatever
  `sw.js` `CACHE` value this PR bumps to.

### 8. Verification

`findSupportableDelta` is pure and deterministic, so it can be unit-tested
the same way `projectJoint()` is — add cases to `tests/test-engine.js`
covering: a plan already comfortably succeeding (expect a negative delta,
i.e. an earlier workable age, or `null` if already at the floor); a plan
failing but fixable within bounds (expect the smallest positive delta
that fixes it); a plan failing and *not* fixable within `[max(50,
currentAge+1), 75]` even at delta = maxDelta (expect `null`); individual
mode (`person2: null`) producing the same result shape as couple mode
with one person. Manual verification per `CLAUDE.md`'s "No build step"
guidance for the UI/layout pieces:

- A plan that fails today shows "needs attention" with a later supportable
  age, if one exists within bounds.
- A plan that succeeds today shows "on track" plus an earlier supportable
  age, if one exists within bounds.
- Pushing a person's current age close enough to 75 that no earlier (or
  later) delta remains in bounds shows the "no supportable age found"
  copy instead of a number, not a crash.
- The old Longevity Analysis card no longer appears anywhere on the page.
- The card row (Retirement Years/Pot/Income/Living Standard) still renders
  correctly, now below the hero.
- Couple mode's headline reads with both people's ages; individual mode's
  reads with one.

## Non-goals

Carried over unchanged from `intent/011-can-i-retire-headline.md`:

- No change to `projectJoint()`'s calculation model.
- No full sensitivity analysis (roadmap item #7).
- No real confidence intervals behind the hedged language (decision 6) —
  wording only.
- No per-person verdict in couple mode — a single household read only.

## Constraints

Carried over from the intent, made concrete above:

- `VerdictHero` joins `SliderWithInput`/`PersonInputs`/`CustomTooltip`/
  `WealthChart`/`IncomeChart` as a module-level, memoised component per
  `CLAUDE.md` §5.3 — no new inline-component regression risk.
- Single-file PWA constraint holds; bump `CACHE` in `sw.js` on ship.
- `docs/TOOL_DOCUMENTATION.md` (§3.4 and §5.4), `CHANGELOG.md`, and a
  `USER_CHANGELOG` entry all land in the same PR, per `CLAUDE.md`.
- Per the lifecycle, this PR also moves
  `intent/011-can-i-retire-headline.md` and this spec file into
  `intent/done/` / `spec/done/` once implemented and merged, and removes
  `plan.md`.
- `main` now has branch protection requiring a PR — this branch
  (`feature/011-can-i-retire-headline`) already carries the intent commit;
  this spec's commit is pushed to the same branch, and the draft PR is
  opened against `main` from there (not a direct push).

## Open questions

None — both grilling rounds left nothing open. Exact copy/wording for the
hero (badge label text, exact insight phrasing) is left to implementation
as ordinary UI polish, not a spec-level decision.
