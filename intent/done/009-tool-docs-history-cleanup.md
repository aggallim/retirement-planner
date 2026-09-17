# Intent 009 — Trim roadmap and build history out of TOOL_DOCUMENTATION.md

## What's wanted

Remove two sections from `docs/TOOL_DOCUMENTATION.md`:

1. The **"Possible future additions"** checklist at the end of §7 (Known
   limitations).
2. **§8 Build history** in its entirety — the four `<details>` blocks
   covering the pre-repo accuracy review, general design decisions, and a
   per-requirement narrative (002 through 007).

## Why

- The roadmap ("Possible future additions") duplicates a list already
  tracked in the project's Notion page, which is the declared source of
  truth for this doc's content (per the doc's own byline). Keeping it in
  two places invites exactly the kind of drift already observed between
  the repo copy and Notion.
- The per-requirement narrative in §8 duplicates what `CHANGELOG.md`
  already records for every requirement (001–007) in comparable detail.
  Maintaining both is redundant busywork with no reader benefit.

## Resolved decisions (from grilling round)

- **Process docs updated in the same PR.** `CLAUDE.md` and
  `CONTRIBUTING.md` both currently instruct every PR to add a new §8
  Build history entry. Both get updated in this same PR to drop that
  step, so the lifecycle no longer points at a section that won't exist.
  Going forward, `CHANGELOG.md` is the sole change-history record — both
  "what shipped" and "why."
- **`CHANGELOG.md`'s own header gets rewritten.** It currently says "For
  the detailed narrative ... see `docs/TOOL_DOCUMENTATION.md` §8 Build
  history." That pointer becomes dead once §8 is gone, so the header is
  rewritten to describe `CHANGELOG.md` as the complete record instead.
- **Mirrored into the Notion page too.** The Notion page ("UK Retirement
  Planner — Tool Documentation") currently carries its own copies of both
  sections, already out of sync with the repo file. This PR removes the
  same two things there as well, in the same session, rather than leaving
  it as a separate follow-up.
- **Undocumented history preserved, not just dropped.** Two of the four
  §8 detail blocks — "Accuracy fixes made during the calculation review"
  and "Design decisions worth remembering" — predate the intent/spec
  numbering scheme and have no equivalent entry anywhere in `CHANGELOG.md`
  (the other two blocks — 002 through 007's per-requirement detail —
  duplicate content `CHANGELOG.md` already has). Before deleting §8,
  that content is folded into `CHANGELOG.md`'s existing "Initial release"
  entry, since both predate this repo's first commit. Nothing that isn't
  already duplicated elsewhere is lost from the live docs.

## Non-goals

- No change to any calculation, input, or user-facing behaviour — this is
  a documentation/process-only change. No `USER_CHANGELOG` entry, no
  `sw.js` cache bump.
- No change to §7's numbered "Known limitations" list itself (items 1–11)
  — only the "Possible future additions" subsection beneath it.
- No renumbering of `docs/TOOL_DOCUMENTATION.md`'s remaining sections;
  §8 simply ceases to exist and the doc ends at §7.
