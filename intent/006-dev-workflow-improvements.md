# 006 — Development workflow improvements

## Status

Proposed and implemented together (small, process-only change; no open
design questions to resolve at spec stage beyond what's noted below).

## Problem

The requirement lifecycle in `CLAUDE.md`/`CONTRIBUTING.md` already exists,
but four gaps remain in how this repo's development process is defined and
enforced:

1. **Branch naming is bespoke.** Requirement branches are named `NNN-slug`
   with no `type` prefix, so nothing distinguishes a feature branch from a
   fix, a chore, or a release branch, and the convention isn't backed by any
   published, machine-checkable spec.
2. **`main` isn't actually protected.** Nothing stops a direct push to
   `main`, even though the entire lifecycle assumes every change lands via
   a reviewed PR. The convention is currently just a documented norm, not
   an enforced rule.
3. **The "start with intent" step is a norm, not a forcing function.** The
   lifecycle says to write `intent/NNN-slug.md` first, but nothing makes an
   agent (or a human) actually interrogate the idea before writing it down
   — an intent file can be a thin restatement of a one-line request rather
   than a genuinely resolved set of decisions.
4. **No reusable tooling for any of the above lives in the repo.** Anyone
   picking up work here (a different device, a different agent session)
   has to already know the conventions; nothing in the repo teaches or
   enforces them.

## Outcome

1. Adopt the [Conventional Branch](https://conventionalbranch.org) 1.1.0
   naming spec (`<type>/<description>`) for branch names, layering it onto
   the existing `NNN-slug` numbering rather than replacing it —
   `<type>/NNN-slug` (e.g. `feature/006-dev-workflow-improvements`). The
   spec's AI-agent source prefixes (`claude/`, `ai/`, `copilot/`, `cursor/`,
   `codex/`) already cover harness-assigned branch names like
   `claude/laughing-cannon-lz90c5` — no rename needed for those.
2. Document the branch-protection settings `main` should carry (require PR
   before merge, require the `test-engine` check, no direct pushes, no
   bypass) so an org owner can apply them in GitHub's repo settings. This
   can't be automated from inside a coding-agent session — there's no
   GitHub API/MCP tool available here that edits repository or branch
   settings — so this intent documents the required configuration rather
   than a code change that applies it.
3. Make gathering intent an explicit, active step: pull in Matt Pocock's
   `grill-me`/`grilling` skill pair and require it be used to interrogate a
   requirement before `intent/NNN-slug.md` is written, so the intent file
   records resolved decisions rather than a restated request.
4. Add the skills backing points 1 and 3 into the repo itself
   (`.claude/skills/`), so they travel with the repo and are available to
   any agent session working here, rather than depending on a given
   contributor's personal Claude Code setup.

## Constraints

- No build tooling, no new runtime dependency — this is process/tooling
  only and touches no application code (`index.html`, `sw.js`).
- Repository/branch permission changes are a GitHub setting, not a file in
  this repo — this intent's job is to specify exactly what those settings
  should be, not to pretend a committed file enforces them.
- Added skills are reproduced from their published sources with attribution
  and under their original licenses (MIT for `grill-me`/`grilling`; CC BY
  4.0 for `conventional-branch`), not rewritten.
