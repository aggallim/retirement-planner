# 020 — Intent files are committed on the requirement branch, not `main`

## Status

Resolved — ready for implementation. From `intent/020-intent-on-branch.md`.

## Changes

### `CLAUDE.md` — lifecycle

- Step 1 (Intent): replace "on `main`" with: create the requirement's
  branch (step 3) and commit the intent as its first commit, never to
  `main` (branch protection), so it reaches `main` through the
  requirement's PR.
- Step 2 (Spec): note it's committed on the branch.
- Step 3 (Branch): create it once grilling has settled the slug, before
  writing the intent; push it with the intent commit and open the draft PR
  straight away. Drop the "Not immediately after just the intent"
  parenthetical.
- Step numbering is kept, so references to "`CLAUDE.md` step 3" stay valid.

### `CONTRIBUTING.md`

- "Why this matters": open the PR right after the intent commit; the
  intent commit is what gives the branch a diff.
- Swap steps 3 and 4 so the order matches what happens: 1 Intent,
  2 Branch, 3 Open the draft PR, 4 Spec. Step 1 says to create the branch
  (step 2) before committing the intent; step 2 says to push it with the
  intent commit.
- Update the cross-references ("See step 4 below", "(end of step 2)",
  "makes step 4 possible") to match.
- Diagram: relabel Intent ("first commit on the branch"), Branch, PR and
  Spec nodes; flow Main → Intent → Branch → PR → Spec → Plan; add a dotted
  "push, PR updates" edge from Spec.
- "Opening the PR": "once the branch is pushed with the intent commit on
  it"; example status "intent pushed, spec not yet written".
- The "Agent sessions…" section is left alone — PR #18 rewrites it.

### `CHANGELOG.md`

One entry for 020. No `USER_CHANGELOG`, no `sw.js` bump.

## Verification

- `grep` `CLAUDE.md`/`CONTRIBUTING.md` for "straight to `main`",
  "on `main`" (in the intent step) and "spec's first commit" — none left
  in the lifecycle text.
- Mermaid diagram still parses (balanced quotes/brackets, node ids used).
- `node tests/test-engine.js` passes (sanity).
