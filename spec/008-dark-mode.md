# 008 — Dark mode support

## Status

Resolved — ready for implementation. Fleshed out from
`intent/008-dark-mode.md` by resolving the two things that document
deliberately left open (colour-palette mechanism, and where exactly the
manual override is persisted), and by working out the pieces the intent's
"whole app, charts included" scope implies but doesn't itself spell out.

**Renumbered from 006 to 008, and Resolved design decision 1 rewritten,**
after rebasing onto `main`: `intent/done/006-mobile-data-menu-overflow.md`
and `intent/done/007-dev-workflow-improvements.md` merged while this was
in progress, claiming those numbers, and 006's fix established a directly
relevant precedent (see decision 1 below) that this spec originally
missed by not existing yet at the time.

## Problem

See `intent/008-dark-mode.md` §Problem — unchanged here. The app only ever
renders in a light theme, which doesn't match a device/browser already set
to dark mode — and matters more than pure aesthetics because this is an
installed, home-screen PWA meant to feel native, not a page in a tab.

## Outcome

See `intent/008-dark-mode.md` §Decisions confirmed with the user, points
1–4 — unchanged here. This spec adds the implementation-level detail those
points didn't settle.

### Resolved design decision 1: how dark-mode styling gets into a
precompiled, build-step-free `index.html`

`docs/TOOL_DOCUMENTATION.md` §5.5 confirms the inlined stylesheet is
**precompiled Tailwind output containing only the exact classes referenced
in the code** (~34 KB) — there is no Tailwind CDN/JIT running in the
browser, and no build tooling committed to the repo. Simply adding
`dark:bg-slate-900`-style classes to `className` strings would do nothing:
the CSS rules for them don't exist in the shipped stylesheet, and this repo
has no Tailwind CLI/config committed to regenerate it from.

**Resolved: hand-write the dark-mode rules as plain CSS in the existing
inline `<style>` block, the same way three prior requirements already
solved this exact problem** — this repo has direct, repeated precedent for
it, not just a theoretical option:

- Intent 003 (`docs/TOOL_DOCUMENTATION.md` §8) hand-added `.min-w-0`,
  `.break-words` and `.max-h-40` to this block when it needed Tailwind
  utilities the compiled stylesheet didn't have rules for.
- Intent 005 hand-added `.w-72`, `.max-h-64`, `.overflow-y-auto`,
  `.right-0` for the same reason.
- Intent 006 (`spec/done/006-mobile-data-menu-overflow.md`, merged onto
  `main` while this spec was in progress) went further: it added a
  `.settings-popover` class **with its own `@media (max-width: 639px)`
  block** — a responsive variant with no Tailwind-class equivalent at all
  — directly in this same `<style>` tag (currently `index.html:2093`,
  immediately inside the root `RetirementCalculator` render, right after
  the outer `min-h-screen` wrapper div opens at `index.html:2092`).

Dark mode needs the same treatment, just more of it: a `.dark` ancestor
class toggled on `document.documentElement`, with hand-written override
rules appended to that same `<style>` block, e.g.:

```css
.dark .bg-white { background-color: #0f172a; }
.dark .text-slate-900 { color: #f1f5f9; }
.dark .border-slate-200 { border-color: #334155; }
/* …one rule per Tailwind utility class index.html actually uses that
   needs a dark-mode override — see "Root background and general UI"
   below. */
```

This supersedes an earlier draft of this spec that proposed regenerating
the compiled stylesheet via the Tailwind CLI (`npx tailwindcss`,
`darkMode: 'class'`). That approach isn't wrong exactly, but it invents a
new build step this repo doesn't have anywhere else, when the codebase
already has an established, lower-friction pattern for precisely this
situation, applied three times over. **No new tooling dependency, no CLI
invocation, no config file — just more hand-written rules in the block
that already exists for this purpose.**

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
effect of an unrelated feature. Theme uses its own `localStorage` key,
`ukRetirementPlanner.theme` — following the existing `STORE_KEY =
'ukRetirementPlanner.v1'` naming convention (index.html:701) rather than a
new naming style — that Export/Import never touches.

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
  `document.documentElement` (a `useEffect` keyed on the computed
  boolean) — the one place every hand-written `.dark …` rule from
  decision 1 keys off.
- **Flash-of-wrong-theme:** not called out as a hard requirement by the
  user, but worth avoiding as a matter of basic correctness once "system"
  is the default — a static `index.html` has no server-side render to get
  this right for free. Implementation adds a small inline script at the
  very top of `<head>` (before the compiled CSS/JS parse) that reads the
  same `ukRetirementPlanner.theme` key and `matchMedia` query and sets the
  `dark` class synchronously, before first paint. This is a few lines
  duplicating the same two reads the React code also does — not a new
  requirement, just doing the first paint correctly.

### Resolved design decision 3: toggle UI and placement

Intent confirmed the toggle lives in the existing ⚙ Data menu
(`SettingsMenu`, index.html:1708) and that it's a manual override
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

Note for implementation: `SettingsMenu`'s popover now positions itself via
the `.settings-popover` class (intent 006), not literal Tailwind utility
classNames — the new Theme section is added to the popover's *content*
(same as Export/Import already are), which that positioning change didn't
touch, so no adjustment to this decision is needed beyond the line-number
refresh above.

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
index.html:1217/1425) don't use CSS classes for their colours — `stroke`/
`fill` are literal hex values passed as React props into SVG elements, so
a CSS `.dark` override can't reach them. These two components alone need
the effective theme threaded in as a plain boolean prop, `isDark`,
matching the existing prop-drilling style already used for `accent`
(`SliderWithInput`/`PersonInputs`) — no `Context` is introduced; nothing
else in the tree needs the value passed explicitly, since everything else
is styled with hand-written `.dark …` CSS rules (decision 1) that key off
the ambient `.dark` class automatically.

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
- **Unchanged: `ChartTooltip`** (index.html:1195) — it already renders as
  a dark floating card (`bg-slate-900/95`, white text) regardless of page
  theme, which reads fine sitting on top of either a light or dark chart
  background as-is. No light/dark variant needed here; leaving it alone is
  the resolved decision, not an oversight.
- **`Legend`** currently takes its text colour from Recharts' own default
  (dark grey), which is close to unreadable on a dark chart background —
  needs an explicit `wrapperStyle.color` picked the same way as the axis
  colours above.

### Root background and general UI

The outermost page wrapper (index.html:2092,
`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100`,
immediately followed by the hand-written `<style>` block at
index.html:2093) gets a `.dark` override on its gradient (dark slate
tones, no blue tint — the blue wash reads as a light-mode design choice,
not one of the "colour meanings" intent's Out of scope section protects),
added to that same `<style>` block per decision 1. Every other card/text/
border utility class already in `index.html` gets a corresponding
hand-written `.dark <utility> { … }` rule added alongside it in that
block, following Tailwind's own light/dark colour-step conventions (e.g.
`.dark .bg-white{background-color:#0f172a}`, `.dark
.text-slate-900{color:#f1f5f9}`, `.dark
.border-slate-200{border-color:#334155}`) — this is the bulk of the
implementation work but involves no further design decisions beyond what's
resolved above; the spec fixes the mechanism and the two exceptions
(charts, tooltip), not every individual class pairing.

### Versioning

`main` is currently at `sw.js` `CACHE = 'retirement-planner-v7'` (bumped
by the intent-006 mobile fix that merged while this was in progress). This
ships as `v8`, with a matching `USER_CHANGELOG` `v8` entry — dark mode is
squarely user-facing per intent 005's inclusion rule (a new, visible
feature).

## Non-goals

See `intent/008-dark-mode.md` §Out of scope — unchanged: no per-section
theme overrides, no new colour-meaning/branding decisions beyond adapting
existing accents into a dark palette, no effect on `projectJoint()` or any
figure the app produces.

## Constraints

See `intent/008-dark-mode.md` — unchanged, with the following additions
resolved above:

- Theme preference lives in its own `localStorage` key
  (`ukRetirementPlanner.theme`), separate from `STORE_KEY`/
  `PERSISTED_FIELDS`, and must **not** be included in Export/Import's plan
  JSON (Resolved design decision 2).
- Dark-mode CSS is hand-written directly into the existing inline
  `<style>` block (index.html:2093), following the precedent intents 003/
  005/006 already established for Tailwind utilities the compiled
  stylesheet has no rule for — **no Tailwind CLI, build step, or new
  tooling dependency is introduced** (resolved design decision 1).
- `WealthChart`/`IncomeChart` take an explicit `isDark` boolean prop; no
  `React.Context` is introduced for theme.
- Series/gradient colours, `ReferenceLine` colours, and `ChartTooltip` are
  explicitly unchanged between themes (resolved design decision 4) — this
  is scope, not something later PRs should "finish."

## Open questions

None remaining. Both points `intent/008-dark-mode.md` left open (palette
mechanism, override persistence location) are resolved above.
