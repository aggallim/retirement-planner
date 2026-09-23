# Plan — 023 mobile horizontal overscroll

1. `index.html`: add `overflow-x: hidden` to the existing `html, body`
   rule area and `overscroll-behavior-x: none` to `body`, next to the
   existing `overscroll-behavior-y: contain` line (~line 28).
2. `sw.js`: bump `CACHE` from `v13` to `v14`.
3. `index.html`: add a new `USER_CHANGELOG` entry (`version: 'v14'`)
   describing the fix in plain language.
4. Run `node tests/test-engine.js` — expect no change (untouched engine).
5. Manual verification with headless Chromium at 375px and 1280px per
   spec's Verification section (scrollWidth == innerWidth, tooltips/Data
   menu popover/sticky bar still work, desktop unchanged).
6. `CHANGELOG.md`: new dated entry naming intent/spec 023.
7. Move `intent/023-mobile-horizontal-overscroll.md` and
   `spec/023-mobile-horizontal-overscroll.md` into their `done/`
   directories.
8. `git rm plan.md`.
9. Push, mark PR ready for review, update PR status line.
