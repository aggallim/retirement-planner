# 006 — Data menu popover overflows off-screen on mobile

## Status

Resolved — written after the fact. The fix was implemented, tested and
pushed to a session-assigned branch before this intent file existed; this
document (and its accompanying spec) were added retroactively as a process
correction — bug fixes go through the same intent-first lifecycle as any
other requirement, per `CLAUDE.md` and `CONTRIBUTING.md` — not because the
underlying problem or its fix changed from what's described below.

## Problem

On a narrow mobile viewport, opening the **⚙ Data** menu (Export plan /
Import plan / What's new) shows a panel that opens mostly or entirely off
the left edge of the screen. The Export/Import buttons and the plaintext-
data warning are cut off and unreadable. Reported directly by the user
from a real device, with a screenshot showing the panel's left portion
clipped by the viewport edge.

`SettingsMenu`'s popover (`index.html`, className `absolute right-0 mt-2
w-72 ...`) anchors its right edge against its own trigger button — the
`relative` wrapper around it is just the button, not the header or the
viewport. In the header's `flex-wrap` button row, that button sits left of
centre (after Reset, before Add-a-partner/Couple), so on a narrow phone
there is much less than the panel's 18rem (288px) width available to its
left, and the panel spills off the left edge of the screen.

This is the third time this exact popover has broken in a mobile/narrow
context:
- Intent 004 added the `w-72`/`right-0` classes to the popover with no
  matching CSS in the inlined Tailwind stylesheet — silently inert, so the
  popover was never actually 288px wide or right-anchored.
- Intent 005 found and fixed the missing CSS (the classes now do
  something real). That's what made *this* bug visible — the popover
  immediately became 288px wide and right-anchored, and started
  overflowing off-screen on mobile, because `right: 0` was always the
  wrong anchor for a narrow viewport, independent of whether it had real
  CSS behind it. Intent 005's verification pass was desktop-viewport only,
  so this didn't surface until a real device reported it.

## Outcome

The Data menu popover stays fully within the viewport at any supported
width — nothing is ever cut off or unreachable — without changing its
existing desktop appearance (opened just below and right-aligned to the
Data button).

## Non-goals

- No redesign of the Data menu's content or the Export/Import/What's new
  flows themselves — positioning only.
- No click-outside-to-dismiss or backdrop overlay — not part of the
  reported bug, out of scope.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` bumped per the usual
  deploy convention, since this is user-facing.
- Must be verified at a genuinely narrow viewport (not just read from the
  code) — this is a visual layout bug, the same lesson intent 005 already
  drew from missing this exact class of issue on a desktop-only pass.
