# 019 — Agent sessions use `<type>/NNN-slug` branch names

## Status

Decisions resolved in conversation with the repo owner (2026-09-22);
process/docs only.

## Problem

Claude Code remote sessions start with a harness-assigned branch such as
`claude/pensive-newton-rymumn`. The repo's docs (`CLAUDE.md` step 3,
`CONTRIBUTING.md` "Agent sessions bound to a pre-named branch", and the
"Use in this repo" section of `.claude/skills/conventional-branch/SKILL.md`)
told agents to keep that name — "don't rename it" — because it technically
passes the Conventional Branch grammar via the `claude/` AI-agent prefix.

In practice that exception defeats the point of the convention:

- The random suffix fails the skill's own description guidelines
  (descriptive, 2–5 words) and says nothing about the work.
- It breaks this repo's `<type>/NNN-slug` scheme, so a branch can't be
  traced back to its `intent/`/`spec/` files by name, and its type
  (`feature`/`bugfix`/`chore`…) isn't visible.
- The repo owner noticed branches never following the skill and asked why.

The original reason for the exception was an assumption that an agent
session could only push to its assigned branch. That was tested on
2026-09-22: pushing a new `chore/019-conventional-branch-names` branch off
`main` from a remote session succeeded.

## Outcome

1. At the lifecycle's branch step, agent sessions create
   `<type>/NNN-slug` off `main` per the `conventional-branch` skill and do
   all the requirement's work there — pushes, draft PR, implementation —
   the same as a human contributor. The harness-assigned branch is left
   unused.
2. This is standing permission recorded in the repo docs, so an agent
   doesn't need to ask each session before pushing to a branch other than
   the one the harness assigned.
3. Fallback: if the push of the `<type>/NNN-slug` branch is rejected (e.g.
   a proxy 403), work on the harness-assigned branch instead and tell the
   user why, rather than retrying.
4. `CLAUDE.md`, `CONTRIBUTING.md` and the skill's "Use in this repo"
   section all say the same thing; the upstream skill text is unchanged.

## Constraints

- Docs/process only — no change to `index.html`, `sw.js` or the tests, so
  no cache bump and no `USER_CHANGELOG` entry.
- Remote branch deletion is still unavailable from agent sessions (proxy
  403), so each session's unused harness branch — if the harness pushed
  it — is left for the user to delete, the same as merged branches.
