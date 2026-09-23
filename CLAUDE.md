# CLAUDE.md

Guidance for Claude Code (or any agent) working in this repository.

## What this project is

A UK retirement planning calculator — pensions, ISAs, State Pension, mortgage
runoff and inheritance projected year-by-year, benchmarked against the PLSA
Retirement Living Standards. Supports individual or joint (couple) planning.
Packaged as an installable, offline-capable PWA.

Not financial advice — illustrative planning only. Rest-of-UK income tax on
pension drawdown and State Pension is modelled, per person; see
`docs/TOOL_DOCUMENTATION.md` §4 and §7 for its scope and limits. See
`docs/TOOL_DOCUMENTATION.md` for the full spec: input
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
| `CONTRIBUTING.md` | Step-by-step walkthrough (with diagram) of the intent → branch → draft PR → spec → plan → implement → merge lifecycle below, including when to open the PR. |
| `CHANGELOG.md` | Short, chronological "what shipped when," one entry per requirement. |
| `tests/test-engine.js` | Dependency-free `node` test harness for `projectJoint()`. Run with `node tests/test-engine.js` from the repo root. |
| `tests/fixtures/` | Regression fixtures for the test harness (e.g. the individual-mode baseline). |
| `.github/workflows/pages.yml` | Deploys to GitHub Pages on every push to `main`. No build step. |
| `.github/workflows/test-engine.yml` | Runs `tests/test-engine.js` on push/PR. |
| `.claude/skills/` | Skills for the workflow below: `grill-me`/`grilling` (intent gathering) and `conventional-branch` (branch naming). Reproduced from their upstream sources — see each `SKILL.md`'s attribution footer. |

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
  a calculation change needs; and §7 (known limitations) if the change
  removes, narrows, or adds a deliberate simplification.
- **Add a `CHANGELOG.md` entry in the same PR too.** `CHANGELOG.md` is the
  complete change-history record — both "what shipped when" and, for a
  non-trivial calculation change, why. Every requirement gets one entry
  under a dated heading (the date the PR merges), naming the intent/spec
  file it implements — written directly in the PR, the same way intent/spec
  move to `done/` in the same PR rather than as a follow-up.
- **Add a `USER_CHANGELOG` entry in `index.html`, in the same PR — but
  only if the change is user-facing.** `USER_CHANGELOG` (near
  `PERSISTED_FIELDS` in the Persistence section) backs the "What's new"
  view in the ⚙ Data menu — plain language, no file/function names, no
  intent/spec references. The test: does this change something a user of
  the running app would experience (a new or changed feature, a
  calculation or behaviour change, a bug fix, a UI change)? If yes, add an
  entry, versioned with the `sw.js` cache value this PR bumps to. If the
  change is repo/process only (this file, `CONTRIBUTING.md`, CI workflows,
  the test harness, an internal refactor with no behaviour change, or a
  `docs/TOOL_DOCUMENTATION.md`-only edit) — no entry, and that's correct,
  not an omission. Unlike the `CHANGELOG.md` entry above, this one is
  conditional; get the yes/no call right rather than defaulting to either
  answer.

Requirements flow through a fixed lifecycle, tracked as files in the repo
rather than in an external issue tracker. **This applies to bug fixes just
as much as new features** — a reported bug still starts with an intent
file (what's broken, and why) before any code changes, even when the fix
itself turns out to be small or obvious. Don't jump straight to editing
`index.html` because the fix seems quick; write the intent first. See
`CONTRIBUTING.md` for the full step-by-step walkthrough (with a diagram) of
this same lifecycle, including exactly how and when to open the PR — read
it if you're picking up work here from a different device or session than
whoever started it.

1. **Intent** — first run the `grilling` skill (or point a human at the
   user-invoked `grill-me` skill; see `.claude/skills/`) to interrogate the
   requirement's design tree until every branch is resolved. Then write
   `intent/NNN-slug.md` from those resolved decisions — describing what's
   wanted and why — as the **first commit on the requirement's branch**
   (step 3; create it first). Never commit it to `main`: `main` only
   changes via PR (see "Branch protection"), so the intent reaches `main`
   through the requirement's own PR. For a bug, this is the problem report:
   what's broken, how it was observed (e.g. a screenshot or repro steps),
   and any root cause already known.
2. **Spec** — `spec/NNN-slug.md`, committed on the branch, turns that
   intent into a concrete spec.
3. **Branch** — create `<type>/NNN-slug` off `main` (e.g.
   `feature/003-inheritance-tax`, `bugfix/006-mobile-data-menu-overflow`),
   following the [Conventional Branch](https://conventionalbranch.org) spec
   (see `.claude/skills/conventional-branch/`): `<type>` is `feature`,
   `bugfix`, `hotfix`, `release`, or `chore` depending on the nature of the
   requirement — a bug fix is `bugfix/`, not the repo's earlier ad-hoc
   `bug/` prefix, so branch names stay within the published spec; most
   other requirements here are `feature/`. `NNN-slug` matches the intent's
   slug either way — only the branch gets the type prefix, the intent/spec
   *files* keep the plain `NNN-slug` naming. One branch per requirement.
   **Agent sessions too:** if the harness assigned a branch (e.g.
   `claude/pensive-newton-rymumn`), don't use it for requirement work —
   create `<type>/NNN-slug` off `main` yourself and push there. This line
   is your standing permission to push to a branch other than the
   assigned one; no need to ask each session. Only if that push is
   rejected (e.g. a proxy 403) fall back to the assigned branch, and tell
   the user why. See `CONTRIBUTING.md`'s "Agent sessions with a
   harness-assigned branch". Create the branch once grilling has settled
   the slug, before writing the intent. Push it with the intent commit,
   then open a **draft PR** into `main` straight away — the intent commit
   gives it a diff, so don't wait for the spec, plan or implementation.
   See `CONTRIBUTING.md` for why (cross-device/cross-session continuity)
   and the exact command.
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
   `docs/TOOL_DOCUMENTATION.md` itself, add a `CHANGELOG.md` entry, and
   add a `USER_CHANGELOG` entry if
   (and only if) the change is user-facing — all three per "Working in
   this repo" above — this happens alongside implementation, not after it.
7. **PR** — the draft PR opened in step 3 is marked ready for review once
   implementation, tests and docs are all pushed. Its description references
   the intent file path (e.g. "Implements `intent/003-inheritance-tax.md`").
   **Subscribe to the PR's activity as soon as it's opened** (the
   `subscribe_pr_activity` tool, or equivalent), without waiting to be
   asked — the user wants every PR opened in this repo watched through to
   merge or close by default, following the PR-babysitting rules already
   in the system prompt (autofix CI failures, respond to review comments,
   ask when a fix is ambiguous).
8. **Merge, then sync `main` and hand off branch cleanup.** Once the PR is
   merged: check out `main`, fetch, and fast-forward-merge (`git checkout
   main && git fetch origin main && git merge --ff-only origin/main`) so
   the local checkout matches what's actually live — don't leave it
   sitting on the now-merged requirement branch or behind `origin/main`.
   Then **delete the local copy** of the requirement branch (`git branch
   -d <type>/NNN-slug` — safe once it's confirmed merged). The **remote** branch
   is a different story: this environment's git proxy rejects `git push
   --delete` (403), and no GitHub MCP tool here can delete a branch
   either — don't keep retrying either approach. Instead, give the user a
   direct link to **https://github.com/aggallim/retirement-planner/branches**
   and let them delete it there (GitHub also shows a one-click "Delete
   branch" button on the merged PR's own page). It's harmless left in
   place either way — fully merged, no data at risk — this is a
   convenience hand-off, not a blocker on anything.

The PR that implements a requirement also moves that requirement's intent and
spec files into `intent/done/` and `spec/done/` **in the same PR** — this is
not a separate cleanup step. A merged PR should leave no requirement's
intent/spec files, nor `plan.md`, behind in the live `intent/`/`spec/`
directories or repo root.

## Branch protection

`main` only ever changes via a reviewed, green pull request — never a
direct push. This is a GitHub repository setting, not something a file in
this repo can enforce, and no tool available to an agent session here
(GitHub MCP server included) can change it — it has to be applied once, by
hand, by someone with admin access:

**Settings → Branches → Add branch protection rule** (or
**Settings → Rules → Rulesets** on repos using the newer Rulesets UI), for
`main`:

- Require a pull request before merging (this alone blocks direct pushes).
- Require status checks to pass before merging — the `test-engine` check
  from `.github/workflows/test-engine.yml`.
- Do not allow bypassing the above, including for administrators, where
  the plan supports it.

If this is ever missing (a fresh fork, a reset setting), apply it before
relying on the "no direct pushes to `main`" assumption the lifecycle below
is built on.

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
- Reference figures (income tax bands, State Pension, allowances, Retirement
  Living Standards bands) are UK-specific and dated (currently 2026/27 tax
  year, and the 2026 Retirement Living Standards from Pensions UK). They all
  live in one object, `UK_REFERENCE`, in `index.html`, each with its source
  URL. Check it and `docs/TOOL_DOCUMENTATION.md` §4.7 before assuming a
  figure is current.
- This file intentionally contains no personal financial figures, tokens,
  or credentials — none exist in this project. Keep it that way.
