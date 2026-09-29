# 030 — Accessible names for slider inputs

## Status

Bug report from the UI/UX review of 2026-09-29 (Notion: "UI/UX Form &
Data-Entry Review", P0). Decisions settled by grilling with the
owner on 2026-09-29. Ships with 031 and 032 as one release (branch
`feature/030-input-and-save-polish`).

## What's broken

`SliderWithInput` gives assistive tech no usable name for its controls:

- The `<label>` wraps only the text box's wrapper, and the `<input
  type="range">` sits outside it with no `aria-label`, so screen readers
  announce an unnamed slider.
- The text box is inside the `<label>` but the label's content also holds the
  tooltip text, so its accessible name is noisy.
- The slider announces a bare number ("250000"), not the value with its
  unit ("£250,000", "60 years").

Observed by reading the component; not yet confirmed with VoiceOver/TalkBack.

## Resolved decisions

- **Association:** give each control a stable id (from `field`, plus person
  where relevant) and name it explicitly: label text via `aria-labelledby`
  on the slider, `htmlFor`/`id` on the text box. The tooltip trigger moves
  out of the label's accessible name.
- **Value text:** the slider sets `aria-valuetext` built from `prefix`,
  the value and `suffix` (e.g. "£250,000", "6%"), formatted like the input
  (see 031).
- **Subtitle:** linked with `aria-describedby` on both controls.
- **Tooltips:** the hover-only `tooltip-trigger` pattern appears in three
  places. All three move to one shared, module-level, memoised `Tooltip`
  component: a focusable button, opens on tap/Enter/focus, closes on Esc or
  tapping elsewhere, linked to its text with `aria-describedby`.
- **Out of scope:** inline field warnings, clamp feedback and live regions
  (separate P1 items).
- **Performance:** no change to component structure; stays module-level,
  memoised, stable handlers (§5.3).

## Delivery

`index.html` (`SliderWithInput`); `docs/TOOL_DOCUMENTATION.md` §3 (a note on
accessibility) and §5.4 checklist item; `CHANGELOG.md`; `USER_CHANGELOG`
(user-facing: screen reader and keyboard users); `sw.js` cache and
`APP_VERSION` bump. Tests: the harness has no DOM, so verify manually with
VoiceOver and TalkBack and record the result on the PR.
