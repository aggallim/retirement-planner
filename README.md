# UK Retirement Planner

An interactive, year-by-year UK retirement planning calculator — pensions, ISAs, the State Pension, mortgage runoff and inheritance, benchmarked against the [Retirement Living Standards](https://www.retirementlivingstandards.org.uk/details) (Pensions UK, formerly the PLSA). Supports individual or joint (couple) planning.

**Live app:** https://aggallim.github.io/retirement-planner/

It answers three questions:

1. **How big will the pot be** at retirement, per person and combined?
2. **What sustainable income** does that produce, and what living standard does it buy?
3. **Will the money last** to the end of the plan horizon?

For the full write-up — requirements, the financial model, calculation formulas, architecture and known limitations — see [`docs/TOOL_DOCUMENTATION.md`](docs/TOOL_DOCUMENTATION.md).

> For planning and illustration only — **not financial advice**. Retirement income tax is not modelled.

## What's in the repo

| File | Purpose |
|---|---|
| `index.html` | The whole app — React, Recharts, styles and code all inlined. No internet needed after first load. |
| `manifest.webmanifest` | Tells the phone the name, icon and colours. |
| `sw.js` | Service worker — caches the app for offline use. |
| `icon.svg` | Home screen icon. |
| `docs/TOOL_DOCUMENTATION.md` | Full requirements, user guide, financial model and technical documentation. |

It's a single-file Progressive Web App (PWA) — no build step, no dependencies to install. Everything (React, Recharts, Tailwind output) is pre-inlined into `index.html`.

## Running it locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Note that "Add to Home Screen" and offline mode require HTTPS, so those only work once deployed (e.g. to GitHub Pages).

## Deployment

This repo auto-deploys to **GitHub Pages** via [`.github/workflows/pages.yml`](.github/workflows/pages.yml) on every push to `main`. No build step — the static files are published as-is.

## Installing on your phone

- **iPhone / iPad (Safari — must be Safari, not Chrome)**
  1. Open the [live app](https://aggallim.github.io/retirement-planner/) in Safari.
  2. Tap the **Share** button, scroll down, tap **Add to Home Screen**.
- **Android (Chrome)**
  1. Open the live app in Chrome.
  2. Tap **⋮** → **Install app** (or **Add to Home screen**).

## Data & privacy

Your figures save automatically to that browser's `localStorage` on that device only — nothing is transmitted to or stored on any server. Your phone and your Mac keep **separate** plans. Clearing browser site data erases the saved plan. The **↺ Reset** button in the app clears the saved plan and restores defaults.

## Updating the app

The service worker caches aggressively. If a deployed change doesn't show up, close the installed app fully, or bump `CACHE = 'retirement-planner-v1'` in `sw.js` to `v2` before pushing.

## License

All rights reserved — see [`LICENSE`](LICENSE). The source is public on GitHub for reference, but isn't licensed for reuse, modification, or redistribution.
