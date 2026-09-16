# Plan — 003 mobile sticky summary bar

Breaks `spec/003-mobile-sticky-summary-bar.md` into an implementation
sequence. Working file only — deleted (`git rm plan.md`) in the same commit
that finishes cleanup, per `CLAUDE.md`.

## Step 1 — Restructure the header JSX (`index.html:1857-1914`)

The whole render tree is one `React.createElement("div", {min-h-screen...},
style, header, ...restOfPage)` — the outer div already takes multiple
sibling children, so no new `Fragment` is needed. Just stop nesting the
summary panel inside `<header>` and make it a sibling instead.

**1a. `<header>` loses its sticky classes.** Change
`index.html:1858`'s className from
`"bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50"` to
`"bg-white border-b border-slate-200 shadow-sm"`. Its only child stays the
existing title/buttons `<div>` (`index.html:1859-1892`) — unchanged.

**1b. The collapsing summary panel becomes its own top-level sibling**,
inserted immediately after `</header>` and before the
`"max-w-7xl mx-auto px-6 py-8"` main-content div (currently
`index.html:1914-1915`). Move the panel wrapper currently at
`index.html:1892-1914` out from inside `<header>` to sit alongside it, and
give it its own background/shadow/border plus the raised height cap (spec
§2c):

```
className: `sticky top-0 z-50 bg-white shadow-sm transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-40 border-b border-slate-200' : 'max-h-0'}`
```

(`border-t` becomes `border-b` — this bar now pins at the very top of the
viewport with page content scrolling underneath it, not below the header it
used to share a box with, so the separating border belongs on its bottom
edge, not its top.)

## Step 2 — Mobile sizing/wrapping fixes on the three boxes (spec §2a/§2b)

Inside that panel's `grid grid-cols-3 gap-3` row (three boxes: Total/
Combined Pot, Annual/Household Income, Living Standard — currently
`index.html:1896-1914`):

- Each box `<div>` (`index.html:1897`, `1903`, `1909`) gains `min-w-0`
  alongside its existing classes, so it can actually shrink to the grid
  track instead of overflowing it.
- Each value `<p>` (`index.html:1901`, `1907`, `1913`) changes
  `text-base md:text-xl` → `text-sm md:text-xl` and gains `break-words`.
  `md:` sizing is untouched — desktop stays exactly as today.
- Label `<p>`s (`text-[10px] md:text-xs ...`) are unchanged.

## Step 3 — Manual verification (no automated layout test exists)

Serve the folder (`python3 -m http.server 8000`) and check in browser mobile
emulation, per spec §5:

- **320px** — force each of the four Living Standard levels (Comfortable /
  Moderate / Minimum / Below Minimum, via household income) and a large pot
  (7+ figures, e.g. push a slider/input to get well past £1,000,000).
  Confirm: no clipping, no horizontal overflow, wrapped text stays inside
  its box, and the sticky bar's `max-h-40` is tall enough for the tallest
  realistic combination once scrolled. Bump `max-h-40` if it isn't and note
  the change here before moving on.
- **375px and 412px** — same checks (412px roughly matches the reported
  screenshot).
- **≥768px (`md`)** — confirm the unscrolled page is pixel-identical to
  `main` before this change, and that scrolling now leaves the title/Reset/
  Partner row behind while only the three-box bar pins to the top (the
  behaviour the intent asked for, applying at this width too per spec §1).
- Also sanity-check `isScrolled`'s existing 420px scroll-trigger still feels
  right now that the header above it is shorter (no longer carrying the
  summary panel) — no code change expected here, just confirm visually.

## Step 4 — Housekeeping the "Working in this repo" rules require

- **`sw.js`** — bump `CACHE = 'retirement-planner-vN'` to the next version,
  since `index.html` changed.
- **`docs/TOOL_DOCUMENTATION.md`** — add a §8 Build history entry
  summarising the fix (mobile squash + sticky-scope split) and why. Per
  spec §4, §3.4's existing "These repeat in a sticky banner once you
  scroll" line needs no wording change — double-check that's still true
  once Step 1-2 are in, but no edit is expected there.
- **`CHANGELOG.md`** — one entry under today's date naming
  `intent/003-mobile-sticky-summary-bar.md` / `spec/003-...md`.
- **`node tests/test-engine.js`** — run it. Expected to be unaffected (this
  is a pure UI change, `projectJoint()` untouched), but confirm it still
  passes before pushing.

## Step 5 — Cleanup and PR

- Move `intent/003-mobile-sticky-summary-bar.md` → `intent/done/`,
  `spec/003-mobile-sticky-summary-bar.md` → `spec/done/`.
- `git rm plan.md` (this file).
- Push; PR #4 (already open as a draft, tracking this branch) picks up the
  commits automatically.
- Mark PR #4 ready for review once Steps 1-5 are all pushed and CI
  (`test-engine.yml`) is green.

## Suggested commit sequence

1. Header restructure + sizing/wrapping fix (Steps 1-2).
2. `sw.js` cache bump + docs + CHANGELOG (Step 4), after Step 3's manual
   verification confirms the values chosen in Steps 1-2 (especially
   `max-h-40`) actually hold up.
3. Cleanup: move intent/spec to `done/`, delete `plan.md` (Step 5).

Small enough to combine 2 and 3 into one commit if that reads better at
implementation time — not load-bearing either way.
