# 020 — Intent files are committed on the requirement branch, not `main`

## Status

Requested by the repo owner (2026-09-22) after it was flagged during 019.
Docs/process only.

## Problem

Lifecycle step 1 in `CLAUDE.md` and `CONTRIBUTING.md` says to write
`intent/NNN-slug.md` "on `main`" and "commit and push straight to `main`"
(the `CONTRIBUTING.md` diagram too: "committed straight to main"). That
contradicts `CLAUDE.md`'s "Branch protection" section: `main` only changes
via a reviewed, green PR, never a direct push.

Practice already diverged from the docs. Since branch protection (007),
every intent has been committed on its requirement branch and reached
`main` through that requirement's PR — e.g. 018 (`98f83d2`) and 019.
Anyone following the written steps would hit a rejected push.

A knock-on: the docs say the draft PR can't open until the spec's first
commit, because a freshly branched branch has no diff against `main`.
That reason only held while the intent lived on `main`. With the intent
as the branch's first commit, the branch has a diff straight away.

## Outcome

1. Step 1: after grilling, create the requirement branch and commit the
   intent to it as its first commit. Say explicitly not to commit it to
   `main`, and why (branch protection).
2. Open the draft PR right after the intent commit is pushed, instead of
   waiting for the spec. This follows the docs' own rule — "open the PR as
   early as possible" — whose only stated reason for waiting no longer
   applies.
3. Update the `CONTRIBUTING.md` step order, cross-references, diagram and
   "Opening the PR" section to match.

## Constraints

- Docs/process only — no `index.html`, `sw.js` or test changes; no cache
  bump and no `USER_CHANGELOG` entry.
- PR #18 (019) edits nearby lines in the same files. Whichever merges
  second resolves the conflict by merging `main` in; neither blocks the
  other.
