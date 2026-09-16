# 003 — Mobile sticky summary bar

## Status

Resolved — ready for implementation. Fleshed out from
`intent/003-mobile-sticky-summary-bar.md` by resolving the two decisions it
deliberately left open: the exact sizing/wrapping mechanism for the summary
boxes, and whether the "only the summary boxes stay pinned" behaviour change
is mobile-only or applies at every viewport width.

## Problem

See `intent/003-mobile-sticky-summary-bar.md`. Two related issues in the
`<header>` block at `index.html:1857-1914`:

1. The three summary boxes (Pot, Income, Living Standard) live inside a
   height-capped (`max-h-24`, 96px) collapsing panel with a fixed
   `text-base md:text-xl` value size. On mobile, a large pot value (e.g.
   "£11,006,211") or the "Below Minimum" label don't fit that size/height
   and get clipped rather than shown in full.
2. The entire `<header>` — title, Reset button, Add a partner button, *and*
   the summary panel — shares one `sticky top-0 z-50` wrapper, so the title
   and buttons stay pinned on scroll along with the boxes, for no reason
   tied to their content.

## Outcome

### 1. Split the sticky scope — applies at every width

`index.html:1857-1914` currently nests everything in one `<header
className="... sticky top-0 z-50">`. Restructure into two independent
top-level siblings (wrap the pair in a `React.createElement(React.Fragment,
...)` where the header is currently returned):

- **`<header>`** keeps its existing classes minus `sticky top-0 z-50` (so
  just `"bg-white border-b border-slate-200 shadow-sm"`), containing exactly
  what it does today: the title/subtitle `<div>` and the
  Saved/Reset/Partner-button `<div>` (`index.html:1859-1892`, unchanged).
  It scrolls away with the rest of the page.
- **A new sticky bar**, `<div className="sticky top-0 z-50 bg-white
  shadow-sm border-b border-slate-200">`, containing exactly the existing
  collapsing summary panel (`index.html:1892-1914`) unchanged in its
  `isScrolled`-driven show/hide behaviour (still `useState`/`useEffect` at
  `index.html:1616-1623`, `window.scrollY > 420`) except for the sizing
  fixes in §2 below. It carries its own background/shadow/border now that
  it's no longer riding on the header's.

This is a structural change to what the sticky wrapper contains, not a
viewport-conditional one — it applies at every width, per the answer to "what
should stay pinned" (only the three boxes, no width qualifier). It produces
no visible change to desktop's static (unscrolled) appearance, and on
desktop, once scrolled, the only visible difference is that the title/button
row is no longer artificially pinned — an improvement, not a regression, so
it doesn't conflict with the intent's "desktop/web is unaffected" framing for
the *sizing* fix in §2 (which is the part actually reported as broken on
mobile only).

### 2. Mobile-only sizing/wrapping fix

Confirmed mobile-only (not reproduced on web/desktop) — all changes below are
scoped to below the `md` breakpoint (768px), reusing the split the box
classes already make today (`text-base md:text-xl`, `text-[10px] md:text-xs`)
rather than introducing a new breakpoint convention.

**a. Base font size.** Both currency values and the Living Standard label
share one mobile size, chosen up front rather than measured/shrunk at
runtime — the Living Standard label is a small, fixed, enumerable set (`level`
at `index.html:598/604/610/616`: "Comfortable", "Moderate", "Minimum", "Below
Minimum") so a static size beats adding a shrink-to-fit measurement routine
for four known strings. Change both value `<p>` classes
(`index.html:1901`, `1907`, `1913`) from `text-base md:text-xl` to `text-xs
md:text-xl` — `md:` and above stay exactly as today. (`text-sm` was tried
first during implementation; at the narrowest supported viewport it still
forced an ugly mid-word break, e.g. "Minimu"/"m", on the longest Living
Standard label. `text-xs` — the same size already used for the box labels at
`md:` — wraps that case cleanly at the word boundary instead, confirmed via
DOM measurement in mobile emulation.)

**b. Wrapping instead of clipping.** At `text-xs` in a 3-column mobile grid,
an 8+ figure pot value or "Comfortable" can still wrap mid-word on the
narrowest supported viewport (~320px) — the fix's guarantee is that this
wraps and stays fully visible, never that everything fits on one line or
breaks only at clean word boundaries. Two changes make the wrapping itself
safe (no clipping, no horizontal overflow):
- Add `break-words` to all three value `<p>` classes (`index.html:1901,
  1907, 1913`), so long unspaced text (a wrapped number, "Below Minimum")
  wraps at the container edge instead of overflowing it.
- Add `min-w-0` to each of the three box `<div>`s (`index.html:1897, 1903,
  1909`). Grid items default to a content-based minimum width that ignores
  their track size, which is what pushes/overflows a column today instead of
  wrapping; `min-w-0` lets each column actually shrink to the grid's 3-way
  split and forces wrapping to kick in.

**c. Remove the height clip.** `index.html:1893`'s
`` `transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-24 border-t border-slate-200' : 'max-h-0'}` ``
hard-caps the expanded state at 96px, clipping anything taller (a wrapped
second line). Raise the expanded cap to `max-h-40` (160px) — confirmed via
DOM measurement in mobile emulation to comfortably fit label + two wrapped
value lines at `text-xs` (tallest observed: 132px, for a two-line-wrapped
pot value alongside a two-line-wrapped "Below Minimum" at 320px) with room
to spare. (`max-h-0`/`max-h-40` are still two fixed
values so the existing CSS transition keeps animating smoothly — an
unbounded `max-h-none` can't be transitioned.) Combined with §2's move to the
new sticky wrapper, this class moves from the header's inner collapsing
`<div>` to the new sticky bar's inner collapsing `<div>` at what is currently
`index.html:1892-1893`.

**Why not abbreviate the currency instead** (e.g. `formatCurrencyK`,
already defined at `index.html:582` and used elsewhere)? Ruled out by the
intent's explicit non-goal — full, exact figures stay, sizing/wrapping is
the only permitted mechanism.

### 3. No changes below the header

The larger, always-visible stat cards further down the page
(`index.html:1926-1977` — Retirement Years/Combined Pot/Household
Income/Living Standard) are a separate block, already sized generously
(`text-2xl`) with no height cap, and aren't part of the reported bug. They
are untouched.

### 4. `docs/TOOL_DOCUMENTATION.md` updates

- §3.4 ("Reading the outputs", `docs/TOOL_DOCUMENTATION.md:103`) already says
  "These repeat in a sticky banner once you scroll" — still accurate after
  this change (it's still a sticky banner; just no longer bundled with the
  title/buttons) and needs no wording change.
- §8 (Build history) gets a new entry summarising the mobile squash fix and
  the sticky-scope narrowing, per `CLAUDE.md`.
- No changes needed to §4 (financial technicals) or §5.4 (verification
  checklist) — this is a pure UI change, `projectJoint()` is untouched.

### 5. Verification

No automated test covers visual layout (`tests/test-engine.js` only exercises
`projectJoint()`). Verify manually, per `CLAUDE.md`'s "No build step"
guidance, by serving `index.html` and using browser mobile emulation at:
- 320px width (smallest realistic target) with a large pot (7+ figures) and
  each of the four Living Standard levels forced via income — confirm no
  clipping/overlap, wrapping is legible, and the sticky bar's expanded height
  fits the content.
- 375px and 412px (iPhone SE / typical Android, matching the reported
  screenshot) — same checks.
- `md` (768px) and above — confirm desktop appearance is pixel-identical to
  before this change while unscrolled, and that scrolling now leaves the
  title/buttons behind while the summary bar pins, matching §1's intended
  behaviour.

## Non-goals

Carried over unchanged from `intent/003-mobile-sticky-summary-bar.md`:

- No abbreviated currency values.
- No new summary metrics.
- No change to Reset/Add-a-partner functionality, only their stickiness.
- No redesign of the page content below the header.

Additionally out of scope for this spec:

- No dynamic/JS shrink-to-fit font sizing — the static `text-xs` choice in
  §2a covers the fixed Living Standard label set without that complexity.
- No change to the 3-column grid layout itself (e.g. stacking to a single
  column on the narrowest widths) — wrapping within the existing 3-column
  grid is the chosen fix, per the intent's wrapping-not-redesign framing.

## Constraints

Carried over from the intent, made concrete above:

- `SliderWithInput`, `PersonInputs`, `CustomTooltip`, `WealthChart` and
  `IncomeChart` stay module-level and memoised, per `CLAUDE.md` §5.3 — this
  change doesn't touch any of them; the restructured header/sticky-bar JSX
  stays inline in the same top-level component it's already in today (no new
  subcomponent is introduced, so no new risk of an inline-component
  performance regression).
- Reuses the existing `isScrolled` state/listener (`index.html:1616-1623`)
  unchanged — no second scroll mechanism.
- `docs/TOOL_DOCUMENTATION.md` §8 and `CHANGELOG.md` both updated in the same
  PR, per `CLAUDE.md`.
- Single-file PWA constraint holds; bump `CACHE` in `sw.js` on ship.
- Per the AI SDLC workflow, this PR also moves
  `intent/003-mobile-sticky-summary-bar.md` and this spec file into
  `intent/done/` / `spec/done/` once implemented and merged, and removes
  `plan.md`.

## Open questions

None remaining — the intent's two open points (sizing mechanism for the
summary boxes, and whether the sticky-scope change is viewport-scoped) are
resolved above.
