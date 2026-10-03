# 059 — Cloudflare Web Analytics

## Status

Requested by the owner on 2026-10-03 ("How can I tell what traffic we're
getting to the site?"). Settled by grilling the same day.

## Why

The site has no analytics, so the owner can't see how many people visit.
GitHub's repo traffic page only counts repo views and clones, not visits to the
live site.

## What changes

Add Cloudflare Web Analytics: a cookieless beacon that records anonymous page
views. It never sees anything a user types.

## Decisions

- **Tool:** Cloudflare Web Analytics. No cookies, no personal data, free.
- **Pages:** `index.html` and `feedback.html` both load it.
- **Config:** a new `analytics-config.js` sets `window.ANALYTICS_TOKEN`, the
  same pattern as `feedback-config.js` and `account-config.js`. An empty
  token means no beacon anywhere. The token is a public site identifier, safe
  to commit.
- **Shipped empty.** The owner creates the site in the Cloudflare dashboard
  (Analytics & Logs → Web Analytics → Add a site, hostname
  `aggallim.github.io`, manual setup) and pastes the token in afterwards. No
  Cloudflare credentials are available to agent sessions.
- **Loader:** injects Cloudflare's `beacon.min.js` only when the token is set,
  the hostname is `aggallim.github.io` (so local testing and forks are not
  counted), and the browser has not sent Do Not Track or Global Privacy
  Control. No in-app opt-out toggle.
- **Offline:** `analytics-config.js` is precached in `sw.js` like the other
  config files. The Cloudflare script is not cached, so offline visits are not
  counted and nothing breaks.
- **Wording:** every "no analytics / no tracking" claim is reworded: figures
  never leave the device, and the only thing collected is anonymous, cookieless
  page-view counts. This covers the `index.html` static summary, FAQ JSON-LD
  and in-app privacy lines, `llms.txt`, `llms-full.txt` (and the MCP server
  copy if affected), `docs/TOOL_DOCUMENTATION.md` and the feedback page if it
  makes the claim.
- **Release:** cache and `APP_VERSION` bump, a `CHANGELOG.md` entry, and a
  `USER_CHANGELOG` entry because the privacy wording users see changes.

## Owner's steps

1. Create the site in Cloudflare (above) and copy the `token` from the
   manual-setup snippet.
2. Paste it into `analytics-config.js` and merge; counts appear in the
   Cloudflare dashboard within a few minutes of the next visit.
