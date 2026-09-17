# 006 — Dark mode support

## Status

Resolved — ready for implementation. Fleshed out from
`intent/006-dark-mode.md` by resolving the two things that document
deliberately left open (colour-palette mechanism, and where exactly the
manual override is persisted), and by working out the pieces the intent's
"whole app, charts included" scope implies but doesn't itself spell out.

## Problem

See `intent/006-dark-mode.md` §Problem — unchanged here. The app only ever
renders in a light theme, which doesn't match a device/browser already set
to dark mode — and matters more than pure aesthetics because this is an
installed, home-screen PWA meant to feel native, not a page in a tab.

## Outcome

See `intent/006-dark-mode.md` §Decisions confirmed with the user, points
1–4 — unchanged here. This spec adds the implementation-level detail those
points didn't settle.

### Resolved design decision 1: how `dark:` styling gets into a
precompiled, build-step-free `index.html`

`docs/TOOL_DOCUMENTATION.md` §5.5 confirms the inlined stylesheet is
**precompiled Tailwind output containing only the exact classes referenced
in the code** (~34 KB) — there is no Tailwind CDN/JIT running in the
browser, and no build tooling committed to the repo. Simply adding
`dark:bg-slate-900`-style classes to `className` strings would do nothing:
the CSS rules for them don't exist in the shipped stylesheet.

**Resolved:** this is not a new limitation — it's the same situation
`CLAUDE.md`'s "Working in this repo" section already describes for any
substantial `index.html` change ("reconstruct readable JSX, edit it, and
recompile/reinline the result"). Node and npm are available in this
environment even though the repo carries no `package.json`, so
implementation regenerates the compiled CSS the same way it was originally
produced: run the Tailwind CLI (via `npx`) against the existing utility
classes **plus** the new `dark:` variants this change adds, with
`darkMode: 'class'` in the Tailwind config, and re-inline the regenerated
`<style>` block (index.html:16) in place of the current one. This is a
one-off manual step for this PR, not a new standing pipeline — consistent
with how the file is already documented to be edited.

### Resolved design decision 2: where the theme preference is persisted

Intent point 1 says the manual override "persists on-device (alongside the
existing `PERSISTED_FIELDS` localStorage mechanism from intent 004)" —
read literally that's ambiguous between "uses the same *kind* of
mechanism" and "is itself one of the `PERSISTED_FIELDS`."

**Resolved: it is a separate, device-local UI-preference key — not a
`PERSISTED_FIELDS` entry, and not part of the plan JSON.**
`PERSISTED_FIELDS` (index.html:727) is explicitly "what's in a plan," and
per intent 004/`docs/TOOL_DOCUMENTATION.md` §4.x that same list is what
Export/Import round-trips as a portable financial-plan file. A display
preference has nothing to do with the plan's figures — silently forcing
your dark-mode choice onto whoever's device *imports* your exported plan
(or vice versa when you import someone else's) would be a surprising side
effect of an unrelated feature. Theme uses its own `localStorage` key
(`retirement-planner-theme`, alongside the existing `STORE_KEY` constant)
that Export/Import never touches.

### Theme state model

- Stored value: `'system' | 'light' | 'dark'`, default `'system'` (i.e.
  nothing written yet / key absent).
- **Effective theme** = the stored value if it's `'light'`/`'dark'`,
  otherwise whatever `window.matchMedia('(prefers-color-scheme: dark)')`
  currently reports. While the stored value is `'system'`, the app listens
  for that query's `change` event and re-renders live if the OS theme
  flips while the tab is open — it doesn't require a reload or a re-visit
  to catch up.
- The effective theme is applied as a single `dark` class toggled on
  `document.documentElement` (a `useEffect` keyed on the computed boolean)
  — the standard target for Tailwind's `class` strategy, and the one
  place every `dark:` utility class in the compiled CSS keys off.
- **Flash-of-wrong-theme:** not called out as a hard requirement by the
  user, but worth avoiding as a matter of basic correctness once "system"
  is the default — a static `index.html` has no server-side render to get
  this right for free. Implementation adds a small inline script at the
  very top of `<head>` (before the compiled CSS/JS parse) that reads the
  same `retirement-planner-theme` key and `matchMedia` query and sets the
  `dark` class synchronously, before first paint. This is a few lines
  duplicating the same two reads the React code also does — not a new
  requirement, just doing the first paint correctly.

### Resolved design decision 3: toggle UI and placement

Intent confirmed the toggle lives in the existing ⚙ Data menu
(`SettingsMenu`, index.html:1703) and that it's a manual override
defaulting to system.

**Resolved: a three-way segmented control — System / Light / Dark — added
as a new section inside the menu's existing `'menu'` view**, placed last
(below the Import section's `border-t` divider, above the "What's new"
link), following the same `pt-2 border-t border-slate-100` section
pattern already used between Export and Import. Rationale for a 3-way
control rather than a plain on/off switch: intent's "both" answer means
there are genuinely three states a user can be in (following the OS,
pinned light, pinned dark), and collapsing that to a binary switch would
either lose the "go back to following the OS" path or need a separate
reset control — a segmented control shows and sets all three in one place,
the same shape as it's commonly done elsewhere (e.g. GitHub's own theme
switcher).

Three small icon buttons, one per option, each following the same inline-SVG
component pattern already used for `Settings`/`X`/`Download`/`Upload`/`Wallet`
(index.html:467–593): `Monitor` (System), `Sun` (Light), `Moon` (Dark). The
active option gets the same selected-state visual treatment already used
elsewhere for a pressed/active toggle (filled `bg-blue-600 text-white` vs.
the unselected `bg-white border-slate-200 text-slate-600` pattern already
used throughout `SettingsMenu`/`SliderWithInput`) — no new visual language
introduced.

### Resolved design decision 4: chart theming

The two Recharts visualisations (`WealthChart`, `IncomeChart`,
index.html:1212/1420) don't use CSS classes for their colours — `stroke`/
`fill` are literal hex values passed as React props into SVG elements, so
a CSS `.dark` override can't reach them. These two components alone need
the effective theme threaded in as a plain boolean prop, `isDark`,
matching the existing prop-drilling style already used for `accent`
(`SliderWithInput`/`PersonInputs`) — no `Context` is introduced; nothing
else in the tree needs the value passed explicitly, since everything else
is styled with `dark:`-variant Tailwind classes that key off the ambient
`.dark` class automatically.

**What actually needs to change vs. what doesn't**, resolved by checking
against a dark background directly:

- **Needs a dark variant:** `CartesianGrid` `stroke` (`#e2e8f0`, slate-200
  — invisible on dark), `XAxis`/`YAxis` `stroke` (`#64748b`, slate-500 —
  low contrast on dark). A small module-level lookup,
  `CHART_AXIS_COLOR = { light: '#64748b', dark: '#94a3b8' }` and
  `CHART_GRID_COLOR = { light: '#e2e8f0', dark: '#334155' }` (slate-400 /
  slate-700), picked by `isDark`.
- **Unchanged in both themes:** every series colour (the blue/green/teal/
  lime/amber/orange gradients and their matching `ReferenceLine`
  stroke/label colours) — these are already saturated enough to read on
  both a light and a dark background, and intent's "Out of scope" section
  already rules out new colour-meaning decisions; changing them isn't
  needed to make the chart legible and would be exactly that kind of
  unasked-for decision.
- **Unchanged: `ChartTooltip`** (index.html:1190) — it already renders as
  a dark floating card (`bg-slate-900/95`, white text) regardless of page
  theme, which reads fine sitting on top of either a light or dark chart
  background as-is. No light/dark variant needed here; leaving it alone is
  the resolved decision, not an oversight.
- **`Legend`** currently takes its text colour from Recharts' own default
  (dark grey), which is close to unreadable on a dark chart background —
  needs an explicit `wrapperStyle.color` picked the same way as the axis
  colours above.

### Root background and general UI

The outermost page wrapper (index.html:2087,
`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100`)
gets a `dark:` gradient variant (dark slate tones, no blue tint — the blue
wash reads as a light-mode design choice, not one of the "colour meanings"
intent's Out of scope section protects). Every other card/text/border
utility class already in `index.html` gets its corresponding `dark:`
variant added directly alongside it, mechanically, following Tailwind's
own light/dark colour-step conventions (e.g. `bg-white` →
`dark:bg-slate-900`, `text-slate-900` → `dark:text-slate-100`,
`border-slate-200` → `dark:border-slate-700`) — this is the bulk of the
implementation work but involves no further design decisions beyond what's
resolved above; the spec fixes the mechanism and the two exceptions
(charts, tooltip), not every individual class pairing.

### Versioning

This ships as `sw.js` `CACHE = 'retirement-planner-v7'` (current is `v6`),
with a matching `USER_CHANGELOG` `v7` entry — dark mode is squarely
user-facing per intent 005's inclusion rule (a new, visible feature).

## Non-goals

See `intent/006-dark-mode.md` §Out of scope — unchanged: no per-section
theme overrides, no new colour-meaning/branding decisions beyond adapting
existing accents into a dark palette, no effect on `projectJoint()` or any
figure the app produces.

## Constraints

See `intent/006-dark-mode.md` — unchanged, with the following additions
resolved above:

- Theme preference lives in its own `localStorage` key, separate from
  `STORE_KEY`/`PERSISTED_FIELDS`, and must **not** be included in
  Export/Import's plan JSON (Resolved design decision 2).
- The compiled `<style>` block must be regenerated via the Tailwind CLI
  (`darkMode: 'class'`) as part of this PR, not hand-edited — resolved
  design decision 1 explains why hand-adding `dark:` classes to `index.html`
  without regenerating the stylesheet would silently do nothing.
- `WealthChart`/`IncomeChart` take an explicit `isDark` boolean prop; no
  `React.Context` is introduced for theme.
- Series/gradient colours, `ReferenceLine` colours, and `ChartTooltip` are
  explicitly unchanged between themes (resolved design decision 4) — this
  is scope, not something later PRs should "finish."

## Open questions

None remaining. Both points `intent/006-dark-mode.md` left open (palette
mechanism, override persistence location) are resolved above.
