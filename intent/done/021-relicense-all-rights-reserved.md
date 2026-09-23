# 021 — Relicense from GPLv3 to all-rights-reserved

## Status

Resolved via the `grilling` skill, run in two rounds. Standalone item — not
bundled with roadmap item #12 (Simple/Advanced mode split), which depends
on this one but is separate functional work with its own intent later.

**Renumbered from 018 to 021.** This work was originally drafted as
`intent/018-relicense-all-rights-reserved.md` on the session's
harness-assigned branch. While it was in progress, two unrelated
requirements merged to `main` first and took the numbers this session
didn't yet know about: 018 (UK income tax modelling) and 019/020 (branch-
naming and intent-commit process changes — see
`intent/done/019-conventional-branch-names.md` and
`intent/done/020-intent-on-branch.md`). 019 also retired the exemption
that let agent sessions keep their harness-assigned branch name for
requirement work; this item now moves to a proper
`chore/021-relicense-all-rights-reserved` branch off current `main`, per
that decision. No decisions below changed — only the number and branch.

## Problem

Raised via the project's Notion roadmap — item #11, first in the "Path to
paid launch (sequential)" table: "Licensing decision — stop being open
source; keep repo public, relicense to all-rights-reserved." No
dependencies; it's the first Commercialisation-track item, ahead of the
Simple/Advanced split (#12), the account system (#13), and everything after.
The roadmap's own principles section states the intent directly: *"Not open
source going forward. Public repo stays public (keeps hosting free/cheap)
but is relicensed to all-rights-reserved; paid-tier logic is kept out of the
free client bundle once the account system exists — that's the actual
technical protection, not the licence text."*

What's actually there today:

- **The repo is currently licensed under GPLv3** — `LICENSE` is the
  unmodified GPLv3 template text (no filled-in copyright notice; the
  "Copyright (C) \<year\> \<name\>" block at the end is the FSF's own
  unfilled how-to-apply instructions, not an actual notice for this
  project).
- **No license mention anywhere else** — `README.md` has no license
  section or line at all, `index.html` has no license header, and
  `docs/TOOL_DOCUMENTATION.md` has no licensing content to update.
- **No external contributors or forks exist.** `git log` shows only Aaron
  Gallimore and Claude (committing on Aaron's behalf) as authors. GitHub
  shows 0 forks and 0 stars on the repo (created 2026-09-15). As sole
  copyright holder, Aaron has full legal authority to relicense without
  anyone else's consent — confirmed against GitHub's own guidance and
  general GPL-relicensing practice (no multi-contributor complication
  applies here).
- **GitHub's own default already matches the destination.** A public
  GitHub repo with no LICENSE file defaults to "all rights reserved" under
  ordinary copyright law — viewers can view/clone but get no rights to
  reuse, modify, or redistribute. GitHub doesn't offer a built-in template
  for this (it's not an OSI-approved open license), but a hand-written
  LICENSE file stating it explicitly is standard, accepted practice.
- **One residual GitHub-specific nuance, not a blocker**: because the repo
  stays public (for cheap Pages hosting, per the roadmap's own principle),
  GitHub's Terms of Service still grant other GitHub users a baseline right
  to view the repo and fork it *on GitHub's platform*, independent of the
  LICENSE file's text. That doesn't grant any right to use, deploy, or
  redistribute the code off-platform — the new LICENSE denies that — so it
  doesn't undermine the relicense, it's just an inherent side-effect of
  "stays public" worth knowing about, not something to work around.
- **CONTRIBUTING.md has no contributor-facing licensing language to
  update** — it's a workflow doc for whoever (human or agent) picks up
  work in this repo, with no "contributions welcome"/CLA-style language
  that the relicense would contradict.
- Next intent number available at time of renumbering: 021 (018, 019, 020
  taken by concurrently-merged work).

## Outcome

Resolved via `grilling`:

1. **LICENSE file — replaced, not deleted.** The GPLv3 text is replaced
   with an explicit, hand-written "All rights reserved" LICENSE file
   rather than removing the file entirely. The roadmap says "relicensed
   to all-rights-reserved" — an active statement, not silence — and an
   explicit notice is unambiguous to anyone browsing the public repo,
   where no LICENSE file at all just reads as an oversight rather than a
   deliberate choice.
2. **Copyright holder — generic, not a personal name.** The notice
   attributes copyright to "the repository owner" (GitHub username
   `aggallim`), not Aaron's full personal name. Chosen explicitly over the
   git-author-matching "Aaron Gallimore" default originally proposed.
3. **No retroactive-GPLv3 caveat.** GPL grants are technically irrevocable
   for copies already distributed, but with 0 forks, 0 stars, and no
   evidence of any external clone in the repo's public history, an
   explicit "this applies going forward only" statement was considered and
   rejected as unnecessary complexity with no one it would ever matter to.
4. **README gets an explicit license note.** `README.md` currently says
   nothing about licensing at all. Since the repo stays public even though
   it's no longer open source, a short explicit note (a new `## License`
   section, matching the doc's existing header-per-topic structure) states
   the source is provided for reference only and isn't licensed for reuse
   or redistribution — otherwise a public repo with no visible license
   note is ambiguous by default, undercutting the point of relicensing.
5. **Standalone delivery, not bundled with #12.** Ships as its own
   intent/spec/branch/PR. Unlike Wave 1 (five items deliberately bundled
   into one spec/PR per `intent/done/013-today-vs-nominal-money.md`'s
   Status section), #11 and #12 are functionally and legally distinct —
   a licence swap touches no code — and the roadmap lists them as separate
   sequential items rather than a named bundle.

## Non-goals

- No change to repo visibility — stays public, per the roadmap's own
  principle (cheap GitHub Pages hosting depends on it).
- No CLA, contributor covenant, or other contributor-facing legal
  infrastructure — there are no external contributors today, and none of
  that is part of what this item asks for.
- No retroactive licensing statement about pre-relicense copies (decision
  3) — judged unnecessary given zero evidence of external distribution.
- No work on item #12 (Simple/Advanced mode split) or anything later in
  the Commercialisation track — this item only changes the licence.
- No `docs/TOOL_DOCUMENTATION.md` changes — nothing in its current content
  references licensing, and this is a non-functional, non-calculation
  change (no §3/§4/§7 section applies).
- No `USER_CHANGELOG` entry in `index.html` — this changes nothing a user
  of the running app experiences; it's a repo/legal change only, per
  `CLAUDE.md`'s "repo/process only" carve-out.

## Constraints

- `CHANGELOG.md` still gets an entry (required for every requirement
  regardless of user-facing status), naming this intent file.
- The exact LICENSE wording and README placement are spec-level detail,
  not re-litigated here — the spec should produce a short, clear,
  hand-written "All rights reserved" notice (copyright holder: the
  repository owner / `aggallim`) and a matching short README `## License`
  section, consistent with decisions 1, 2 and 4 above.
- This is the first Commercialisation-track item; item #12 depends on it
  per the roadmap, so it should merge before #12's work starts, but #12
  itself is out of scope here.
- Branch: `chore/021-relicense-all-rights-reserved` off current `main`,
  per `intent/done/019-conventional-branch-names.md` (agent sessions no
  longer use their harness-assigned branch for requirement work).
