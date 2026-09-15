# 001 — Engine test harness

## Status

Resolved — ready for implementation. Fleshed out from `intent/001-engine-test-harness.md` by resolving the three open design decisions that document deliberately left unsettled (extraction method, baseline source, CI wiring).

## Problem

The financial engine (`projectJoint()`, `index.html:1227-1331`) has no automated tests. Every check currently listed in `docs/TOOL_DOCUMENTATION.md` §5.4 ("Verification") was done by hand, once, at the end of a build pass — there's nothing in the repo that re-runs those checks when the code changes again.

That gap has already cost real accuracy. §8 of the same doc ("Build history") lists nine separate defects found in a single after-the-fact review, six of which are engine-layer and exactly the kind of thing a small unit test would have caught immediately instead of shipping silently:

1. The 25% lump sum was calculated for display but never actually applied to the projection — pension balances were 25% overstated.
2. The 4% withdrawal rule was implemented as 4%-of-declining-balance each year instead of a fixed initial amount uprated by inflation.
3. Target expenses were calculated inconsistently between the projection and the income chart (mortgage in vs. out).
4. The wealth chart started one year late — showing balances after a year of growth instead of today's actual figures.
5. Retirement balances stopped growing after withdrawals began, understating how long the money would last.
6. PLSA and State Pension reference figures went stale and needed refreshing.

(The remaining three fixes in §8 — an always-zero field feeding the income chart, a `BarChart`/`Line` combination that silently dropped the expenses line, and unevenly-scaled gauge thresholds — are rendering bugs in the React layer, not the engine. See Non-goals.)

Every one of the six engine-layer defects above is a regression that had already been "fixed" once, informally, and could silently come back the next time someone touches the calculation code — which, per `CLAUDE.md`, means editing generated JS directly inside an 844 KB `index.html`. There is currently nothing that would fail loudly if it did.

## Outcome

A `test-engine.js` script at the repo root, runnable with a bare `node test-engine.js` (no install step, no config, exit code 0/1), that exercises `projectJoint()` directly and asserts, at minimum, the full checklist already specified in `docs/TOOL_DOCUMENTATION.md` §5.4:

- Opening balances appear at the current age with no phantom year of growth.
- Monthly compounding matches an independently-computed manual calculation exactly.
- The 25% lump sum leaves precisely 75% of the pre-lump-sum balance in the pension, and the other 25% lands in the ISA.
- The 4% rule fixes the withdrawal amount in the retirement year and uprates it by inflation thereafter — it must **not** be recalculated as a percentage of the declining balance in later years.
- Mortgage debt clears in exactly the specified year, and mortgage payments drop out of target expenses from that year onward.
- The State Pension starts in the correct year for each person and is correctly inflation-uprated from today.
- Joint-mode combined totals reconcile exactly against the sum of the two individual pots.
- Depletion (combined pension + ISA < £1,000, from first retirement onward) is detected correctly in a deliberately under-funded scenario.
- Individual-mode results are byte-for-byte identical to a known-good baseline — the regression guard the original build called out as mattering most, since it's the easiest one to break silently while working on joint-mode logic.

Running `node test-engine.js` after any change to `projectJoint()` should be enough to catch a reintroduction of any of the six engine-layer defects listed above, both locally and in CI.

### Resolved design decisions

These three points were explicitly left open by `intent/001-engine-test-harness.md`. They are now settled as follows.

#### 1. How `test-engine.js` obtains a runnable `projectJoint()`

**Marker-delimited extraction.** Wrap the engine section of `index.html` in a pair of single-line comment markers, placed immediately around the code `test-engine.js` needs:

```js
// ENGINE-EXTRACT-START
const CURRENT_YEAR = 2026;
...
function projectJoint({ ... }) { ... }
// ENGINE-EXTRACT-END
```

`test-engine.js`:

1. Reads `index.html` as text.
2. Extracts everything between `// ENGINE-EXTRACT-START` and `// ENGINE-EXTRACT-END` via a simple string search (`indexOf`/`lastIndexOf` on the literal marker text, not a regex over the whole file) — not brace-matching, not an AST parse.
3. Evaluates the extracted text in a small Node sandbox (`vm.Script` in a fresh `vm.Context`, or a `new Function(...)` wrapper) that exposes only `Math` and returns `projectJoint` (and `CURRENT_YEAR`, if a test needs to assert against it) to the calling script.
4. Fails loudly and immediately — before running any checklist assertions — if either marker is missing, in the wrong order, or `projectJoint` is not a function after evaluation. This is the harness's own smoke test that the extraction still lines up with the file.

Rationale: `projectJoint()` is already self-contained apart from the module-level `CURRENT_YEAR` constant (`index.html:573`) — no other helper functions or constants are referenced inside it. Marker comments are the least amount of new machinery that makes extraction unambiguous, they cost two comment lines in `index.html`, and a missing/moved marker fails the harness immediately with a clear error rather than silently extracting the wrong span (the risk with unmarked brace-matching) or requiring a vendored parser (the AST option, ruled out — no `npm install` step is a hard constraint, and vendoring a parser file is disproportionate for extracting one function).

Implementation note: if `CURRENT_YEAR` moves or additional helpers `projectJoint()` depends on are introduced in the future, the markers move with them — they bound "whatever `projectJoint()` currently needs," not a fixed line range.

#### 2. Source of the individual-mode regression baseline

**Generated once now, checked in as a fixture.** Run `projectJoint()` in individual mode (`person2: undefined`) against a fixed, documented input scenario, using the *current* `index.html` — which per §5.4 has already been manually verified correct for this exact scenario. Save the full output array as `test-fixtures/individual-baseline.json` and commit it alongside `test-engine.js`.

On every run, `test-engine.js` re-runs `projectJoint()` with the same fixed input and does a deep-equal (not just length/shape) comparison against the committed fixture, failing with a diff of the first mismatching year/field if they differ.

The input scenario used to generate the fixture (ages, balances, rates, retirement age, etc.) is written directly into `test-engine.js` as a plain object literal, not derived at runtime — it must be identical every time the script runs, since the whole point is byte-for-byte stability.

Regenerating `test-fixtures/individual-baseline.json` is a deliberate act (a small `--update-baseline` flag or a one-line comment in `test-engine.js` explaining how) taken only when individual-mode behaviour intentionally changes, reviewed like any other change to expected output — never done automatically by the test run itself.

#### 3. CI integration

**Add a CI check.** A new, separate GitHub Actions workflow (e.g. `.github/workflows/test-engine.yml`) runs `node test-engine.js` on `push` and `pull_request`. It does not touch or gate `.github/workflows/pages.yml` — Pages deployment continues to trigger on push to `main` regardless of this check's outcome, so a red engine-test check makes a PR visibly unsafe to merge without blocking deploys that were already in flight. Example shape:

```yaml
name: Engine tests
on:
  push:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node test-engine.js
```

No `setup-node` action is needed beyond what `ubuntu-latest` ships, since there's no `package.json` and no dependencies to install.

### Non-goals

- **Not a UI or rendering test.** The three build-history defects that were React/Recharts wiring bugs (wrong field name, `BarChart`+`Line` combination, gauge scale) are out of scope. `docs/TOOL_DOCUMENTATION.md` §5.4 already notes the built PWA gets a manual headless-browser smoke check separately — this spec doesn't replace or automate that.
- **Not a coverage target.** The goal is "the nine known failure modes can't come back unnoticed," not exhaustive coverage of the engine.
- **Not a gate on Pages deployment.** The CI check runs and reports, but `pages.yml` is left untouched — see decision 3 above.

## Constraints

- **No build tooling.** There is no `package.json`, no bundler, no test runner dependency, and per `CLAUDE.md` that's a deliberate choice, not a gap to fill. `test-engine.js` must run under plain Node with whatever ships in it (`node:assert`, `node:vm`) — no `npm install` step, in CI or locally.
- **The deployed app must stay a single `index.html`.** GitHub Pages hosts that one file as-is with no build step (`.github/workflows/pages.yml` just copies the repo root). The two marker comments added to `index.html` are inert JS comments — they change nothing about how the file executes in a browser, and no compile/bundle step is introduced before deploy.
- **`index.html` is already a precompiled artifact.** Per `CLAUDE.md`, there is no separate `.jsx` source in this repo — `index.html` contains `React.createElement(...)` calls, not JSX, and there's no in-browser Babel to lean on. Marker-delimited extraction (decision 1) is how `test-engine.js` gets a runnable `projectJoint()` out of that file without depending on a browser DOM, since Recharts/React/the DOM are not available under plain `node`.
- **Keep it debuggable by hand.** A test that fails must point clearly at which checklist item broke — `test-engine.js` runs each checklist item as an independently-labelled assertion (e.g. wrapping each in a `try/catch` that logs a `✓`/`✗` line with the checklist item's name) and lets the script run to completion, exiting non-zero if any item failed, rather than stopping at the first thrown assertion.
- **Maintenance cost of the markers.** Anyone editing `projectJoint()` or `CURRENT_YEAR` must keep them inside the `// ENGINE-EXTRACT-START` / `// ENGINE-EXTRACT-END` markers. This is a real but small ongoing cost, accepted in decision 1 as cheaper than the alternatives; `test-engine.js`'s own extraction-sanity check (constraint above, point 4 under decision 1) is what catches it if someone forgets.

## Open questions

None remaining. All three points the intent doc deferred to "a design decision for the follow-up implementation" are resolved above.
