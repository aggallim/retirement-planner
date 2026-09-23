# Spec 022 — Auto-subscribe to activity on PRs an agent session opens

Implements `intent/022-auto-watch-own-prs.md`.

## Changes to `CLAUDE.md`

In lifecycle step 7 ("PR"), after the existing sentence about the PR
description referencing the intent file path, add:

```markdown
   **Subscribe to the PR's activity as soon as it's opened** (the
   `subscribe_pr_activity` tool, or equivalent), without waiting to be
   asked — the user wants every PR opened in this repo watched through to
   merge or close by default, following the PR-babysitting rules already
   in the system prompt (autofix CI failures, respond to review comments,
   ask when a fix is ambiguous).
```

## Changes to `CONTRIBUTING.md`

In lifecycle step 3 ("Open the PR"), after the existing sentence ending
"...do it the moment it's possible, not once the code is ready.", add:

```markdown
   Subscribe to the PR's activity immediately once it's open — don't wait
   to be asked. This repo's standing preference is that an agent session
   watches every PR it opens here through to merge or close, per the
   PR-babysitting rules in the system prompt.
```

## Out of scope

- No change to `index.html`, `sw.js`, `docs/TOOL_DOCUMENTATION.md`, or the
  test harness — `node tests/test-engine.js` is not expected to be
  affected and is not re-run for this docs-only change.
- No `USER_CHANGELOG` entry and no `sw.js` cache bump.
- No change to how PRs opened by a human contributor are handled.
