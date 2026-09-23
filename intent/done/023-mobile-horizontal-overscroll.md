# 023 — Horizontal overscroll reveals blank whitespace on mobile

## Status

Proposed.

## Problem

On a phone — both installed as a PWA and browsing the deployed site
directly — swiping left anywhere on the page scrolls the whole viewport
sideways and reveals a stretch of unstyled blank (white) space to the
right of the app's content, instead of the swipe being absorbed as normal
vertical-only scrolling. Reported directly by the user from a real Android
device, with a screenshot showing the app's dark-themed content shifted
left and plain white filling the rest of the screen. The gap is a few tens
to a little over a hundred pixels wide — not a full extra screen — and the
page snaps back to normal once the swipe is released.

Root cause: the page has no horizontal-scroll guard at all. `body`'s CSS
(`index.html`, the inline `<style>` block containing `overscroll-behavior-y:
contain`) only constrains *vertical* overscroll (added to stop iOS's
pull-to-refresh-style bounce); nothing stops the document from becoming
horizontally scrollable in the first place. It becomes scrollable because
several elements are wider than they visually appear: `SliderWithInput`'s
info tooltip and the two other `tooltip-content` panels (`index.html`
around lines 1039, 1890, 1932) are `w-56` (224px) boxes, positioned
`absolute left-0 bottom-full` against small inline trigger icons scattered
through the slider/input rows, and hidden via `.tooltip-content { opacity:0;
visibility:hidden; }` (index.html ~2892) rather than `display:none`.
`visibility: hidden` keeps an element in layout — its box still counts
towards the page's scrollable width — so wherever a trigger icon sits close
enough to the right edge of a narrow viewport, its 224px-wide hidden
tooltip box pushes the document's true content width past the viewport's,
making the page horizontally scrollable even though nothing is ever meant
to be visible out there. Swiping into that reachable-but-invisible area is
what shows as blank whitespace. This is the same shape of bug as intent
006 (an off-screen popover) but caused by invisible layout width rather
than a visible panel, and — unlike 006 — it can recur from *any* future
element that happens to sit even slightly wider than the viewport, not
just one specific popover, because nothing in the page currently prevents
that from becoming scrollable.

## Outcome

The page never becomes horizontally scrollable on any viewport, regardless
of which element (now or added later) happens to be positioned or sized
slightly past the viewport's right edge — swiping left/right always does
nothing (or, if the browser shows one, its own bounce/glow effect over the
existing content), never reveals blank space or shifts the app's content
sideways. This is a defensive, page-level fix (not a fix to each individual
oversized element) both because the immediate cause is diffuse (three
tooltip instances, and potentially other elements later) and because 006
already showed this exact class of narrow-viewport bug recurring across
unrelated elements when only fixed one at a time.

## Non-goals

- No change to the tooltip/popover components' own visible appearance,
  sizing, or trigger behaviour on any viewport — desktop and mobile look
  and behave exactly as before whenever a tooltip is actually shown.
  Purely stopping their *hidden* state from being horizontally reachable.
- No change to vertical scroll/overscroll behaviour — `overscroll-behavior-y:
  contain` is untouched.
- No redesign of `SliderWithInput` or the Data menu popover (006) —
  neither is broken in its visible state; this is about invisible layout
  width, not visible positioning.
- Not a calculation change — no touch to `projectJoint()` or any figure.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` gets bumped per the
  usual deploy convention, since this is user-facing.
- `SliderWithInput`, `PersonInputs`, `CustomTooltip`, `WealthChart` and
  `IncomeChart` stay module-level and memoised (`CLAUDE.md` §5.3) — this
  fix is expected to be CSS-only and touch none of them, but must not
  reintroduce an inline component definition if it ends up touching any.
- Must not break the mobile sticky summary bar (intent 003, `index.html`
  ~line 3009, `position: sticky`) or the Data menu popover's `position:
  fixed` narrow-viewport override (intent 006) — both need to keep working
  exactly as before at narrow widths.
- Must be verified at a genuinely narrow viewport by actually attempting a
  horizontal swipe/scroll, not just read from the code — this is a visual
  layout bug, the same lesson intent 006 already drew from missing this
  exact class of issue on a desktop-only pass.
