# Plan — 013 Wave 1 bundle (items 013–017)

Breaks `spec/013-wave-1-bundle.md` into an ordered implementation sequence
inside `index.html` (+ `sw.js`, `tests/test-engine.js`,
`docs/TOOL_DOCUMENTATION.md`, `CHANGELOG.md`). This file does not re-derive
any decision — every exact signature/JSX/copy below is copy-pasted or
lightly paraphrased from the spec; **when in doubt, the spec's own section
number cited beside each step is the source of truth, not this file.**

Five items, one branch/PR/build version (`sw.js` v11 → v12), with real
dependencies: 013 (today's-money) lands first because 014's captions and
015's final Pot-card layout both edit/extend regions 013 creates; 016's
copy review has to happen after 013/014/015's copy exists; 017 is the one
genuinely independent item and touches different parts of the file
entirely (icon set, footer, `SettingsMenu`).

Commit and push after each phase's checkpoint (not just at the very end) —
this branch already has an open draft PR per `CONTRIBUTING.md` step 4;
every push updates it, same precedent as item 012's delivery (five commits:
scaffolding → DOM ids → main build → docs/changelogs → cleanup).

No build step, so "checkpoint" below means: reload `index.html` directly
(or `python3 -m http.server 8000`) and eyeball it, plus
`node tests/test-engine.js` wherever an engine-adjacent function changed.
**index.html must stay syntactically valid React after every single edit**
— prefer several small, always-loadable edits over one giant one, per
`CLAUDE.md`'s "no build step" convention.

## 0. Preconditions

- Confirm the draft PR for `claude/pensive-newton-rymumn` → `main` is
  already open (it should be, since the spec is already pushed — lifecycle
  step 3/4). Open one now if it's somehow missing; don't wait for
  implementation to finish.
- Run `node tests/test-engine.js` once before touching anything, to confirm
  the starting point is green. Note the pass count so later runs are
  comparable.

## 1. Foundations — additive, inert, no visible change yet

Three pieces that later phases reference but nothing calls yet, so each is
safe to add in isolation:

- **`deflate()` / `formatToday()`** (spec §1.1) — module-level, **outside**
  the `ENGINE-EXTRACT` span, alongside `scrollAndHighlight`/`nameAtAge`/
  `nameValue` (~`index.html:2037-2051`).
- **`computePotBreakdown()`** (spec §3.1) — module-level, **inside** the
  second `ENGINE-EXTRACT-START`/`END` span, directly after
  `findSupportableDelta` and before `ENGINE-EXTRACT-END`
  (~`index.html:2029`/`2030`). Get this exact — every field name, the
  pension cap (`60000`), the LISA `* 1.25` bonus, and the
  per-person-stops-at-own-`retirementAge` loop — copied verbatim from the
  spec block, not reconstructed from memory.
- **`Lock` icon** (spec §5.1) — added to the icon set (~`index.html:364-646`),
  alongside `Settings` (~`index.html:588-602`), same hand-copied-SVG
  convention as every other icon there.

**Test `computePotBreakdown()` now, before any UI wires it up** — matches
this repo's established "engine changes tested before UI builds on top"
convention (see item 002's plan precedent):

- Add the new `tests/test-engine.js` cases from spec §11: an individual-mode
  case (reuse `tests/fixtures/individual-baseline.json`'s inputs) and a new
  couple-mode case with staggered retirement ages (new fixture file or
  inline object — implementer's call, not specified by the spec).
- Assert the reconciliation identity, `totalPot` matching the
  `household.totalPot` row-lookup rule, the pension-contribution cap
  (contribution total capped, not uncapped-rate × years), and that each
  person's contribution-years stop at their own `retirementAge`, not
  `bothYear`.
- Run `node tests/test-engine.js` — must be green, old and new cases both,
  before moving to Phase 2. This is added inside the existing
  `ENGINE-EXTRACT` span specifically so the harness's `extractEngineSource`/
  `loadEngine` plumbing needs no changes — confirm that's actually true
  (don't just assume it) by running the suite, not just adding the cases.

**Checkpoint:** reload `index.html` — must render identically to before
(helpers/icon are unused so far, `computePotBreakdown` is exercised only by
the test harness). `node tests/test-engine.js` green including the new
cases.

## 2. Item 013 — today's-money dual display + chart tooltip

- **`ChartTooltip`** (`index.html:1310-1329`, spec §1.5): add
  `inflationRate`/`excludeFromTotal = []` props and the new total row.
- **`WealthChart`**: add `inflationRate` to the destructured props
  (signature ~`1347-1356`); its `Tooltip`'s `content` (~`1449-1450`) becomes
  `React.createElement(ChartTooltip, { inflationRate })`.
- **`IncomeChart`**: same, signature ~`1557-1560`, `Tooltip` ~`1584-1585`,
  `content` becomes
  `React.createElement(ChartTooltip, { inflationRate, excludeFromTotal: ['Target Expenses'] })`.
- **Call sites** in `RetirementCalculator` (`WealthChart` ~`2956-2964`,
  `IncomeChart` ~`2971-2973`): both gain `inflationRate: d.infl`.
- **Pot card** (`index.html:2714-2726`, spec §1.2): insert the today's-money
  `<p>` directly after the primary nominal figure, before the existing
  caption `<p>` (leave the caption text itself untouched here — Phase 3
  edits it).
- **Income card** (`index.html:2727-2738`, spec §1.2): same shape, using
  `household.annualIncome`; caption untouched here too.
- **Living Standard detail card** (`index.html:2982-2996`, spec §1.3):
  insert the today's-money line after the big income figure, before the
  caption. The spec's own §1.3 snippet shows this card's caption as a
  placeholder comment ("item 014's hedged caption — see §2.2") — that's the
  spec itself telling you 013 and 014 are two separate edits on this card,
  not one; leave the existing caption text as-is for now.
- **PLSA gauge caveat** (spec §1.4): new `<p>` appended as the last child of
  the Living Standard card's `space-y-6` container (`index.html:2979`),
  after the existing verdict box (`3041-3047`) closes.

**Checkpoint:** Pot/Income cards and the Living Standard card's income
figure all show a correctly-rounded, `≈`-prefixed today's-money line;
hovering either chart shows a "Total (today's money)" row — `IncomeChart`'s
excludes `Target Expenses`, `WealthChart`'s nets in `Mortgage Debt`. PLSA
caveat visible under the gauge, both themes. Sticky bar and per-person grid
must be unchanged (they're explicitly out of scope). `formatToday`/`deflate`
now have real call sites — reload and confirm no console errors.

## 3. Item 014 — confidence/hedge language

Pure string edits on the regions Phase 2 just touched, plus `VerdictHero`:

- Pot card caption (spec §2.1) — `index.html:2725-2726` (line numbers will
  have shifted since Phase 2; find it by the `"retired ("` text instead).
- Income card caption (spec §2.1) — `"Sustainable, year one"` →
  `"Under these assumptions, sustainable in year one."`
- Living Standard detail card caption (spec §2.2) — fills in the placeholder
  Phase 2 left.
- `VerdictHero`'s `insights` array (`index.html:1675-1678`, spec §2.3) —
  both lines reworded to open with "Under these assumptions". The status
  badge (`1683-1689`) and the warning banner (`2654-2668`) are explicitly
  untouched — don't touch them.

**Checkpoint:** every edited caption/insight line reads "Under these
assumptions..."; badge and banner text unchanged; purely cosmetic, no
layout shift.

## 4. Item 015 — "Explain this" breakdown (wires up Phase 1's dead code)

- **`showPotBreakdown`** `useState(false)` (spec §3.2), declared alongside
  `showAssumptions`/`isScrolled` (~`index.html:2204-2205`).
- **`potBreakdown`** `useMemo` (spec §3.2), declared alongside `household`/
  `livingStandard` (~`2383-2399`):
  `computePotBreakdown(isCouple ? [d.p1, d.p2] : [d.p1], projections, household.year)`,
  deps `[d.p1, d.p2, isCouple, projections, household.year]` — copy this
  deps array exactly, don't drop a dep.
- **Pot card final assembly** (spec §6): this is the highest-risk single
  edit in the bundle — the card now carries five pieces (header, primary
  figure, Phase 2's today's-money line, Phase 3's hedged caption, the new
  button + conditional panel). Replace the *entire* Pot card
  `React.createElement` block in one shot against spec §6's verbatim "Full
  assembled shape" listing, rather than patching the button/panel in
  separately — safest way to avoid a subtly wrong nesting/comma error, and
  it also doubles as a check that Phase 2/3's pieces are still exactly
  where they should be.

**Checkpoint:** clicking "Explain this" expands four lines (Starting
balance / Contributions / Growth / Withdrawals, including any that are £0)
that visibly sum to the Pot figure above; clicking again collapses it; the
state doesn't leak into any other card (Income/Living Standard/per-person
grid get no button).

## 5. Item 016 — plain-language pass

- **`VerdictHero`'s caveat sentence** (`index.html:1705-1711`, spec §4.1):
  reword, moving "sequence-of-returns risk" into an `Info`-icon tooltip
  reusing the exact `tooltip-trigger`/`tooltip-content` markup
  `SliderWithInput` already uses (`936-941`). The "Assumptions panel"
  scroll-link stays as-is.
- **§4.2's review of 013/014/015's own copy** — the spec states this review
  already happened at spec-writing time and needed no further changes
  beyond what §1.4's caveat wording already reflects. Nothing to *edit*
  here beyond Phase 5's caveat rewording above — just don't skip
  confirming it (reread the copy you wrote in Phases 2–4 against spec
  §4.2's bullet list before calling this phase done).

**Checkpoint:** caveat sentence no longer shows "sequence-of-returns risk"
in visible text; hovering the new info icon shows the term + explanation in
a tooltip matching the slider-tooltip's look exactly, both themes.

## 6. Item 017 — privacy messaging (independent)

Can run any time after Phase 1's `Lock` icon exists — touches none of the
regions Phases 2–5 touch. Sequenced last here only to keep the riskier
shared-region work (Pot/Income/Living Standard cards, `VerdictHero`)
grouped and verified first; reorder earlier if more convenient.

- **Footer** (`index.html:3079-3085`, spec §5.2): third `<p>` added after
  the existing two, with the `Lock` icon.
- **`SettingsMenu`** menu view (~`index.html:2117+`, spec §5.3): new privacy
  block inserted as the *first* child of that view's fragment, directly
  before the existing "This file contains your personal financial
  figures..." warning `<div>`.

**Checkpoint:** footer shows the privacy line with the `Lock` icon; Data
menu shows the fuller paragraph above Export/Import, also with the `Lock`
icon; neither claims zero network activity (Google Fonts loading is
unaffected/unmentioned, per spec). Both render correctly light/dark,
desktop/mobile.

## 7. Shared closing steps

- **`sw.js`**: `CACHE` `'retirement-planner-v11'` → `'retirement-planner-v12'`
  (spec §8).
- **`docs/TOOL_DOCUMENTATION.md`** (spec §7): §3.4 gains the five described
  additions (summary-card sentence, Living Standard gauge sentence, both
  chart bullets' clause, new "Explain this" bullet, headline-hedge clause);
  §3.7 gains one sentence + cross-reference to the footer. §4.7 and §7 are
  explicitly **unchanged** — don't touch them, and don't add a §7 bullet for
  the PLSA caveat (it makes an existing limitation visible, it doesn't add
  a new one).
- **`USER_CHANGELOG`** in `index.html` (spec §9): one `v12` entry, exact
  copy given in the spec. Set `date` to the actual merge date, not
  necessarily today's date if this spans multiple sessions.
- **`CHANGELOG.md`** (spec §10): one entry under the actual merge date,
  naming all five intent files and covering the bundling decision plus each
  item's change, noting `projectJoint()` itself is untouched throughout.
- **Final full re-run**: `node tests/test-engine.js` once more (sanity
  check — nothing in Phases 2–7 should have touched engine behaviour, so
  the count should match Phase 1's run exactly).
- **Full manual verification sweep** (spec §11's combined checklist, done
  once at the end even though most of it was already checked per-phase
  above): individual and couple mode × light/dark × desktop/mobile.

## 8. Cleanup + PR

- Move all five intent files (`intent/013-today-vs-nominal-money.md`
  through `intent/017-privacy-feature-messaging.md`) into `intent/done/`.
- Move `spec/013-wave-1-bundle.md` into `spec/done/`.
- `git rm plan.md`.
- Mark the PR ready for review; description references
  `intent/013-today-vs-nominal-money.md` through `intent/017-...md` and
  `spec/013-wave-1-bundle.md`.
- After merge: `git checkout main && git fetch origin main && git merge
  --ff-only origin/main`, then `git branch -d claude/pensive-newton-rymumn`.
  Give the user the link to
  https://github.com/aggallim/retirement-planner/branches to delete the
  remote branch (this environment's git proxy rejects `git push --delete`).

## Watch for

- Every spec line number is "as `main` stands today" — after Phase 1/2's
  edits, later line numbers shift. Locate by function/element name (e.g.
  search `ChartTooltip`, `"Combined Pot"`, `showAssumptions`) rather than
  trusting a spec line number once earlier phases have landed.
- `ENGINE-EXTRACT-START`/`END` are text markers for `test-engine.js`'s
  extraction regex only, not real JS scoping — `computePotBreakdown` living
  inside the span doesn't change what it can reference from outside it.
- The Phase 4 Pot-card edit is where a bracket/comma slip is most likely
  (five stacked pieces in one element) — diff the result against spec §6's
  block character-for-character before moving on, not just eyeballing the
  render.
