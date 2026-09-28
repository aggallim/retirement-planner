# 029 — Larger life expectancy scale

## Status

Roadmap item 34 (Notion), free tier. Decisions settled by grilling with the
owner on 2026-09-28.

## What's wanted, and why

The Life Expectancy slider only runs 85–100 (default 95), so users cannot
plan to an older age than 100, nor model a shorter-than-average life. Widen
the scale in both directions and make the default the current UK average
rather than a hard-coded 95.

## Resolved decisions

- **Range:** 75–110 (was 85–100).
- **Dynamic floor:** the slider minimum is `max(75, retirement age + 1)`, the
  same pattern retirement age uses against current age, so a plan can't end
  before retirement. If editing age/retirement age pushes life expectancy
  below the floor, it is clamped up.
- **Default:** a single UK-average figure (whole age, ONS, both sexes,
  roughly 81 — exact value and source URL to be confirmed at build time),
  stored in `UK_REFERENCE` per repo convention, replacing the hard-coded 95.
  Applies to new and reset plans, and to both people in joint mode.
- **Saved plans:** stored values are left alone. A deliberate 95 can't be
  told apart from the old default, so no migration.
- **UI:** no note or warning above 100.
- **Engine:** unchanged — plan end already derives from `lifeExpectancy`.

## Delivery

Slider bounds/default in `index.html`; tests (a 110-year projection, the
dynamic floor, default from `UK_REFERENCE`); `docs/TOOL_DOCUMENTATION.md`
§3/§4.7; `CHANGELOG.md`; `USER_CHANGELOG` (user-facing); `sw.js` cache and
`APP_VERSION` bump.

## Addendum 2026-09-28 — engine horizon

The "Engine: unchanged" decision above was wrong. `projectJoint()` projected
to a fixed age 100, so a life expectancy above 100 would have been cut
short. It now projects to `max(100, life expectancy)` per person; output for
life expectancy of 100 or less is identical, so the regression baseline is
untouched. Found while writing the tests.
