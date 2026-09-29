# 031 — Thousands separators and wider number inputs

## Status

Feature from the UI/UX review of 2026-09-29 (Notion: "UI/UX Form &
Data-Entry Review", P0). **Proposed, not yet grilled** — confirm the
decisions below with the owner before implementing.

## What's wanted, and why

Typed values show as raw digits (`250000`), which is hard to read and easy
to mistype for the large sums this app takes. The text box is a fixed
`w-20`, so seven-digit values clip. Pasting `£1,200` silently drops the
symbols.

## Resolved decisions (proposed)

- **Display:** when not focused, format with `Intl.NumberFormat('en-GB')`
  (`250,000`). While focused, show raw digits so editing and the caret
  behave normally; reformat on blur.
- **Decimals:** keep the field's existing precision; don't add trailing
  zeros.
- **Paste:** strip `£`, `,`, spaces and `%` before the existing
  `[^0-9.]` sanitiser, so `£1,200` becomes `1200`.
- **Width:** size the box by content (`ch`-based, with a sensible minimum)
  so a seven-figure value plus prefix and suffix never clips at 320px.
- **Commit and clamp:** unchanged (blur/Enter, clamp to min/max). Feedback
  on clamping is a separate P1 item.
- **Slider value text:** shares the same formatter as 030's `aria-valuetext`.
- **Engine and stored values:** unchanged; only display formatting.

## Delivery

`index.html` (`SliderWithInput`, one shared formatter);
`docs/TOOL_DOCUMENTATION.md` §3.1; `CHANGELOG.md`; `USER_CHANGELOG`
(user-facing); `sw.js` cache and `APP_VERSION` bump. Verify manually: enter
`1234567.89`, paste `£1,200`, check 320px width and 200% zoom, and confirm
no regression in slider drag performance (§5.3).
