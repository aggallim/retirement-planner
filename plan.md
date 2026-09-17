# Plan — 006 dev workflow improvements

Branch-only working file; deleted before this PR is marked ready.

1. Add skills (verbatim from upstream, with attribution footers):
   - `.claude/skills/grill-me/SKILL.md`
   - `.claude/skills/grilling/SKILL.md`
   - `.claude/skills/conventional-branch/SKILL.md`
2. Update `CLAUDE.md`:
   - Repo layout table: add `.claude/skills/` row.
   - Lifecycle step 1 (Intent): require running `grilling` first.
   - Lifecycle step 3 (Branch): rename to `<type>/NNN-slug` per Conventional
     Branch; note harness-assigned `claude/...` branches already comply.
   - New "Branch protection" section documenting the manual GitHub settings
     required for `main`.
3. Update `CONTRIBUTING.md`:
   - Step 1 (Intent): require `grilling`/`grill-me` before writing the file.
   - Step 2 (Branch): naming updated to `<type>/NNN-slug`.
   - Mermaid diagram: branch node label updated.
   - "Agent sessions bound to a pre-named branch": note `claude/` prefix
     already satisfies the spec.
4. Run `node tests/test-engine.js` — expect unaffected (no engine/index.html
   changes).
5. `docs/TOOL_DOCUMENTATION.md`: add §8 Build history entry. No §3/§4/§5.4/§7
   changes needed — no user-facing behaviour, no calculation change.
6. `CHANGELOG.md`: add dated entry for 006. No `USER_CHANGELOG` entry
   (process-only, per CLAUDE.md's own test).
7. Move `intent/006-*.md` and `spec/006-*.md` into `done/`, `git rm plan.md`.
8. Mark PR ready for review; tell the user the branch-protection settings
   need to be applied manually (link + exact steps) since no tool here can
   do it.
