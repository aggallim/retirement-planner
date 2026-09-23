# Spec 021 — Relicense from GPLv3 to all-rights-reserved

Implements `intent/021-relicense-all-rights-reserved.md`.

## Changes to `LICENSE`

Replace the file's entire contents (currently the unmodified GPLv3
template) with:

```
Copyright (c) 2026 the repository owner (aggallim)

All rights reserved.

This source code is made publicly viewable on GitHub for reference
purposes only. No permission is granted to use, copy, modify, merge,
publish, distribute, sublicense, or sell copies of this software, in
whole or in part, without prior written permission from the copyright
holder.
```

No FSF boilerplate, no per-file headers elsewhere in the repo (none exist
today, per intent's fact-finding — `index.html` has no license header to
touch).

## Changes to `README.md`

Add a new `## License` section, following the existing doc's
header-per-topic structure (after "## Data & privacy", before "## Updating
the app" — keeps the practical/day-to-day sections grouped together with
the legal note last, immediately above the closing service-worker note):

```markdown
## License

All rights reserved — see [`LICENSE`](LICENSE). The source is public on
GitHub for reference, but isn't licensed for reuse, modification, or
redistribution.
```

## Changes to `CHANGELOG.md`

Add a new dated entry at the top (most-recent-first order), following the
existing per-requirement format:

```markdown
## 2026-09-23 — Relicense from GPLv3 to all-rights-reserved (021)

- Replaced the GPLv3 `LICENSE` text with an explicit "all rights
  reserved" notice (copyright held by the repository owner, `aggallim`)
  — the repo stays public (for GitHub Pages hosting) but the source is
  no longer open source. No external contributors or forks existed to
  consider (sole copyright holder throughout the repo's history).
  `README.md` gains a matching `## License` section stating the same.
  Process/repo change only — no code, calculation, or app-behaviour
  change, so no `USER_CHANGELOG` entry and no `sw.js` cache bump.
- Implements `intent/done/021-relicense-all-rights-reserved.md`.
```

## Out of scope

- No change to `index.html`, `sw.js`, or any calculation logic.
  `node tests/test-engine.js` is run to confirm it's unaffected, not
  because this touches the engine.
- No `docs/TOOL_DOCUMENTATION.md` change — nothing in its current content
  references licensing, and none of its §3/§4/§7 sections describe a
  repo-legal concern.
- No `USER_CHANGELOG` entry and no `sw.js` cache-version bump — nothing
  about the running app changes for a user.
- No repo visibility change (stays public) and no work on roadmap item
  #12 or anything later in the Commercialisation track.
- No retroactive-GPLv3 statement anywhere (intent decision 3).
