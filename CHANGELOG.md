# Changelog

All notable changes to the UK Retirement Planner, most recent first. Each
entry names the requirement it implements (`intent/NNN-slug.md` /
`spec/NNN-slug.md`, both moved to their `done/` directories once shipped).

This file is the short, chronological "what shipped when." For the
detailed narrative — why a calculation changed, what broke before it was
fixed — see `docs/TOOL_DOCUMENTATION.md` §8 Build history.

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
