# Changelog

All notable changes to the UK Retirement Planner, most recent first. Each
entry names the requirement it implements (`intent/NNN-slug.md` /
`spec/NNN-slug.md`, both moved to their `done/` directories once shipped).

This file is the complete change history — both what shipped and, for a
non-trivial calculation change, why — in one place.

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
