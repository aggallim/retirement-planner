# 024 — Simplify the requirement lifecycle: no post-intent approval gate, spec removed

## Status

Requested by the repo owner (2026-09-23), grilled in full before this file
was written. Docs/process only.

## Problem

The current lifecycle (`CLAUDE.md`, `CONTRIBUTING.md`) runs: grill → intent
→ branch → draft PR → spec → plan → implement → test & document → ready →
cleanup → merge. In practice, writing the intent file has become a
checkpoint where the agent pauses for a further nod before continuing, and
`spec/NNN-slug.md` is a mandatory step whose job — turning intent's
open questions into something concrete — largely duplicates what grilling
already resolved before the intent was written. For most requirements in
this repo (see `intent/done/`), that's two rounds of write-something/wait
where one would do, slowing delivery without a matching safety benefit —
correctness for calculation changes already comes from the §5.4
verification checklist and `tests/test-engine.js`, not from the spec
document.

## Outcome

1. **No separate approval pause after intent is written.** Grilling already
   ends with the user confirming a shared understanding before the intent
   file gets written — that confirmation is the go-ahead. Once
   `intent/NNN-slug.md` is committed, the agent proceeds straight through
   branch → draft PR → (plan, if useful) → implement → test & document →
   mark ready → cleanup, without stopping again to check the plan looks
   right. It still stops for genuine blockers or ambiguous decisions that
   come up along the way (see point 3).
2. **Spec is removed from the lifecycle, permanently.** No
   `spec/NNN-slug.md` for any future requirement, including
   calculation-engine changes — this is not an option to fall back on for
   an unusually complex one. `spec/` (and everything in `spec/done/`) stays
   as historical record; nothing new is added to it. `CLAUDE.md` and
   `CONTRIBUTING.md` drop every step, cross-reference, and diagram node
   describing spec as part of the live lifecycle.
3. **Plan (`plan.md`) becomes optional too** — a judgment call, same
   treatment as spec's old "is it worth writing" question, with no
   explicit criteria list. It's still deleted (`git rm plan.md`) in the
   same PR as before, if one was written.
4. **Direct questions replace spec's "resolve open questions" role.** When
   the agent needs a decision mid-implementation, it asks the user
   directly instead of routing it through a spec document. If the answer
   materially changes scope or behaviour, it gets appended to
   `intent/NNN-slug.md` as a dated addendum (a new commit on the branch,
   never rewriting the original). Trivial clarifications (wording, a
   variable name) aren't logged anywhere beyond the conversation and
   commit messages.
5. Cleanup (the old step 9) only moves `intent/NNN-slug.md` into
   `intent/done/` now — there's no `spec/NNN-slug.md` to move alongside it.

### Files to update

- `CLAUDE.md`: the numbered lifecycle under "Requirements flow through a
  fixed lifecycle" — renumber, drop the spec step, mark plan as
  judgment-call, describe the addendum convention, update the cleanup step.
- `CONTRIBUTING.md`: the step-by-step walkthrough, the mermaid diagram, and
  the "Opening the PR" section's example PR body (currently references
  "spec not yet written").
- `CHANGELOG.md`: an entry recording this lifecycle change.
- No `USER_CHANGELOG` entry — this is a repo/process-only change, not
  user-facing (per `CLAUDE.md`'s own test for that entry).

## This requirement's own delivery

024 follows its own new rules: no spec, and no `plan.md` either — this is
a self-contained docs edit with no code, so a written plan doesn't add
anything.

## Constraints

- Docs/process only — no `index.html`, `sw.js`, or test changes; no cache
  bump.
- Historical references to already-written specs (in `spec/done/`, and the
  comments in `index.html` / `tests/test-engine.js` that cite them, e.g.
  `spec/018 §9.1`) are untouched — they document real past decisions and
  stay accurate as history.
