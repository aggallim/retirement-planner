# 003 — Mobile sticky summary bar

## Status

Proposed.

## Problem

On mobile viewports (not on web/desktop, which is confirmed fine), the
header's summary panel — Total/Combined Pot, Annual/Household Income, and
Living Standard — is squashed. The three boxes sit in a fixed-height
(`max-h-24`), three-equal-column grid sized for short values; a large pot
(e.g. "£11,006,211") or the longer Living Standard labels get clipped or
crushed rather than displayed in full.

Separately, the entire `<header>` — the "UK Retirement Planner" title,
the Reset button, and the Add a partner/Planning as a couple button —
is `sticky top-0`, not just the summary boxes. On mobile that means
scrolling down to reach the sliders and other inputs permanently loses
screen space to the title and buttons, which have no reason to stay
pinned once the user has scrolled past them.

## Outcome

1. **Only the three summary boxes stay pinned on scroll.** The title row
   and the Reset/Add-a-partner buttons scroll away normally with the rest
   of the page content; once the user scrolls past the hero, a compact bar
   containing just Total Pot (or Combined Pot), Annual/Household Income,
   and Living Standard sticks to the top of the viewport, freeing up
   vertical space for sliders and other inputs below it.
2. **Living Standard's font size accommodates its full label set without
   squashing.** The label is one of a known, fixed set ("Below Minimum",
   "Minimum", "Moderate", "Comfortable"); the box must size its text so
   the longest of these always renders in full on mobile, either by
   choosing a size up front that fits all of them or by shrinking to fit
   dynamically.
3. **Total Pot and Annual Income start at that same font size.** Currency
   values begin at the same text size as the Living Standard label rather
   than a separate, larger size. When a value (e.g. "£11,006,211") is too
   wide to fit on one line at that size, it wraps onto a second line
   instead of being clipped or squashed — it is never truncated or
   overlapped.
4. **The summary boxes are no longer height-capped in a way that clips
   wrapped content.** The current fixed `max-h-24` collapse constraint is
   replaced with something that grows to fit whatever the boxes need to
   display (including a wrapped second line), on mobile.
5. **Desktop/web is unaffected.** This is a mobile-viewport fix; the
   existing desktop/web layout and sizing, which is not reported as
   broken, should not visibly change.

## Non-goals

- **No abbreviating currency values** (e.g. "£11.0M") as a way to make
  them fit. Full, exact figures are always shown — the fix is wrapping
  and font sizing, not truncation.
- **No new summary metrics.** Still exactly the same three figures
  (pot, income, living standard) — this is a layout/behaviour fix, not a
  content change.
- **No change to Reset/Add-a-partner functionality.** They keep working
  exactly as they do today; only their stickiness while scrolling changes.
- **No redesign of the non-sticky page content below the header** (input
  cards, sliders, charts) — out of scope beyond the header/summary bar
  itself.

## Constraints

- **`SliderWithInput`, `PersonInputs`, `CustomTooltip`, `WealthChart` and
  `IncomeChart` stay module-level and memoised** (`CLAUDE.md` §5.3, tool
  docs §5.3). If the sticky summary bar is pulled into its own component,
  it must follow the same pattern — module-level, stable handlers — not
  an inline definition inside the parent.
- **Reuse the existing scroll-tracking state** (`isScrolled` and the
  scroll listener that drives it) rather than introducing a second,
  competing scroll mechanism.
- **UI-only change — no `projectJoint()` or calculation logic is
  touched.** The tool docs §5.4 verification checklist doesn't apply here,
  but any part of `docs/TOOL_DOCUMENTATION.md` that describes the header/
  summary bar behaviour should be updated to match, per `CLAUDE.md`.
- **Must be verified on an actual narrow mobile viewport** (device or
  browser mobile emulation), not just read from the code — this is a
  visual layout bug and the fix needs to be seen fixed, at a range of
  values including long ones (large pots, "Below Minimum").
- **Single-file PWA constraint holds.** Ships inside `index.html`, with
  `sw.js`'s cache version bumped per the usual deploy convention.
