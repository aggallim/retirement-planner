# Plan — 008 dark mode support

Breaks `spec/008-dark-mode.md` into an implementation sequence. Working
file only — deleted (`git rm plan.md`) in the same PR that finishes
cleanup, per `CLAUDE.md`.

All line numbers below are against `index.html` on this branch as of the
merge with `main` (commit `7346dc1`, after picking up the mobile Data-menu
fix and the dev-workflow-improvements PR). Re-check them before editing if
anything else has merged to `main` since.

## Step 1 — Theme state, persistence, and the `dark` class (spec "Theme
state model", decision 2)

**1a. New persistence helpers**, placed next to the existing ones
(`index.html:700-721`, `STORE_KEY`/`loadSaved`/`saveState`/`clearSaved`/
`pick`) but kept **entirely separate** from `PERSISTED_FIELDS` per spec
decision 2:

```js
const THEME_KEY = 'ukRetirementPlanner.theme';
const loadTheme = () => {
  try { return localStorage.getItem(THEME_KEY) || 'system'; }
  catch { return 'system'; }
};
const saveTheme = (theme) => {
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
};
```

**1b. In `RetirementCalculator` (`index.html:1820`)**, alongside the other
`useState` declarations near the top:

```js
const [theme, setTheme] = useState(loadTheme()); // 'system' | 'light' | 'dark'
const [systemPrefersDark, setSystemPrefersDark] = useState(
  () => window.matchMedia('(prefers-color-scheme: dark)').matches
);
const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
```

**1c. Two new effects**, next to the existing auto-save effect
(`index.html:1847-1865` pre-Step-1 numbering):

- Persist `theme` on change: `useEffect(() => saveTheme(theme), [theme])`.
- Live-follow the OS while `theme === 'system'`: subscribe to
  `matchMedia('(prefers-color-scheme: dark)')`'s `change` event inside a
  `useEffect`, updating `systemPrefersDark`, cleaned up on unmount. (Runs
  unconditionally — cheap to leave subscribed even when `theme` isn't
  `'system'`, avoids resubscribing every time `theme` changes.)
- Apply the class: `useEffect(() => { document.documentElement.classList.toggle('dark', isDark); }, [isDark])`.

**1d. Anti-flash inline script**, added to `<head>` immediately before the
compiled `<style>` block (`index.html:16`), so it runs before any CSS
parses:

```html
<script>
  (function() {
    var t = localStorage.getItem('ukRetirementPlanner.theme') || 'system';
    var dark = t === 'dark' || (t === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  })();
</script>
```

Duplicates the same two reads as 1a/1b on purpose (spec: "a few lines
duplicating the same two reads the React code also does") — keep the
`THEME_KEY` string literal in sync with `THEME_KEY` above if either ever
changes.

## Step 2 — Toggle UI in the Data menu (spec decision 3)

**2a. Three new icon components**, added next to the existing ones
(`index.html:467-593`: `Wallet`, `X`, `Download`, `Upload`, `Settings`),
following the exact same inline-SVG functional-component pattern: `Monitor`,
`Sun`, `Moon`.

**2b. `SettingsMenu` (`index.html:1708-1817`) gains two new props**,
`theme` and `onThemeChange`, passed from its call site
(`index.html:2147-2149`, currently just `onExport`/`onImport`) —
`RetirementCalculator` passes `theme={theme}` and
`onThemeChange={setTheme}`.

**2c. New section inside the `'menu'` view**, inserted after the Import
section (`index.html:1780-1795`, ends with the `importError` paragraph)
and before the "What's new" link section (`index.html:1795-1800`), using
the same `pt-2 border-t border-slate-100` divider pattern as the
Export→Import boundary:

```js
React.createElement("div", { className: "pt-2 border-t border-slate-100 space-y-2" },
  React.createElement("p", { className: "text-xs font-semibold text-slate-500" }, "Theme"),
  React.createElement("div", { className: "flex gap-1" },
    [['system', Monitor, 'System'], ['light', Sun, 'Light'], ['dark', Moon, 'Dark']]
      .map(([value, Icon, label]) => React.createElement("button", {
        key: value,
        onClick: () => onThemeChange(value),
        title: label,
        className: `flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          theme === value
            ? 'bg-blue-600 text-white'
            : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-400'
        }`
      }, React.createElement(Icon, { className: "h-3.5 w-3.5" })))
  )
)
```

(Exact spacing/sizing to taste during implementation — the resolved part
is the three-way segmented control, its position in the menu, and reusing
the existing selected/unselected visual language, not this literal JSX.)

## Step 3 — Hand-written dark-mode CSS (spec decision 1)

All of this goes into the existing inline `<style>` block
(`index.html:2093`, the same one holding the font import, slider styling,
and the `.settings-popover` rules from the mobile-menu fix) — appended
after the existing rules, before the closing `` ` ``.

**3a. Root background** (`index.html:2092`,
`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100`):

```css
.dark .bg-gradient-to-br.from-slate-50.via-blue-50.to-slate-100 {
  --tw-gradient-from: #020617; --tw-gradient-via: #0f172a; --tw-gradient-to: #0f172a;
}
```

(Targeting the combined class list rather than each Tailwind gradient
utility individually, since `from-slate-50`/`via-blue-50`/`to-slate-100`
only appear together on this one element — simpler than three separate
`.dark .from-slate-50 { … }` rules that would also affect any other
element that happened to reuse just one of those classes.)

**3b. Enumerate every other `bg-*`/`text-*`/`border-*` utility class
actually used in `index.html`.** Mechanically: `grep -oE
'"[a-zA-Z0-9_ :/.\\-]+"' index.html` restricted to `className` string
literals (or just read through each component), collect the distinct set,
and add one `.dark <class> { … }` rule per class using a consistent
light→dark step mapping — shift each colour 4-5 Tailwind steps darker
(same hue) for `bg-*`, correspondingly lighter for `text-*`, and one step
for `border-*`:

| Light (as used) | Dark override |
|---|---|
| `bg-white` | `#0f172a` (slate-900) |
| `bg-slate-50` | `#0f172a` (slate-900) |
| `bg-slate-100` | `#1e293b` (slate-800) |
| `text-slate-900` | `#f1f5f9` (slate-100) |
| `text-slate-700` | `#cbd5e1` (slate-300) |
| `text-slate-600` | `#94a3b8` (slate-400) |
| `text-slate-500` | `#94a3b8` (slate-400) |
| `text-slate-400` | `#64748b` (slate-500) |
| `border-slate-200` | `#334155` (slate-700) |
| `border-slate-100` | `#1e293b` (slate-800) |

The same step mapping applies to every other hue in use for badges/
warnings/cards (`amber`, `blue`, `emerald`/`green`, `red`, `teal`,
`violet` — e.g. `bg-blue-50`/`text-blue-700`/`border-blue-200` pairs used
in the Living Standard and warning cards): shift each hue's `-50`/`-100`
backgrounds down to `-950`/`-900` and lighten `-600`/`-700` text up to
`-300`/`-400`, keeping the *hue* (and therefore its meaning — warning
red stays red) unchanged, per spec decision 4's "no new colour-meaning
decisions" and intent's Out of scope section.

Skip anything already theme-neutral: `ChartTooltip`'s `bg-slate-900/95` +
white text (spec: explicitly unchanged), and the handful of `text-white`/
`bg-blue-600` "always-filled" button styles that read fine unchanged in
both themes (e.g. the Export button, the selected-toggle style from Step
2c) — verify each visually in Step 5 rather than assuming.

**3c. Do not touch `.settings-popover` or its media query** — that's
unrelated to theme (viewport-width positioning), added by the mobile-menu
fix.

## Step 4 — Chart theming (spec decision 4)

**4a. Two module-level colour lookups**, placed just above `WealthChart`
(`index.html:1217`):

```js
const CHART_AXIS_COLOR = { light: '#64748b', dark: '#94a3b8' };
const CHART_GRID_COLOR = { light: '#e2e8f0', dark: '#334155' };
```

**4b. `WealthChart` and `IncomeChart` both take a new `isDark` prop.**
Call sites: `index.html:2475-2482` (`WealthChart`) and `index.html:2489-
2490` (`IncomeChart`) — add `isDark: isDark` to both (the `isDark` local
computed in Step 1b).

**4c. Inside each chart component**, swap the three hardcoded values that
are actually illegible on dark (everything else — series gradients,
`ReferenceLine` colours — stays hardcoded, per spec decision 4):

- `CartesianGrid`'s `stroke: "#e2e8f0"` → `stroke: isDark ? CHART_GRID_COLOR.dark : CHART_GRID_COLOR.light`
- Both `XAxis`/`YAxis`'s `stroke: "#64748b"` → `stroke: isDark ? CHART_AXIS_COLOR.dark : CHART_AXIS_COLOR.light`
- `Legend`'s `wrapperStyle` gains `color: isDark ? CHART_AXIS_COLOR.dark : '#1e293b'` (matching the axis colour in dark mode; Recharts' own default reads fine in light mode already, so light mode keeps a close-to-default dark slate rather than introducing a new light-mode colour choice)

`ChartTooltip` (`index.html:1195-1209`) is untouched — confirmed unchanged
in Step 5's manual check, not edited here.

## Step 5 — Manual verification (no automated UI test exists for this)

Serve the folder (`python3 -m http.server 8000`) and check in a real
browser, per spec + intent:

- **System**: with OS/browser set to light, then dark (devtools "Emulate
  CSS media feature `prefers-color-scheme`" is enough, no need to change
  the actual OS), confirm the app follows immediately without a reload,
  including a live flip while the tab stays open.
- **Manual override**: pick Light while OS is dark (and vice versa),
  reload, confirm it stuck (persisted, `THEME_KEY`) and did **not** revert
  to following the OS. Pick System again, confirm it goes back to
  following the OS live.
- **No flash**: hard-reload with the override set to the theme that
  differs from OS default — confirm no visible flash of the wrong theme
  before first paint.
- **Export/Import isolation**: set a theme override, export a plan, check
  the downloaded JSON has no theme-related key in it (spec decision 2).
  Import a plan on a "device" (browser profile) with a different theme
  override set, confirm the theme choice is untouched by the import.
- **Charts**: in dark mode, confirm gridlines, axis labels and the legend
  are all legible on both `WealthChart` and `IncomeChart`, in both
  individual and couple mode (couple mode has more series/legend entries).
  Confirm `ChartTooltip` still reads fine (it doesn't change).
- **Whole-app sweep**: toggle dark on and click through every card/section
  (inputs, warnings banner, PLSA gauge, longevity traffic light, sticky
  summary bar, the Data menu itself including its own What's new view) —
  hunting for anything from Step 3b's mechanical sweep that got missed
  (a light card on a dark page, or invisible text) rather than assuming
  the grep-driven list was complete.
- **`node tests/test-engine.js`** — expected unaffected (pure UI/CSS
  change, `projectJoint()` untouched); run it anyway to confirm.

## Step 6 — Housekeeping the "Working in this repo" rules require

- **`sw.js`** — bump `CACHE = 'retirement-planner-v7'` → `'retirement-planner-v8'`.
- **`index.html` `USER_CHANGELOG`** (`index.html:767` area) — new `v8`
  entry, plain language, e.g. "Added dark mode — follows your device's
  theme automatically, or set it manually from the ⚙ Data menu."
- **`docs/TOOL_DOCUMENTATION.md`**:
  - §3 user guide: a short new subsection (or an addition to §3.6 Saving
    and resetting) documenting the theme toggle's location and
    System/Light/Dark behaviour.
  - §7: dark mode isn't currently listed as a "Possible future addition"
    in this file (see PR #9's discussion — the Notion roadmap notes this
    was scoped against had drifted from this file), so there's nothing to
    check off here; no change needed to §7 beyond that non-finding.
  - §8 Build history: new entry summarising the feature and, per spec
    decision 1, *why* it's hand-written CSS rather than a Tailwind CLI
    rebuild (the precedent intents 003/005/006 already set).
- **`CHANGELOG.md`** — one entry under today's date naming
  `intent/008-dark-mode.md` / `spec/008-dark-mode.md`.

## Step 7 — Cleanup and PR

- Move `intent/008-dark-mode.md` → `intent/done/`,
  `spec/008-dark-mode.md` → `spec/done/`.
- `git rm plan.md` (this file).
- Push; PR #9 (already open as a draft, tracking this branch) picks up
  the commits automatically.
- Update the PR body's "Stage"/summary section to reflect implementation
  being done, check off the Test plan boxes, and mark the PR ready for
  review once `test-engine.yml` is green on the final push.

## Suggested commit sequence

1. Theme state/persistence/anti-flash script (Step 1).
2. Toggle UI in the Data menu (Step 2).
3. Hand-written dark-mode CSS sweep (Step 3) — likely the largest single
   commit; fine to split further (e.g. root + cards, then badges/warnings)
   if it gets unwieldy to review as one diff.
4. Chart theming (Step 4).
5. Housekeeping — `sw.js`, `USER_CHANGELOG`, docs, `CHANGELOG.md` (Step 6).
6. Cleanup — move intent/spec to `done/`, delete `plan.md` (Step 7).
