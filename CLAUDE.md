# CLAUDE.md

Guidance for Claude Code (or any agent) working in this repository.

## What this project is

A UK retirement planning calculator — pensions, ISAs, State Pension, mortgage
runoff and inheritance projected year-by-year, benchmarked against the PLSA
Retirement Living Standards. Supports individual or joint (couple) planning.
Packaged as an installable, offline-capable PWA.

Not financial advice — illustrative planning only. Retirement income tax is
not modelled. See `docs/TOOL_DOCUMENTATION.md` for the full spec: input
definitions, the financial model/formulas, architecture, verification
checklist and known limitations. Read that file before changing any
calculation logic.

**Live app:** https://aggallim.github.io/retirement-planner/
**Repo:** https://github.com/aggallim/retirement-planner

## Repo layout

| Path | Purpose |
|---|---|
| `index.html` | The entire app. React 18, Recharts and Tailwind's compiled CSS are all inlined here. |
| `manifest.webmanifest` | PWA name/icon/theme colour, used for "Add to Home Screen". |
| `sw.js` | Service worker — offline caching. |
| `icon.svg` | Home screen icon. |
| `docs/TOOL_DOCUMENTATION.md` | Full requirements, user guide, financial model and technical documentation. |
| `CONTRIBUTING.md` | Step-by-step walkthrough (with diagram) of the intent → spec → branch → plan → implement → PR → merge lifecycle below, including when to open the PR. |
| `CHANGELOG.md` | Short, chronological "what shipped when," one entry per requirement. |
| `tests/test-engine.js` | Dependency-free `node` test harness for `projectJoint()`. Run with `node tests/test-engine.js` from the repo root. |
| `tests/fixtures/` | Regression fixtures for the test harness (e.g. the individual-mode baseline). |
| `.github/workflows/pages.yml` | Deploys to GitHub Pages on every push to `main`. No build step. |
| `.github/workflows/test-engine.yml` | Runs `tests/test-engine.js` on push/PR. |

There is no `package.json`, no build tooling, and no separate `.jsx` source
in this repo — `index.html` is a **precompiled** artifact (JSX has already
been turned into `React.createElement(...)` calls; there is no in-browser
Babel). Editing the app means editing that generated JS directly inside
`index.html`. If you're making a substantial change, it's reasonable to
reconstruct readable JSX, edit it, and recompile/reinline the result back
into `index.html` — but there is currently no pipeline in this repo that
does that automatically.

## Working in this repo

- **No build step.** Open `index.html` directly, or serve the folder
  (`python3 -m http.server 8000`) for testing "Add to Home Screen"-adjacent
  behaviour (that specific feature needs real HTTPS, i.e. the deployed site).
- **Data never leaves the device.** All figures are stored in the browser's
  `localStorage`. There is no backend, no API, and nothing to configure for
  secrets — this app has none.
- **Bump the cache version after any deploy-worthy change.** The service
  worker (`sw.js`) caches aggressively. If `index.html` changes,
  increment `CACHE = 'retirement-planner-v1'` to `v2`, `v3`, etc., or
  returning users won't see the update.
- **Performance is fragile — read §5.3 of `docs/TOOL_DOCUMENTATION.md`
  before touching component structure.** The sliders were previously
  unusable because subcomponents were declared inside the parent component.
  Keep `SliderWithInput`, `PersonInputs`, `CustomTooltip`, `WealthChart` and
  `IncomeChart` at module level, memoised, with stable (`useCallback`)
  handlers. Re-introducing an inline component definition will reintroduce
  the original bug.
- **Calculation changes are high-stakes.** The engine (`projectJoint()`) is
  a pure function covered by the verification checklist in §5.4 of the tool
  docs. Any change to accumulation, decumulation, lump-sum handling, or the
  joint-planning model should be checked against that list before shipping.
- **Update `docs/TOOL_DOCUMENTATION.md` in the same PR as any change it
  describes** — it is the spec of record, not a follow-up chore. This means:
  the relevant section(s) in §3 (user guide) and §4 (financial technicals,
  including §4.7 reference figures) for any input, calculation, or
  reference-figure change; §5.4 (verification) with any new checklist items
  a calculation change needs; §7 (known limitations) if the change removes,
  narrows, or adds a deliberate simplification; and a new entry under
  **§8 Build history** — the detailed, narrative record — summarising what
  changed and, for a non-trivial calculation change, why. A PR that changes
  behaviour without a matching §8 entry is incomplete.
- **Add a `CHANGELOG.md` entry in the same PR too.** `CHANGELOG.md` is the
  short, chronological "what shipped when," separate from §8's narrative
  detail. Every requirement gets one entry under a dated heading (the date
  the PR merges), naming the intent/spec file it implements — written
  directly in the PR, the same way intent/spec move to `done/` in the same
  PR rather than as a follow-up.

## AI SDLC / Workflow

Requirements flow through a fixed lifecycle, tracked as files in the repo
rather than in an external issue tracker. See `CONTRIBUTING.md` for the full
step-by-step walkthrough (with a diagram) of this same lifecycle, including
exactly how and when to open the PR — read it if you're picking up work here
from a different device or session than whoever started it.

1. **Intent** — `intent/NNN-slug.md` describes what's wanted and why, on `main`.
2. **Spec** — `spec/NNN-slug.md` turns that intent into a concrete spec.
3. **Branch** — create `NNN-slug` off `main` (e.g. `003-inheritance-tax`), one
   branch per requirement, named after its intent slug. Push the branch and
   open a **draft PR** into `main` immediately once the intent is committed
   — don't wait for the spec, plan or implementation. See `CONTRIBUTING.md`
   for why (cross-device/cross-session continuity) and the exact command.
4. **Plan** — `plan.md`, written in the branch, breaks the spec into an
   implementation plan. It's a working file for the branch only — it never
   lands on `main`. Delete it (`git rm plan.md`) as part of the same PR that
   implements the requirement; it already did its job by the time the PR
   opens, and the branch's commit history keeps it if anyone needs to see it
   later.
5. **Implement** — make the change (see "Working in this repo" above for
   `index.html`/`sw.js` conventions).
6. **Test** — run `node tests/test-engine.js` and validate against
   `docs/TOOL_DOCUMENTATION.md` §5.4 for any calculation change; otherwise
   exercise the change manually per "No build step" above. Update
   `docs/TOOL_DOCUMENTATION.md` itself (including a new §8 Build history
   entry) and add a `CHANGELOG.md` entry, both per "Working in this repo"
   above — this happens alongside implementation, not after it.
7. **PR** — the draft PR opened in step 3 is marked ready for review once
   implementation, tests and docs are all pushed. Its description references
   the intent file path (e.g. "Implements `intent/003-inheritance-tax.md`").
8. **Merge** — once merged, delete the branch.

The PR that implements a requirement also moves that requirement's intent and
spec files into `intent/done/` and `spec/done/` **in the same PR** — this is
not a separate cleanup step. A merged PR should leave no requirement's
intent/spec files, nor `plan.md`, behind in the live `intent/`/`spec/`
directories or repo root.

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which publishes
the repo root as-is to GitHub Pages via `actions/configure-pages` +
`actions/upload-pages-artifact` + `actions/deploy-pages`. No build step.

One-time setup already done for this repo: **Settings → Pages → Source:
GitHub Actions**. The workflow's default `GITHUB_TOKEN` cannot create a
Pages site from scratch (`Resource not accessible by integration`), so if
Pages is ever reset or this is replicated in a new repo, that setting needs
to be flipped manually once before the workflow will succeed.

## Conventions

- Keep the whole app as a single-file PWA unless there's a strong reason to
  add a build pipeline — that's a deliberate design choice (see §5.5 of the
  tool docs), not an oversight.
- Reference figures (State Pension, allowances, PLSA bands) are UK-specific
  and dated (currently 2026/27 tax year, PLSA 2025/26). Check
  `docs/TOOL_DOCUMENTATION.md` §4.7 before assuming a figure is current.
- This file intentionally contains no personal financial figures, tokens,
  or credentials — none exist in this project. Keep it that way.
