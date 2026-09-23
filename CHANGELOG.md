# Changelog

All notable changes to the UK Retirement Planner, most recent first. Each
entry names the requirement it implements (`intent/NNN-slug.md`, moved to
`intent/done/` once shipped — plus `spec/NNN-slug.md` for requirements
before 024, when the lifecycle still used a spec step).

This file is the complete change history — both what shipped and, for a
non-trivial calculation change, why — in one place.

## 2026-09-23 — Simplify the requirement lifecycle: no post-intent approval gate, spec removed (024)

- Grilling already ends with the user confirming a shared understanding
  before the intent file is written; that confirmation is now the
  lifecycle's only approval checkpoint — nothing after the intent is
  committed pauses for a further nod. `spec/NNN-slug.md` is removed from
  the lifecycle entirely (not merely optional) for every future
  requirement, including calculation-engine changes; correctness there
  still comes from the §5.4 verification checklist and
  `tests/test-engine.js`, not from a spec document. `plan.md` becomes a
  judgment call rather than mandatory. A question that comes up
  mid-implementation now goes straight to the user instead of being
  routed through a spec; if the answer materially changes scope or
  behaviour, it's appended to `intent/NNN-slug.md` as a dated addendum.
  `spec/` and its existing `done/` entries are untouched as historical
  record.
- `CLAUDE.md` and `CONTRIBUTING.md` (including the lifecycle diagram)
  updated to match; the `conventional-branch` skill's repo notes no
  longer mention a spec file.
- Process only — no user-facing change, no `USER_CHANGELOG` entry, no
  `sw.js` cache bump.
- Implements `intent/done/024-simplify-sdlc-skip-spec.md`.

## 2026-09-23 — Fix mobile horizontal overscroll revealing blank whitespace (023)

- Swiping left on a phone (installed as a PWA or in the browser) could
  scroll the whole page sideways and show a strip of unstyled blank white
  space. Root cause: three `tooltip-content` panels (the `SliderWithInput`
  info tooltip and two others) are `w-56` (224px) boxes hidden via
  `visibility: hidden` rather than `display: none`, so their layout box
  still counted towards the page's scrollable width wherever a trigger
  icon sat close to a narrow viewport's right edge — and nothing on the
  page stopped that extra width from being horizontally scrollable at all.
  Fixed with a page-level `overflow-x: clip` on `html`/`body` (plus
  `overscroll-behavior-x: none` alongside the existing
  `overscroll-behavior-y: contain`) — a defensive clamp that forecloses
  this whole class of bug for any element, not just the three current
  tooltips, chosen over `overflow-x: hidden` because `hidden` was found
  (by testing) to break the mobile sticky summary bar's `position:
  sticky` (003), where `clip` does not.
- `USER_CHANGELOG` entry added (`v14`), `sw.js` `CACHE` bumped `v13` →
  `v14`.
- Implements `intent/done/023-mobile-horizontal-overscroll.md`.

## 2026-09-23 — Auto-subscribe to activity on PRs an agent session opens (022)

- `CLAUDE.md` step 7 and `CONTRIBUTING.md` step 3 now say to subscribe to
  a PR's activity immediately once it's opened, without waiting to be
  asked — the repo owner's standing preference, recorded so future agent
  sessions in this repo don't need to ask each time. Only affects PRs an
  agent session itself opens here; doesn't change anything about PRs a
  human contributor opens.
- Process only — no user-facing change, no `USER_CHANGELOG` entry.
- Implements `intent/done/022-auto-watch-own-prs.md`.

## 2026-09-23 — Relicense from GPLv3 to all-rights-reserved (021)

- Replaced the GPLv3 `LICENSE` text with an explicit "all rights
  reserved" notice (copyright held by the repository owner, `aggallim`)
  — the repo stays public (for GitHub Pages hosting) but the source is
  no longer open source. No external contributors or forks existed to
  consider (sole copyright holder throughout the repo's history).
  `README.md` gains a matching `## License` section stating the same.
  Process/repo change only — no code, calculation, or app-behaviour
  change, so no `USER_CHANGELOG` entry and no `sw.js` cache bump.
- Implements `intent/done/021-relicense-all-rights-reserved.md`.

## 2026-09-22 — Intent files are committed on the requirement branch (020)

- Lifecycle step 1 in `CLAUDE.md` and `CONTRIBUTING.md` said to commit the
  intent "straight to `main`". Branch protection (007) forbids that, and
  every intent since has actually landed through its requirement's PR. The
  docs now say so: grill, create the branch, commit the intent as its first
  commit, never to `main`.
- The draft PR now opens right after the intent commit instead of waiting
  for the spec. The only reason to wait was that a fresh branch had no diff
  against `main`; the intent commit gives it one.
- `CONTRIBUTING.md` step order is now 1 Intent, 2 Branch, 3 Open the draft
  PR, 4 Spec, with the cross-references, diagram and "Opening the PR"
  section updated to match. `CLAUDE.md` keeps its step numbers.
- 019's "Agent sessions with a harness-assigned branch" section now lists
  the intent among the steps done on the `<type>/NNN-slug` branch.
- Process only — no user-facing change, no `USER_CHANGELOG` entry.
- Implements `intent/done/020-intent-on-branch.md`.

## 2026-09-22 — Agent sessions use `<type>/NNN-slug` branch names (019)

- Agent sessions no longer do requirement work on their harness-assigned
  branch (e.g. `claude/pensive-newton-rymumn`). They now create
  `<type>/NNN-slug` off `main` like any contributor. Before this, the docs
  exempted those names because they pass the grammar via the `claude/`
  prefix. But the names are random, so they broke the repo's
  `<type>/NNN-slug` traceability and the skill's description guidelines.
- **Why now:** the exemption assumed a remote session could only push to
  its assigned branch. A test push of a new branch (this one) succeeded.
- `CLAUDE.md` step 3, `CONTRIBUTING.md` ("Agent sessions with a
  harness-assigned branch") and the `conventional-branch` skill's "Use in
  this repo" section record this as standing permission. They also give a
  fallback to the assigned branch if a push is ever rejected.
- Process only — no user-facing change, no `USER_CHANGELOG` entry.
- Implements `intent/done/019-conventional-branch-names.md`.

## 2026-09-22 — UK income tax in retirement, Lump Sum Allowance, reference figures, methodology (018)

Implements `intent/018-uk-income-tax.md` / `spec/018-uk-income-tax.md`,
covering Notion roadmap #3, #12, #26 and #19 as one requirement (intent
decision 22: the four items depend on each other), with `sw.js` going
`v12` → `v13`.

**Why:** this closes the tool's headline caveat, known limitation #1
("Income tax in retirement is not modelled"). Spending and the Retirement
Living Standards are after-tax figures, but State Pension and pension
drawdown were counted at full gross value.

**What:**

- **`UK_REFERENCE`** — one tax-year-tagged object (`taxYear: '2026/27'`,
  `lastUpdated: '6 April 2026'`) inside the first `ENGINE-EXTRACT` span,
  holding every UK reference figure with its source URL: income tax bands,
  allowance, taper and freeze year; State Pension; Lump Sum Allowance;
  pension annual allowance; MPAA; ISA/LISA limits and bonus; the Retirement
  Living Standards; and the not-modelled references. `PLSA` is now an alias
  of `UK_REFERENCE.plsa`. Rewired to read from it: `makePerson`'s State
  Pension default; the ISA/LISA/annual-allowance/State Pension tooltips and
  subtitles; `projectJoint()`'s pension cap, LISA bonus and LISA access age;
  `computePotBreakdown()`'s cap and bonus; the three allowance warnings; the
  lump-sum checkbox label; the methodology section; and the footer. The
  rewire was checked to be behaviour-neutral (unchanged baseline, identical
  rendered text) before any calculation changed.
- **Income tax in `projectJoint()`** — new `taxThresholdsFor()` (frozen
  through row year 2030 = tax year 2030/31, then uprated by the inflation
  input) and `incomeTaxFor()` (rest-of-UK bands with the £100k taper). Each
  person's pension draw + State Pension is taxed against their own
  allowance. Tax reduces net income and the larger gap is funded from the
  existing tax-free savings tiers in the existing order — no gross-up; the
  4%-rule draw stays gross. ISA/LISA/other-savings draws and the lump sum
  are untaxed.
- **Lump Sum Allowance** — tax-free cash = min(25%, £268,275) per person;
  the excess stays in the pension and is taxed as income when drawn.
- **New row fields** — `p1/p2StatePension`, `p1/p2TaxableIncome`,
  `p1/p2Tax`, `p1/p2LumpSum`, `p1/p2LumpSumExcess`, household `incomeTax`
  and `netIncome`. `deflate()` moved into the engine span beside the new
  `lifetimeTaxTotals()` and `computeTaxNotes()` so all three are tested.
- **UI** — income figures (Income card, sticky bar, gauge, Living Standard)
  are after tax, with a "Pension · State · Tax" sub-line; the Retirement
  Income chart gains a negative grey "Income Tax" bar and a "Total after
  tax (today's money)" tooltip row; a lifetime-tax line with its
  today's-money equivalent and a "2026/27 tax year" label; a neutral,
  fact-only "Tax notes" panel (five note types, each linked to GOV.UK); the
  Safe Withdrawal Rate tooltip notes the rate applies before tax; the
  `VerdictHero` caveat mentions estimated Income Tax instead of "no tax";
  and "Assumptions & Disclaimers" becomes "How we calculate this" with a
  "Figures last updated" line, new tax blocks and a source link beside each
  figure.
- **Retirement Living Standards refreshed** (user decision Q2) from the
  PLSA 2025/26 figures to the 2026 Retirement Living Standards published by
  Pensions UK (formerly the PLSA): one-person £13,900 / £32,700 / £45,400,
  two-person £22,500 / £45,400 / £62,700 (after tax, excluding housing
  costs, outside London). The UI names Pensions UK wherever it names the
  source. The gauge range still contains every band.
- **Annual allowance / MPAA** — explained in the docs only (§4.3); the £60k
  cap was already in the engine and the MPAA can't trigger here.
- `docs/TOOL_DOCUMENTATION.md` (header, §1, §3.4, §3.5, new §3.10, §4.2,
  §4.3, §4.7 with a Source column, §5.2–§5.4, §7 #1 replaced in place) and
  `CLAUDE.md`'s scope line updated in the same PR.

**Individual-mode baseline regenerated deliberately.** Tax is always on
(intent decision 11) and the Lump Sum Allowance binds on the default plan,
so `tests/fixtures/individual-baseline.json` was regenerated. Before
regenerating, the only failing check was the byte-for-byte baseline; every
other original check passed unchanged. Confirmed before → after (default
plan):

- every row gains the 12 new fields; existing fields differ only from 2056
  (the retirement year) onward;
- the lump sum is capped: 25% would be £285,410, so the lump is £268,275
  and £17,135 stays in the pension;
- 2056: pension draw £34,249 → £34,935, ISA draw £55,560 → £56,439, tax
  £1,565;
- 2058 (State Pension starts): tax £8,123, ISA draw £26,631 → £34,027;
- 2091 (final row): `totalIsa` £525,244 → £0 (ISAs empty from 2086),
  `totalPension` £684,991 → £698,699;
- no depletion before or after — the verdict stays "On track";
- lifetime tax 2056–2086: £370,489 (≈ £92,800 in today's money).

Tests: 21 → 32 (band boundaries, taper, freeze-then-uprate, per-person
allowances, LSA cap, untaxed savings, wider savings draw, withdrawal rate,
State Pension and the freeze, `lifetimeTaxTotals`, `computeTaxNotes`).

**Resolutions** (spec/018): R1 row year Y = tax year Y/Y+1, frozen through
2030; R2 lump-sum label shows "(up to £268,275)"; R3 all four thresholds
freeze and uprate together; R4 no rounding inside the calculation; R5 the
LSA is never uprated; R6 lifetime window is first retirement → plan end,
today's money = Σ each year's deflated tax; R7 strict ">" note boundaries,
first year only, rows to plan end, sorted by year/person/type; R8 `deflate`
moved into the engine span; R9 the household card's tax uses the same
helpers on its own components; R10 sticky bar "Income after tax"; R11
"Tax −£Z" only when tax > 0; R12 negative axis ticks "−£Xk"; R13 tax
netted into the Income chart tooltip total; R14 Tax notes hidden when
empty; R15 "See how we calculate this ↓".

## 2026-09-21 — Wave 1 bundle: today's-money, confidence language, "Explain this", plain language, privacy (013–017)

Five roadmap items (9, 20, 17, 18, 10) delivered as one shared spec, branch,
PR and build version (`sw.js` `v11` → `v12`), per the bundling decision
recorded in `intent/013-today-vs-nominal-money.md`'s Status section.
Implements `intent/013-today-vs-nominal-money.md`,
`intent/014-confidence-language.md`,
`intent/015-explain-this-breakdown.md`,
`intent/016-plain-language-pass.md` and
`intent/017-privacy-feature-messaging.md` /
`spec/013-wave-1-bundle.md`. `projectJoint()` itself is untouched
throughout — the one calculation-adjacent addition is the new, purely
additive `computePotBreakdown()` reconstruction, which reads
`projectJoint()`'s output rather than changing it.

- **013 — today's-money vs. nominal money.** New module-level
  `deflate()`/`formatToday()` display helpers (outside the engine-extract
  span; pure arithmetic on already-computed figures, at the household's
  single inflation rate). The Combined/Total Pot and Household/Annual
  Income summary cards, and the Living Standard detail card's big income
  figure, each gain a "≈ £X in today's money" line under the nominal
  figure. `ChartTooltip` (shared by `WealthChart` and `IncomeChart`) gains
  a "Total (today's money)" row after the per-series figures; `IncomeChart`
  excludes its `Target Expenses` reference series from that total (a
  spending target, not income), `WealthChart` nets in `Mortgage Debt`
  as-is. A permanent caveat line is added under the PLSA gauge, making
  existing known limitation #6 (PLSA bands aren't inflated forward)
  visible in the UI for the first time — not fixed; that's roadmap item
  #23. The sticky mobile bar and the per-person breakdown grid are
  deliberately unchanged (stay nominal-only).
- **014 — confidence/hedge language.** The Pot/Income card captions, the
  Living Standard detail card's caption, and both of `VerdictHero`'s
  insight lines now open with "Under these assumptions", reusing the
  phrase the existing headline sentence already established rather than
  inventing parallel wording. The status badge and the warning banner are
  deliberately untouched (stay plain/blunt).
- **015 — "Explain this" breakdown on the Pot figure.** New module-level
  `computePotBreakdown(people, projections, bothYear)`, added inside the
  existing `ENGINE-EXTRACT` span so `tests/test-engine.js` picks it up
  with no harness changes. Walks each person's known input balances/
  contribution rates (capped at the £60,000/year pension allowance, with
  the 25% LISA bonus, and each person's own contribution years stopping at
  their own `retirementAge` rather than the later `bothYear`) plus the
  per-year projection data to reconstruct Starting balance / Contributions
  / Growth (a residual) / Withdrawals, reconciling exactly against
  `household.totalPot`. A new "Explain this" click-to-expand button/panel
  on the Pot card (reusing the existing `ChevronUp`/`ChevronDown`
  collapse pattern) shows all four lines, always, including any that are
  £0. No breakdown added to Income, Living Standard, or the per-person
  grid.
- **016 — plain-language pass.** `VerdictHero`'s caveat sentence drops
  "sequence-of-returns risk" from the visible text; the term and its
  explanation move into an `Info`-icon hover tooltip, reusing
  `SliderWithInput`'s exact tooltip markup rather than inventing a new
  disclosure pattern. A review of 013/014/015's own new copy against the
  same plain-language standard needed no further changes beyond that
  rewording and 013's already-plain PLSA caveat wording.
  `docs/TOOL_DOCUMENTATION.md`'s own use of "sequence-of-returns risk"
  (developer documentation, a different audience) is untouched.
- **017 — privacy as a visible product feature.** New `Lock` icon, added
  to the existing hand-copied inline-SVG icon set. The footer gains a
  third line, and the ⚙ Data menu gains a fuller paragraph above
  Export/Import, both stating plainly that figures stay on this device —
  no account, no upload, no bank connection, no analytics — using the new
  icon. Neither claims zero network activity (Google Fonts loading is
  unaffected/unmentioned). No new prominent UI element added near the top
  of the input form (explicit non-goal).
- `tests/test-engine.js` gains `computePotBreakdown()` coverage: an
  individual-mode fixture and a new staggered-retirement couple fixture
  (withdrawals provably nonzero before `bothYear`), asserting the
  reconciliation identity, `totalPot` matching `household.totalPot`'s
  row-lookup rule, the pension-contribution cap, and that each person's
  contribution years stop at their own `retirementAge`.
- `docs/TOOL_DOCUMENTATION.md` §3.4 and §3.7 updated to describe all of the
  above; §4.7 and §7 are unchanged (013's PLSA caveat makes an existing
  limitation visible in the UI, it doesn't change what the limitation is).

## 2026-09-21 — Explorable assumptions panel (012)

- **New "Your projection assumes..." panel**, directly below the "Can I
  retire?" headline: a compact, module-level `AssumptionsPanel` component
  listing the six roadmap-named assumption categories in a fixed order —
  return (each person's pension growth rate, not the full 4-account ×
  2-person breakdown), inflation, retirement age, life expectancy,
  spending, and State Pension (amount and start age combined into one
  line). Couple-mode rows show a per-person pair where the underlying
  figure genuinely is per-person; inflation and spending stay single
  shared figures. The existing bottom "Assumptions & Disclaimers" section
  is untouched — the new panel links down to it for full detail rather
  than absorbing or duplicating its content.
- **Scroll-and-highlight click-through** — a new `scrollAndHighlight()`
  module-level helper (plain DOM `getElementById` + a restartable CSS
  animation class, no new state/ref plumbing) that every panel value is
  wired to, jumping to and briefly flashing the input card that sets it.
  Ten new DOM anchor ids were added (four per-person, doubled for `p1`/
  `p2`, plus two shared and one for the "Assumptions & Disclaimers" outer
  card) as small, additive wrapper `<div>`s — no restructuring of
  `PersonInputs` or the shared-assumptions cards.
- **`VerdictHero`'s existing caveat is repointed**, not reworded: "the
  Assumptions panel" changes from plain text to a button that scrolls to
  and highlights the new panel — the caveat's wording ("...see Known
  limitations in the Assumptions panel.") already made sense once that
  panel existed to point at.
- `VerdictHero`'s local `nameAt` helper is hoisted to a shared,
  module-level `nameAtAge()` (plus a new `nameValue()` for non-age
  per-person figures) so `AssumptionsPanel` can reuse the same couple-mode
  formatting convention without duplicating it — a behaviour-preserving
  refactor, not a copy change.
- **No calculation logic changed.** `AssumptionsPanel` only reads state
  `projectJoint()`/`verdict`/`longevity` already compute or that the
  sliders already hold; `node tests/test-engine.js` passes unchanged
  (18/18, no new cases needed).

## 2026-09-20 — "Can I retire?" headline verdict (011)

- **New headline at the top of results**, replacing the mid-page "Longevity
  Analysis" card rather than duplicating it: a direct on-track/needs-
  attention status badge (reusing the existing excellent/warning/critical
  severity split), a hedged supporting sentence naming a specific age
  ("Under these assumptions, your plan currently supports retiring at
  age 60" — deliberately not a flat yes/no, since the figure depends
  entirely on the plan's assumptions), a couple of lightweight rule-based
  insight lines, and an inline caveat pointing at the model's key
  simplifications. The existing summary cards (pot, income, PLSA band)
  move to directly beneath it as supporting detail.
- **New supportable-retirement-age search** — `findSupportableDelta()`, a
  bidirectional shared-delta search wrapping `projectJoint()` without
  modifying it (individual mode is just the `person2 === null` case of
  the same function). If the plan already succeeds, it looks for the
  earliest retirement age it could still support; if it fails, the
  smallest delay that fixes it. In couple mode the same delta is applied
  to both people rather than solved independently per person. The search
  is bounded by the existing per-person Retirement Age slider limits
  (`[max(50, currentAge+1), 75]`) — reusing a constraint the UI already
  enforces rather than inventing a new one — and reports "no supportable
  age found within typical limits" rather than a number when nothing in
  range changes the outcome.
- **Reuses, not redefines, the existing success test.** The verdict is
  driven by the same £1,000-combined-balance-from-first-retirement test
  the old Longevity Analysis card already used (now extracted into
  `planSucceeds()`), deliberately not a new margin/buffer definition.
- Resolved via two rounds of the `grilling` skill — the second
  specifically re-examining the two decisions where the chosen answer
  diverged from the initial recommendation (computing a supportable age
  for couples via a shared delta rather than skipping it, and hedging
  the verdict's supporting sentence while keeping its status badge
  direct).

## 2026-09-20 — Dismissable warning banner (008)

- **Whole-banner dismiss**, via a new **×** close control on the header's
  red warning banner. Closing it hides the entire banner, not individual
  warning lines.
- **Persists across reloads**, via a new `ukRetirementPlanner.dismissedWarnings.v1`
  localStorage key, deliberately separate from `STORE_KEY`/`PERSISTED_FIELDS`
  — same reasoning as the dark mode override key (010): "have I seen this"
  is device-local UI state, not plan data, so it never travels through
  Export/Import.
- **Keyed to the exact warning set shown at dismissal time**, via a
  `JSON.stringify` equality check against the live `warnings` array —
  order-sensitive is fine since `warnings` is built in a fixed order for a
  given input set. If any input change alters which warnings apply, the
  stored snapshot no longer matches and the banner reappears automatically.
- **↺ Reset clears the dismissal** too, alongside the rest of the saved
  plan.

## 2026-09-18 — Dark mode support (010)

- **System / Light / Dark toggle**, added to the existing ⚙ Data menu
  below Import. System (the default) follows `prefers-color-scheme` and
  switches live if the OS theme changes while the app is open; Light/Dark
  pin an explicit override. The override is stored under its own
  `ukRetirementPlanner.theme` localStorage key, deliberately separate
  from `PERSISTED_FIELDS`, so it never travels through Export/Import — a
  display preference isn't part of "the plan."
- **Whole app covered, including both charts.** `WealthChart`/
  `IncomeChart` take an explicit `isDark` prop to swap `CartesianGrid`/
  `XAxis`/`YAxis` stroke and `Legend` text colour; series/gradient
  colours, `ReferenceLine`s and `ChartTooltip` are deliberately
  unchanged between themes — already saturated/dark enough to read on
  both, and changing them would be an unasked-for colour-meaning
  decision.
- **No Tailwind CLI or build step introduced.** This repo's inlined
  stylesheet is precompiled and contains only the exact classes already
  in use, so `dark:`-variant classes would silently do nothing. Instead,
  every colour utility class the app actually uses gets a hand-written
  `.dark <class> { … }` override appended to the existing inline
  `<style>` block — the same pattern intents 003, 005 and 006 already
  used for Tailwind utilities missing from the compiled output, just
  applied more broadly. A Playwright pass across both themes (individual
  and couple mode, warning banner, both charts, the Data menu, and the
  Assumptions panel hovered and not) caught two real bugs before they
  shipped: the root background gradient's middle "via" stop is baked as
  a literal inside Tailwind's `--tw-gradient-stops` rather than exposed
  as its own overridable variable, and three light-background hover/
  focus states (`hover:bg-slate-50`, `hover:bg-slate-200`,
  `focus:bg-blue-50`, `focus:bg-teal-50`, `hover:bg-teal-50/30`) needed
  their own dark overrides too — both fixed and re-verified.
- Anti-flash inline `<script>` in `<head>`, ahead of the compiled
  stylesheet, applies the resolved theme synchronously before first
  paint (reads the same `localStorage` key and `matchMedia` query the
  React code does).
- `sw.js` cache bumped `v7` → `v8`; `USER_CHANGELOG` `v8` entry added
  (plainly user-facing — a new, visible feature).
- `docs/TOOL_DOCUMENTATION.md` §3.9 added, documenting the toggle and
  its System/Light/Dark behaviour.
- Renumbered from 006 to 008 to 010 while in progress, as
  `006-mobile-data-menu-overflow`, `007-dev-workflow-improvements`,
  `008-dismissable-warning-banner` and `009-tool-docs-history-cleanup`
  each claimed a number in turn — see `spec/done/010-dark-mode.md`'s
  Status section for the full history.
- Implements `intent/done/010-dark-mode.md`.

## 2026-09-17 — Trim roadmap and build history from tool docs (009)

- Removed the "Possible future additions" checklist from
  `docs/TOOL_DOCUMENTATION.md` §7 — it duplicated a roadmap already
  tracked on the project's Notion page (the declared source of truth for
  that doc), and the two copies had already started to drift apart.
- Removed `docs/TOOL_DOCUMENTATION.md` §8 Build history entirely — its
  per-requirement narrative duplicated what this file already records for
  every requirement. The two entries with no `CHANGELOG.md` equivalent
  (the pre-repo accuracy review and general design decisions) were folded
  into the "Initial release" entry below before §8 was deleted, so
  nothing not already duplicated elsewhere was lost.
- `CLAUDE.md`/`CONTRIBUTING.md` updated: the lifecycle no longer asks for
  a §8 entry — this file is now the sole change-history record.
- Mirrored the same two removals into the Notion page.
- Process/docs only — no user-facing change, no `USER_CHANGELOG` entry.
- Implements `intent/done/009-tool-docs-history-cleanup.md`.

## 2026-09-17 — Development workflow improvements (007)

- Requirement branches now follow the [Conventional Branch](https://conventionalbranch.org)
  spec: `<type>/NNN-slug` (e.g. `feature/007-dev-workflow-improvements`,
  `bugfix/006-mobile-data-menu-overflow`) instead of bare `NNN-slug` —
  superseding the ad-hoc `bug/NNN-slug` convention 006 introduced below,
  which predates this requirement.
- Documented the branch-protection settings `main` requires (PR required,
  `test-engine` status check required, no bypass) — a manual GitHub
  setting, since no tool available in this environment can apply it.
- Gathering intent now requires running the `grill-me`/`grilling` skill
  first, so `intent/NNN-slug.md` records resolved decisions rather than a
  restated request.
- Added `.claude/skills/grill-me/`, `.claude/skills/grilling/` (MIT, ©
  Matt Pocock) and `.claude/skills/conventional-branch/` (CC BY 4.0) to
  the repo.
- Process/tooling only — no user-facing change, no `USER_CHANGELOG` entry.
- Implements `intent/done/007-dev-workflow-improvements.md`.

## 2026-09-17 — Fix Data menu overflowing off-screen on narrow phones (006)

- The Export/Import/What's new panel (`SettingsMenu`) anchored itself with
  `right: 0` against its own trigger button, not the viewport. On a narrow
  phone the button sits well left of the screen's right edge, so the
  18rem-wide panel opened mostly or entirely off the left edge of the
  screen — the bug the CSS added for `w-72`/`right-0` in 005 made *visible*
  but didn't actually fix, since that only supplied the missing width/
  position values, not correct positioning at narrow widths.
- Fixed with a dedicated `.settings-popover` class: unchanged
  absolute/right-0/18rem positioning at `sm` and above, but a `max-width:
  639px` media query switches it to a `fixed` panel inset 1rem from the
  left/right/top of the viewport instead, so it's always fully on-screen
  regardless of where the trigger button sits in the wrapped header row.
- Verified in a headless-browser pass at 320px, 375px and 1280px widths,
  covering both the menu and What's new views.
- `sw.js` cache bumped v6 → v7; `docs/TOOL_DOCUMENTATION.md` updated (§8
  Build history).
- Also updated `CLAUDE.md`/`CONTRIBUTING.md`: bug fixes now explicitly go
  through the same intent-first lifecycle as any other requirement, with
  a `bug/NNN-slug` branch-naming convention to tell bug branches apart
  from feature branches.
- Implements `intent/done/006-mobile-data-menu-overflow.md`.

## 2026-09-17 — User-facing changelog (005)

- Added a **What's new** link to the ⚙ Data menu — a plain-language,
  in-app history of user-facing changes, newest first. Not GitHub
  Releases (reconsidered mid-flight — see intent's Revision note): stays
  inside the app's offline/self-contained boundary instead.
- Version labels reuse the `sw.js` cache version, with intentional gaps
  for merges that weren't user-facing (per the inclusion rule this
  requirement introduces — see `CLAUDE.md`).
- Backfilled entries for `v3` (002), `v4` (003) and `v5` (004);
  `USER_CHANGELOG` gets a new entry in the same PR as any future
  user-facing change, going forward.
- Found and fixed two more Tailwind utilities with no CSS behind them
  (`w-72`, `right-0`, both already in `SettingsMenu` since 004, silently
  doing nothing) — same class of bug as 003's `min-w-0`/`break-words`/
  `max-h-40`, hand-patched the same way.
- `docs/TOOL_DOCUMENTATION.md` updated (§3.8 new, §8 Build history).
- `CLAUDE.md`/`CONTRIBUTING.md` updated with the new conditional
  same-PR step.
- Implements `intent/done/005-user-facing-changelog.md`.

## 2026-09-17 — JSON import/export (004)

- Added an **⚙ Data** menu to the header with **Export plan** (downloads a
  `retirement-plan-YYYY-MM-DD.json` of your current inputs, plus a
  `schemaVersion` field) and **Import plan** (file picker → validate →
  confirm-before-overwrite → per-field-tolerant apply).
- A plaintext-data warning shows every time the panel is open, not just
  once — a deliberate choice over a one-time/dismissible notice.
- Import is full-overwrite-on-confirm only, no merge; a field missing from
  the imported file leaves the current value untouched rather than
  resetting it, and an unrecognised field is silently ignored.
- `migratePerson()` runs on import as well as on initial load, so an old
  single-ISA-shape export still restores correctly.
- `docs/TOOL_DOCUMENTATION.md` updated (§3.7 new, §7 limitation #9 and
  roadmap, §8 Build history).
- Implements `intent/done/004-json-import-export.md`.

## 2026-09-16 — Mobile sticky summary bar (003)

- **Only the three summary boxes (Pot/Income/Living Standard) stay pinned
  on scroll now**, not the whole header — the title and Reset/Partner
  buttons scroll away normally, freeing up screen space for sliders.
  Applies at every viewport width.
- **Fixed mobile squashing**: summary values now wrap instead of being
  clipped, via `min-w-0` + `break-words` on each box and a raised
  `max-h-40` cap (was a hard `max-h-24` that cut off longer values).
- Value text drops to `text-xs` on mobile (`md:` and up unchanged) so
  common values (a 7-figure pot, any PLSA Living Standard label) wrap
  cleanly at word boundaries rather than mid-word.
- `docs/TOOL_DOCUMENTATION.md` updated (§5.1, §8 Build history).
- Implements `intent/done/003-mobile-sticky-summary-bar.md`.

## 2026-09-16 — Extra savings accounts (002)

- Replaced each person's single blended ISA field with **Cash ISA**,
  **Stocks & Shares ISA** and **LISA** sub-accounts, plus a free-form,
  add/remove list of **other savings** accounts.
- **LISA bonus**: contributions get an automatic 25% government top-up.
- **LISA age-60 gate**: LISA balances can't fund a spending gap before 60,
  though they still accrue contributions, bonus and growth throughout.
- **Fixed drawdown order** — other savings → Cash ISA → S&S ISA → LISA —
  replacing the old single proportional ISA draw.
- **Allowance warnings** for combined ISA/LISA contributions over £20,000
  and LISA contributions over £4,000 (warning-only, not hard-capped).
- **Migration**: existing saved plans map their old single ISA balance onto
  the new Stocks & Shares ISA field rather than losing data.
- `docs/TOOL_DOCUMENTATION.md` and `test-engine.js` updated throughout.
- Implements `intent/done/002-extra-savings-accounts.md`.

## 2026-09-15 — Engine test harness (001)

- Added `tests/test-engine.js`, a dependency-free `node` script that
  extracts `projectJoint()` straight out of `index.html` (via
  `// ENGINE-EXTRACT-START` / `// ENGINE-EXTRACT-END` markers) and asserts
  the full `docs/TOOL_DOCUMENTATION.md` §5.4 verification checklist —
  lump-sum split, the 4% rule, mortgage payoff timing, State Pension
  timing, joint-mode reconciliation, depletion detection, and a
  byte-for-byte individual-mode regression baseline.
- Added `.github/workflows/test-engine.yml` to run it in CI on every push
  and PR, separate from the Pages deploy workflow.
- Implements `intent/done/001-engine-test-harness.md`.

## 2026-09-15 — Initial release

- Brought the UK Retirement Planner PWA into this repository (previously a
  standalone build) and deployed it to GitHub Pages via GitHub Actions.
- Added `CLAUDE.md` project guidance and `docs/TOOL_DOCUMENTATION.md`.
- **Calculation accuracy review**, performed before this repo existed,
  caught and fixed nine defects:
  - The 25% pension lump sum was never applied to the projections —
    calculated for display only, leaving pension balances 25% overstated.
  - The 4% rule was implemented as 4% of the declining balance each year,
    rather than a fixed initial amount uprated by inflation.
  - Expenses were inconsistent between the projection and the income
    chart — one assumed the mortgage was included, the other excluded.
  - The wealth chart started one year late, showing balances after a
    year of growth instead of today's figures.
  - Retirement balances were frozen — remaining pots didn't grow after
    withdrawals, understating longevity.
  - The income chart read an always-zero field, so pension withdrawal
    bars were empty.
  - The income chart used `BarChart` with a `Line` child, so the
    expenses line silently never rendered — needed `ComposedChart`.
  - Gauge thresholds were evenly spaced but plotted on a linear scale, so
    the labels didn't line up with the colour bands.
  - PLSA and State Pension reference figures were out of date and were
    refreshed to current values.
- **Design decisions carried in from that build**: calendar-year
  anchoring (not age) so differing ages align on one chart axis; the
  pension lump sum moves into the ISA as retained capital rather than
  being treated as spent; joint household expenses start from the first
  partner's retirement (the deliberately cautious assumption); the
  mortgage stays a single shared liability rather than being split
  between partners; growth profile persists into retirement rather than
  assuming a de-risking glidepath.
