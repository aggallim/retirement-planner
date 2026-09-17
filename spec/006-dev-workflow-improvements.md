# 006 — Development workflow improvements

## Status

Resolved — ready for implementation. Fleshed out from
`intent/006-dev-workflow-improvements.md`; all four outcome points are
process/documentation/tooling changes with no ambiguous design decisions
left to make.

## Problem

See `intent/006-dev-workflow-improvements.md` §Problem — unchanged here.

## Outcome

### 1. Branch naming — Conventional Branch 1.1.0

- Requirement branches are named `<type>/NNN-slug`, where `<type>` is one
  of the spec's purpose prefixes — `feature`, `bugfix`, `hotfix`,
  `release`, `chore` — chosen for the nature of the requirement (most work
  in this repo is `feature/`; a pure bug fix is `bugfix/`; a dependency or
  tooling-only change is `chore/`).
- `NNN-slug` keeps its existing meaning (matches the intent/spec file
  slug), so traceability from branch → intent/spec is unchanged; it's
  simply now the `description` half of a Conventional Branch name instead
  of the whole name.
- Harness-assigned agent branch names (e.g. this session's
  `claude/laughing-cannon-lz90c5`) already satisfy the spec's AI-agent
  prefix (`claude/`) and need no renaming — `CONTRIBUTING.md`'s existing
  "Agent sessions bound to a pre-named branch" section is updated to say so
  explicitly.
- `.claude/skills/conventional-branch/SKILL.md` (reproduced verbatim from
  the upstream project, CC BY 4.0) is added so any session creating a
  branch by hand follows the same rules without re-deriving them.

### 2. Branch protection on `main`

No tool available in this environment can change GitHub repository or
branch settings (the GitHub MCP server here has no branch-protection/
ruleset endpoint, and there is no `gh` CLI access). This is therefore a
**documented manual step**, not a code change:

`CLAUDE.md` gets a new "Branch protection" section stating the required
end state and the exact settings to apply once, at
**Settings → Branches → Add branch protection rule** (or
**Settings → Rules → Rulesets** on repos that use the newer Rulesets UI)
for `main`:

- Require a pull request before merging (no direct pushes).
- Require status checks to pass before merging — the `test-engine` check
  from `.github/workflows/test-engine.yml`.
- Do not allow bypassing the above, including for administrators, where
  the plan supports it.
- Nobody has push access directly to `main`; all changes land via PR.

The PR that implements this spec calls this out explicitly to the user
(aggallim, the repo owner) since only they can apply it.

### 3. Intent gathering via `grill-me`/`grilling`

- `CLAUDE.md` step 1 ("Intent") and `CONTRIBUTING.md` step 1 both gain a
  requirement: before writing `intent/NNN-slug.md`, run the `grilling`
  skill (model-invoked) — or point a human contributor at the
  user-invoked `grill-me` skill — to interrogate the requirement's design
  tree until every branch is resolved. The intent file is then written
  from the resolved decisions, not drafted first and revised after.
- This is additive to the existing lifecycle, not a new step number — it
  happens *before* step 1's file is written, as part of doing step 1
  properly.

### 4. Skills added to the repo

Three `SKILL.md` files are added under `.claude/skills/`, each reproduced
from its published upstream source with an attribution footer (source URL,
license, author) rather than paraphrased:

- `.claude/skills/grill-me/` — user-invoked entry point (delegates to
  `grilling`). Source: `mattpocock/skills`
  (`skills/productivity/grill-me/SKILL.md`), MIT License, © Matt Pocock.
- `.claude/skills/grilling/` — the model-invoked interview skill itself.
  Source: `mattpocock/skills` (`skills/productivity/grilling/SKILL.md`),
  MIT License, © Matt Pocock.
- `.claude/skills/conventional-branch/` — branch-naming/creation skill.
  Source: `conventional-branch/conventional-branch`
  (`skills/conventional-branch/SKILL.md`), CC BY 4.0, already
  self-attributing via its own frontmatter `metadata.source`.

No modification to the upstream skill instructions themselves beyond the
added attribution footer (added outside the YAML frontmatter, so it
doesn't change how the skill is parsed or triggered).

## Testing

- Process/documentation-only change — no calculation logic touched, so
  `docs/TOOL_DOCUMENTATION.md` §5.4's verification checklist doesn't apply.
- `node tests/test-engine.js` still run to confirm the change is inert with
  respect to the engine (expected: unaffected, since no `index.html`
  content changes).
- No `USER_CHANGELOG` entry — this changes nothing a user of the running
  app experiences (`CLAUDE.md`'s own test for when to add one says so
  explicitly for repo/process-only changes).
- `CHANGELOG.md` gets an entry, and `docs/TOOL_DOCUMENTATION.md` §8 Build
  history gets a narrative entry, per the standing rule that a PR changing
  behaviour needs both — this PR changes contributor-facing behaviour even
  though it changes no user-facing behaviour.
