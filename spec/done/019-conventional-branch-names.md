# 019 — Agent sessions use `<type>/NNN-slug` branch names

## Status

Resolved — ready for implementation. From
`intent/019-conventional-branch-names.md`.

## Changes

### `CLAUDE.md` — lifecycle step 3 (Branch)

Replace "A harness-assigned agent branch name (e.g.
`claude/laughing-cannon-lz90c5`) already satisfies the spec's AI-agent
prefix — don't rename it." with: agent sessions ignore a harness-assigned
branch (e.g. `claude/pensive-newton-rymumn`) and create `<type>/NNN-slug`
themselves; this line is the standing permission to push to it; if that
push is rejected, fall back to the harness branch and say why.

### `CONTRIBUTING.md` — "Agent sessions bound to a pre-named branch"

Rewrite the section (retitled "Agent sessions with a harness-assigned
branch") to state:

- The harness name passes the grammar but not this repo's convention or
  the skill's description guidelines, so don't use it for requirement work.
- Follow step 2 like anyone else: create `<type>/NNN-slug` off `main`,
  push, and open the draft PR from it. Leave the harness branch unused.
- The repo docs are the standing permission; no need to ask per session.
- Fallback on a rejected push, as above.
- An unused harness branch that exists on the remote is inert; the user
  deletes it from the branches page like any merged branch.

### `.claude/skills/conventional-branch/SKILL.md` — "Use in this repo"

Replace the "don't rename them" sentence with the same rule in brief,
pointing to `CONTRIBUTING.md` for the full version. Upstream sections are
not touched.

### `CHANGELOG.md`

One entry for 019. No `USER_CHANGELOG` entry and no `sw.js` bump — not
user-facing.

## Verification

- `grep` the repo docs (excluding `intent/done`, `spec/done`) for
  "don't rename" / "pre-named" / `laughing-cannon` — no stale guidance
  left.
- `node tests/test-engine.js` still passes (sanity; nothing it covers
  changes).
