# 022 — Auto-subscribe to activity on PRs an agent session opens

## Status

Requested directly by the repo owner (2026-09-23), while reviewing PR #21.
Process/docs only — fully specified in the request, no grilling round
needed.

## Problem

The system prompt governing PR babysitting says an agent session should
*ask* the user, after opening a PR, whether to watch it for review comments
and CI failures (`subscribe_pr_activity`). That's a per-session default, not
something a repo's own docs can override — but the repo owner wants the
answer to always be yes for this repo, without being asked each time: every
PR an agent session opens here should be watched through to merge or close
by default.

Nothing in `CLAUDE.md` or `CONTRIBUTING.md` currently says this — the PR
lifecycle (`CLAUDE.md` step 7 / `CONTRIBUTING.md` step 3) describes opening
the PR but says nothing about subscribing to it afterward.

## Outcome

1. `CLAUDE.md` step 7 ("PR") and `CONTRIBUTING.md` step 3 ("Open the PR")
   each gain a line: subscribe to the PR's activity immediately once it's
   opened, without waiting to be asked, and keep watching it (autofixing CI
   failures, responding to review comments, asking the user when a fix is
   ambiguous — per the PR-babysitting rules already in the system prompt)
   through to merge or close.
2. Scope: this only concerns PRs an agent session itself opens in this
   repo, mirroring the "PRs you created in this session are yours" posture
   the system prompt already describes as the stricter of its two watching
   postures. It doesn't change anything about watching PRs a human opens.

## Non-goals

- No change to the system prompt itself (out of reach from repo docs) —
  this only removes the need to ask, for this repo specifically, by
  recording the repo owner's standing answer.
- No new tooling — `subscribe_pr_activity` (or equivalent) already exists
  and is already used elsewhere in this session's workflow.
- No change to how PRs a human contributor opens are handled.

## Constraints

- Docs/process only — no `index.html`, `sw.js`, `docs/TOOL_DOCUMENTATION.md`,
  or test changes. No cache bump, no `USER_CHANGELOG` entry.
- Branch: `chore/022-auto-watch-own-prs` off current `main`, per
  `intent/done/019-conventional-branch-names.md`.
