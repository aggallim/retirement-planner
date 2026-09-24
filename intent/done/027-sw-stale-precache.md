# 027 — Service worker can precache a stale file from the browser's HTTP cache

## Status

Bug report, raised by the owner on 2026-09-24 right after intent 026 went
live. Fix agreed in the same session.

## Problem

After v17 shipped (which set `window.FEEDBACK_ENDPOINT` in
`feedback-config.js`), the owner's desktop browser showed "What's new
(v17)" in the ⚙ Data panel but no "Send feedback" link. Their phone showed
the link and a test submission went through. So `index.html` was v17 while
`feedback-config.js` was still the v16 copy with an empty endpoint.

## Root cause

`sw.js` precaches `ASSETS` on install with `cache.addAll(ASSETS)`. Those
requests use the default fetch cache mode, so the browser may answer them
from its own HTTP cache. GitHub Pages serves files with
`Cache-Control: max-age=600`. The desktop browser had fetched
`feedback-config.js` under v16 within the previous 10 minutes, so the v17
install stored that stale copy. The fetch handler is
stale-while-revalidate, so the page keeps getting the stale copy at least
until a background refetch after the HTTP-cache expiry lands, and then one
more load. A version bump is meant to switch every file over at once; this
breaks that for any file changed within 10 minutes of a user's last visit.

## Outcome

- The install step fetches every precached asset with `cache: 'reload'`,
  bypassing the HTTP cache, so a new cache version always holds what the
  server has at install time.
- The fetch handler (stale-while-revalidate) is unchanged.
- Bump the cache and `APP_VERSION` to v18, so returning users pick up the
  fixed service worker. The v18 install will itself fetch fresh, repairing
  browsers that are stuck with the empty endpoint.
- User-facing: a short "What's new" line saying the Send feedback link now
  appears for everyone after the update.

## Verification

- `node tests/test-engine.js` passes (version check included).
- Served locally in headless Chromium with the service worker enabled:
  the install completes, the page loads offline from the cache, and
  precache requests are sent with `cache: 'reload'`.
