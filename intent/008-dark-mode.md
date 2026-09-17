# 008 — Dark mode support

## Status

Proposed. Scoped directly with the user via a short Q&A rather than assumed
— see "Decisions confirmed with the user" below. Nothing here is a guess.

## Problem

The app only ever renders in a light theme. On a device or browser set to
dark mode, the light UI sits jarringly inside otherwise-dark OS/browser
chrome — the app doesn't match the environment it's installed into. This
matters more than pure aesthetics here specifically because the tool is
packaged as an installable PWA (`CLAUDE.md`, `docs/TOOL_DOCUMENTATION.md`
§5.5/§6.2) meant to feel like a native app on the home screen, not a web
page opened in a tab.

Raised via the user's own roadmap tracking rather than
`docs/TOOL_DOCUMENTATION.md` §7 itself — that section's "Possible future
additions" list is shorter than the roadmap notes it was checked against
and doesn't currently name dark mode as a line item. (Numbered 008, not
006, here: 006 and 007 were claimed by the mobile Data-menu overflow fix
and the dev-workflow-improvements requirement while this was being
scoped — see `intent/done/006-mobile-data-menu-overflow.md` and
`intent/done/007-dev-workflow-improvements.md`.)

## Decisions confirmed with the user

1. **Activation — both, not either/or.** The app follows the OS/browser's
   `prefers-color-scheme` by default, with a manual toggle that overrides
   it. The manual override persists on-device (alongside the existing
   `PERSISTED_FIELDS` localStorage mechanism from intent 004), so once a
   user picks a theme explicitly it sticks regardless of what the OS is
   set to; leaving it unset keeps following the OS live.
2. **Toggle location — the existing ⚙ Data menu** (`SettingsMenu`,
   introduced for intent 004's Export/Import and reused by intent 005's
   What's New view). Not a new header control — the header was
   deliberately decluttered for mobile in intent 003.
3. **Scope — the whole app, charts included.** This explicitly covers the
   two Recharts visualisations (`WealthChart`, `IncomeChart`): axis text,
   gridlines, tooltip background/text, and series colours all need a
   dark-mode-aware variant. A dark shell around unreadable or washed-out
   light-mode charts does not satisfy this — chart legibility in both
   themes is part of "done," not a follow-up.
4. No specific colour palette, and no PWA-install-specific edge case (e.g.
   flash-of-wrong-theme on load), was raised as a hard requirement by the
   user. These are left for the spec to resolve sensibly rather than
   fixed here — this intent constrains outcome and scope, not
   implementation detail.

## Out of scope

- Per-section or per-component theme overrides — this is a single,
  whole-app light/dark toggle, not partial theming.
- Any new colour-meaning or branding decisions beyond adapting the
  existing accents (and chart series colours) into a dark palette. The
  existing colour *meanings* (warning red, PLSA bands, per-person chart
  colours in joint mode, etc.) carry over unchanged.
- Modelling or measuring anything financial — this is a pure UI/visual
  change with no effect on `projectJoint()` or any figure the app
  produces.
