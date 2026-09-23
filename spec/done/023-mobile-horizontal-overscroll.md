# 023 — Horizontal overscroll reveals blank whitespace on mobile

## Status

Proposed.

## Problem

See `intent/023-mobile-horizontal-overscroll.md`. The page has no
horizontal-scroll guard, so any element whose layout box extends past the
viewport's right edge — even while invisible, like the `w-56`
`tooltip-content` panels hidden via `visibility: hidden` rather than
`display: none` — makes the whole document horizontally scrollable.
Swiping left on a narrow (phone) viewport then scrolls into that reachable
space and shows unstyled blank white background instead of the app.

## Outcome

Add a page-level horizontal-scroll clamp to `index.html`'s existing inline
`<style>` block (the one already holding `body { margin:0; background:
#f8fafc; overscroll-behavior-y: contain; }`, `index.html` ~line 28),
alongside it rather than replacing it:

```css
html, body { overflow-x: clip; }
body { overscroll-behavior-x: none; }
```

- `overflow-x: clip` on both `html` and `body` is the actual fix: it
  clamps the document's rendered/scrollable width to the viewport
  regardless of what any descendant's layout box does, so nothing — the
  three existing tooltip panels, the Data menu popover, any chart,
  anything added later — can ever make the page horizontally scrollable.
  Setting it on both (rather than just one) is required for the clamp to
  actually take effect on `document.documentElement.scrollWidth`/
  `window.scrollX` — confirmed by testing (see Verification below).
  **Not `overflow-x: hidden`**: tried first, and clamps the scroll width
  just as well, but `hidden` turns `html`/`body` into scroll containers,
  which broke the mobile sticky summary bar's `position: sticky`
  (`getBoundingClientRect().top` stayed strongly negative on scroll
  instead of clamping to `0` — confirmed by testing, matching the
  known-risk note in the intent/this spec's Constraints). `overflow-x:
  clip` clamps the same way without making the box a scroll container, so
  `position: sticky` on `#3009`'s summary bar keeps working — confirmed
  by testing (see Verification). Browser support for `overflow: clip`
  (Chrome 90+/2021, Firefox 97+/2022, Safari 16+/2022) is old enough by
  2026 to be safe on any phone this PWA targets.
- `overscroll-behavior-x: none` on `body` is defence in depth alongside
  the existing `overscroll-behavior-y: contain` — belt-and-braces against
  any residual horizontal rubber-band/bounce effect at the edge, on
  browsers where that's a separate behaviour from actual scrollability.

No component, JSX/`React.createElement` structure, or tooltip positioning
changes — this is a two-line CSS addition next to the existing viewport
rule it's conceptually paired with.

### Why not fix the tooltip positioning instead?

Considered and rejected: repositioning or clamping each `tooltip-content`
individually (e.g. `right-0` on tooltips near the right edge, or switching
to `display: none` toggled via a class) only fixes the three current
instances, exactly the narrow fix intent 023 explicitly avoids per its
Outcome section (diffuse cause, previously recurring bug shape per intent
006). The page-level clamp fixes this occurrence and forecloses the whole
class of future ones from any other element, for two lines of CSS with no
behavioural trade-off — nothing in this app currently relies on
intentional horizontal scrolling anywhere.

### Verification

No automated test covers visual/scroll layout — `tests/test-engine.js`
covers `projectJoint()` only, untouched by this change, but still run to
confirm no regression (32/32 pass). Verified manually with a headless
Chromium pass at 375px (phone) and 1280px (desktop) viewport widths,
served locally:

- At 375px: `document.documentElement.scrollWidth` equals `window.
  innerWidth` (375, no horizontal overflow) both at rest and with every
  `tooltip-content` trigger (all 9 on the page) hovered so its tooltip is
  in the DOM's hidden state; `window.scrollTo(200, 0)` leaves `scrollX`
  at `0`. Same result at 1280px.
- A hovered tooltip trigger's `.tooltip-content` computes `opacity: 1;
  visibility: visible` — confirms the fix only clamps the *hidden* state's
  reach, not the tooltip's own visible behaviour.
- The mobile sticky summary bar (003, `.sticky`, `position: sticky`)
  keeps `getComputedStyle(...).position === 'sticky'` and its
  `getBoundingClientRect().top` clamps to `0` once scrolled at 375px —
  matches the unmodified `main` baseline exactly. (This is what ruled out
  `overflow-x: hidden` in favour of `overflow-x: clip`, above — `hidden`
  left `top` strongly negative, i.e. not sticking, on the same scroll.)
- The Data menu popover (006, `.settings-popover`) opens fully within the
  375px viewport (`left: 16, right: 359` inside `innerWidth: 375`).
- Desktop (1280px): full-page screenshot is byte-for-byte identical
  before/after the fix.

### Docs

- `CHANGELOG.md` gets a new entry naming this intent/spec.
- `USER_CHANGELOG` in `index.html` gets a new entry — user-facing, since
  the page no longer scrolls sideways into blank space on a phone — and
  `sw.js`'s `CACHE` bumps to match (`v13` → `v14`).
- No `docs/TOOL_DOCUMENTATION.md` change: nothing in §3–§7 describes page
  scroll behaviour, no calculation or input is touched (§5.4 verification
  checklist doesn't apply), and this doesn't remove/narrow/add a
  deliberate simplification (§7).

## Non-goals

Carried over from the intent: no tooltip/popover visual or behavioural
redesign, no vertical-overscroll change, no `SliderWithInput`/Data-menu
component redesign, no calculation change.

## Constraints

Carried over from the intent, made concrete above (module-level component
rule doesn't apply since no component is touched; sticky bar and Data
menu popover must keep working; verify at a genuinely narrow viewport).

## Open questions

None.
