# 017 — Privacy as a visible product feature

## Status

Resolved via the `grilling` skill, run in one round. Fifth and final of
five bundled Wave 1 items (9, 20, 17, 18, 10) — see
`intent/013-today-vs-nominal-money.md`'s Status section for the bundling
decision.

## Problem

Raised via the project's Notion roadmap — Medium priority item #10:
"Make privacy / on-device-only calculation a visible product feature, not
just an implementation detail — e.g. '🔒 Your financial data stays in
your browser. No account, no upload, no bank connection.'" Reviewer's
reasoning: "a genuine differentiator for a tool asking people to enter
pension balances, salary and savings."

What's actually there today:

- **No user-facing privacy messaging exists anywhere in the app.**
  `CLAUDE.md` documents "data never leaves the device" as a project
  fact, but nothing in `index.html` says this to the user.
- **The only existing precedent for a permanent trust/disclaimer
  statement is the site-wide footer**: `"UK Retirement Planner • For
  illustrative purposes only • Not financial advice"`, plus a second
  line noting the reference tax year — a dark, centered `<footer>` at
  the bottom of the page.
- **The ⚙ Data menu already exists** as the home for Export/Import/
  Reset/theme/"What's new" — thematically the natural place for a
  data-related statement, though it requires a click to discover.
- **Fact-checked, confirmed true**: no `fetch`/`XMLHttpRequest`/
  analytics/tracking calls exist anywhere in the app's own code. The
  only outbound network activity at all is loading Google Fonts
  (`fonts.googleapis.com`/`fonts.gstatic.com`) on page load, which
  carries no user data — so "no account, no upload, no bank connection,
  no analytics" is accurate as written, without needing to (and without
  claiming to) mean *zero* network activity.
- **No `Lock`/`Shield` icon exists** in the app's inlined lucide-style
  icon set (`Info`, `CheckCircle`, `AlertTriangle`, `Settings`, etc. —
  all hand-copied SVG path components, no emoji used anywhere in the
  UI).
- Next intent number available: 017.

## Outcome

Resolved via `grilling`:

1. **Placement — footer plus Data menu, both existing surfaces, no new
   prominent UI element.** A short permanent line is added to the
   existing footer (extending its current disclaimer pattern), and a
   fuller explanation is added to the ⚙ Data menu (thematically apt,
   since it's literally the menu for data/export/import/reset). A more
   prominent placement near the top of the input form — which would
   better serve the reviewer's own "reassure before they type in
   sensitive figures" rationale — was considered and explicitly
   deferred: it's a bigger UI/design commitment (a new persistent
   element competing for attention with the results) than a
   Medium-priority "make it visible" item warrants for this bundle, and
   is flagged below as a possible follow-up rather than done now.
2. **Icon — a new `Lock` icon component, not the roadmap's literal 🔒
   emoji.** Added following the exact convention every other icon in
   the app already uses (a hand-copied inline SVG path, module-level).
   The app's visual language has never used emoji; introducing one here
   would be inconsistent with `AlertTriangle`, `CheckCircle`, `Settings`
   and every other icon-driven affordance already in the UI.
3. **Message scope — includes "no analytics," not just the roadmap's
   own wording.** Both placements state no account, no upload, no bank
   connection, and no analytics/tracking — one more true clause beyond
   the roadmap's own example, directly reinforcing the differentiator
   the reviewer is pointing at. The footer version stays a single short
   line; the Data menu version carries the fuller explanation.

## Non-goals

- No new prominent/persistent UI element near the top of the page or
  input form (decision 1) — flagged as a possible future follow-up, not
  built in this bundle.
- No 🔒 emoji or other emoji anywhere in the UI (decision 2).
- No overclaiming zero network activity — the message is scoped to user
  data specifically (account/upload/bank-connection/analytics), which
  remains true even though the app does load Google Fonts.
- No calculation or engine changes of any kind — this item is pure
  copy/UI, adding a short message to two existing surfaces.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` bump happens once
  for the whole bundled delivery (per `intent/013`'s Constraints), not
  repeated here.
- The new `Lock` icon component is module-level, following the same
  pattern as every existing icon (`Info`, `CheckCircle`,
  `AlertTriangle`, etc.).
- `docs/TOOL_DOCUMENTATION.md` §3 should note the new footer/Data-menu
  messaging; no §5.4 verification checklist item is needed (no
  calculation changes). `USER_CHANGELOG` gets an entry, since this is
  user-facing.
- A `USER_CHANGELOG` entry for this item should be worded so it doesn't
  imply the privacy properties are new — they're existing project facts
  that are only now stated visibly in the app.
