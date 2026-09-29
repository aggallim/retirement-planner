# 031 — Thousands separators and wider number inputs

## Status

Feature from the UI/UX review of 2026-09-29 (Notion: "UI/UX Form &
Data-Entry Review", P0). Decisions settled by grilling with the owner on
2026-09-29. Ships with 030 and 032 as one release.

## What's wanted, and why

Typed values show as raw digits (`250000`), which is hard to read and easy
to mistype for the large sums this app takes. The text box is a fixed
`w-20`, so seven-digit values clip. Pasting `£1,200` silently drops the
symbols.

## Resolved decisions

- **Display:** when not focused, format with `Intl.NumberFormat('en-GB')`
  (`250,000`) on **every** field via one formatter (a no-op below 1,000, so
  ages and percentages look unchanged). While focused, show raw digits so
  editing and the caret behave normally; reformat on blur.
- **Decimals:** keep the field's existing precision; don't add trailing
  zeros.
- **Paste:** strip `£`, `,`, spaces and `%` before the existing
  `[^0-9.]` sanitiser, so `£1,200` becomes `1200`.
- **Width:** the box grows to fit its formatted text (`ch`-based, with a
  minimum, capped so the row never overflows at 320px).
- **Pure functions:** parsing and formatting are extracted to module-level
  pure functions (`formatNumber`, `parseNumberInput`) and unit-tested in
  `tests/test-engine.js` (pasted `£1,200`, `1234567.89`, blank, out of range).
- **Blank or non-numeric input** restores the previous valid value on blur
  instead of resetting to the field's minimum (a small behaviour change; it
  is user-facing, so it gets a test and a `USER_CHANGELOG` line).
- **Commit and clamp:** otherwise unchanged (blur/Enter, clamp to min/max).
  Feedback on clamping is a separate P1 item.
- **Slider value text:** shares the same formatter as 030's `aria-valuetext`.
- **Engine and stored values:** unchanged; only display formatting.

## Delivery

`index.html` (`SliderWithInput`, one shared formatter);
`docs/TOOL_DOCUMENTATION.md` §3.1; `CHANGELOG.md`; `USER_CHANGELOG`
(user-facing); `sw.js` cache and `APP_VERSION` bump. Verify manually: enter
`1234567.89`, paste `£1,200`, check 320px width and 200% zoom, and confirm
no regression in slider drag performance (§5.3).
