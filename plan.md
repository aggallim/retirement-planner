# Plan — 009 tool docs history cleanup

1. Edit `docs/TOOL_DOCUMENTATION.md`:
   - Remove `### Possible future additions` subsection (5 bullets) from §7.
   - Remove `## 8. Build history` section entirely (4 `<details>` blocks
     + preceding `---` separator). Doc ends at §7.
2. Edit `CHANGELOG.md`:
   - Rewrite header paragraph (drop the §8 pointer).
   - Append "Accuracy fixes" + "Design decisions" sub-bullets to the
     "Initial release" entry.
   - Add new dated entry for requirement 009.
3. Edit `CLAUDE.md`:
   - Drop the §8 clause from the "Update docs/TOOL_DOCUMENTATION.md" bullet.
   - Rephrase the "Add a CHANGELOG.md entry" bullet (no longer "separate
     from §8").
   - Drop "(including a new §8 Build history entry)" from step 6.
4. Edit `CONTRIBUTING.md`:
   - Drop "(including a new §8 Build history entry)" from step 7.
5. Mirror the same two removals into the Notion "UK Retirement Planner —
   Tool Documentation" page.
6. Run `node tests/test-engine.js` — confirm still green (no engine touch
   expected).
7. Move `intent/009-tool-docs-history-cleanup.md` and
   `spec/009-tool-docs-history-cleanup.md` into their `done/` dirs.
   `git rm plan.md`.
8. Push, mark PR #12 ready for review.
