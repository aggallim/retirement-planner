# 006 — Data menu popover overflows off-screen on mobile

## Status

Resolved — implemented. Written retroactively alongside the intent (see
its Status note) to resolve the one real open point: how to keep the
popover fully on-screen at narrow widths without disturbing its existing
desktop-anchored appearance.

## Problem

See `intent/done/006-mobile-data-menu-overflow.md`. `SettingsMenu`'s
popover `<div>` (`index.html`, className `absolute right-0 mt-2 w-72
bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-4
space-y-4`) anchors `right: 0` against its own trigger button — a
`position: relative` wrapper that is just the button — not the viewport.
At narrow widths the button sits well left of the screen edge inside the
header's `flex-wrap` row, so the 18rem-wide panel opens mostly or fully
past the left edge of the screen.

## Outcome

Replace the inline `absolute right-0 mt-2 w-72` positioning classes on the
popover `<div>` with one dedicated class, `.settings-popover`, added to
the component's inline `<style>` block alongside its other hand-added
utility rules (per `CLAUDE.md` §5.1 / `docs/TOOL_DOCUMENTATION.md` §5.1):

- **Default (≥640px)** — unchanged behaviour: `position: absolute; right:
  0; margin-top: 0.5rem; width: 18rem`, anchored to the trigger button
  exactly as before.
- **Below 640px** — a `@media (max-width: 639px)` override switches to
  `position: fixed; top: 1rem; left: 1rem; right: 1rem; width: auto;
  max-height: calc(100vh - 2rem); overflow-y: auto; margin-top: 0`, so the
  panel's size and position come from the viewport itself rather than the
  trigger button's location in the wrapped header row — it can't open
  off-screen regardless of where that button ends up.

640px matches Tailwind's existing `sm` breakpoint, already used elsewhere
in the same header (`hidden sm:inline` on the Reset/Data/Couple button
labels), rather than introducing a new breakpoint convention for this one
fix.

**Why not just change the anchor (e.g. `left-0` instead of `right-0`)?**
The button's horizontal position in the wrapped row isn't fixed relative
to the viewport — it varies with viewport width and with `hasPartner`
(which changes the width of the button to its right). No single static
anchor keeps an 18rem-wide panel fully on-screen across all narrow
widths; only decoupling the panel's position from the button (via `fixed`
+ viewport-relative insets) does.

### Verification

No automated test covers visual layout. Verified manually with a headless
Chromium pass at 320px, 375px and 1280px viewport widths, covering both
the Export/Import view and the What's new view: panel fully on-screen and
readable at all three narrow widths, and desktop (1280px) appearance
pixel-unchanged from before the fix.

### Docs

- `docs/TOOL_DOCUMENTATION.md` §8 Build history gets a new entry.
- `CHANGELOG.md` gets an entry naming this intent/spec.
- `USER_CHANGELOG` in `index.html` gets a new entry — user-facing, since
  the panel is now actually usable on a phone — and `sw.js`'s `CACHE`
  bumps to match (`v6` → `v7`).

## Non-goals

Carried over from the intent: no Data-menu content/flow redesign, no
click-outside dismissal.

## Constraints

Carried over from the intent, made concrete above. Per the lifecycle, this
PR carries `intent/done/006-mobile-data-menu-overflow.md` and this spec
directly in `done/`, since the fix was already implemented and verified
before this documentation was written (see both files' Status notes).

## Open questions

None.
