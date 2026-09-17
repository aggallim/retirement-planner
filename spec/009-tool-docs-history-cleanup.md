# Spec 009 — Trim roadmap and build history from tool docs

Implements `intent/009-tool-docs-history-cleanup.md`.

## Changes to `docs/TOOL_DOCUMENTATION.md`

- Delete the `### Possible future additions` subsection at the end of §7
  (currently the five `- [ ]` bullets after the numbered "Known
  limitations" list, lines 324–330). The numbered limitations list (items
  1–11) is untouched.
- Delete `## 8. Build history` in its entirety, including all four
  `<details>` blocks (the pre-repo accuracy review, general design
  decisions, and the 002–007 per-requirement narratives) and the `---`
  separator that currently precedes it. The document now ends at §7.

## Changes to `CHANGELOG.md`

- Rewrite the header paragraph. Current text points at §8 for "the
  detailed narrative — why a calculation changed, what broke before it
  was fixed." Replace with a line describing `CHANGELOG.md` itself as the
  complete record — both what shipped and why — now that §8 no longer
  exists.
- Fold the two undated §8 blocks with no existing `CHANGELOG.md`
  equivalent into the existing **"2026-09-15 — Initial release"** entry,
  since both predate this repo's first commit:
  - "Accuracy fixes made during the calculation review" (9 items) — add
    as a sub-bullet list summarising the defects found and fixed before
    the repo's initial commit.
  - "Design decisions worth remembering" (5 items) — add as a further
    sub-bullet list under the same entry.
- Add a new dated entry for this requirement itself (009), following the
  existing per-requirement format: what changed, that it's process/docs
  only, no `USER_CHANGELOG` entry, "Implements
  `intent/done/009-tool-docs-history-cleanup.md`."

## Changes to `CLAUDE.md`

- In the "Update `docs/TOOL_DOCUMENTATION.md` in the same PR" bullet:
  remove the clause requiring "a new entry under §8 Build history" and
  the sentence "A PR that changes behaviour without a matching §8 entry
  is incomplete." Behaviour-change documentation now lives entirely in
  the `CHANGELOG.md` entry described in the next bullet.
- In the "Add a `CHANGELOG.md` entry" bullet: remove "separate from §8's
  narrative detail" — `CHANGELOG.md` is no longer "separate from" a
  narrative section, it *is* the narrative record now. Rephrase to say
  `CHANGELOG.md` entries should include the same why-level detail §8
  used to carry, for a non-trivial calculation change.
- In lifecycle step 6 ("Test"): remove "(including a new §8 Build history
  entry)" from the `docs/TOOL_DOCUMENTATION.md` update instruction.

## Changes to `CONTRIBUTING.md`

- In lifecycle step 7 ("Test & document"): remove "(including a new §8
  Build history entry)" from the same instruction, mirroring the
  `CLAUDE.md` change above.

## Changes to the Notion page

- On the "UK Retirement Planner — Tool Documentation" Notion page: delete
  the "Possible future additions" bulleted checklist under §7, and delete
  the "Build history" (§8) section and its nested toggle blocks, matching
  the repo-side removal. No other content on that page changes.

## Out of scope

- No change to any calculation logic, `index.html`, `sw.js`, or the test
  harness. `node tests/test-engine.js` is run to confirm it's unaffected,
  not because this touches the engine.
- No `USER_CHANGELOG` entry (not user-facing) and no `sw.js` cache bump.
- No renumbering of `docs/TOOL_DOCUMENTATION.md` sections 1–7.
