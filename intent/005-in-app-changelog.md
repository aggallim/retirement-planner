# 005 — In-app changelog

## Status

Proposed.

## Problem

`CHANGELOG.md` (per `CLAUDE.md`) is the "what shipped when" record for this
project, but it only exists in the Git repository. A user who has the PWA
installed on their phone has no way to see what changed between one version
and the next — `docs/TOOL_DOCUMENTATION.md` §7's "Possible future additions"
names this gap directly: *"User-friendly changelog surfaced in the app
itself — visible version history for users, not just Git history."* Right
now the only signal a user gets that anything changed at all is the app
silently updating in the background (per §6.3, driven by the `sw.js` cache
version bump) — there is no in-app way to see what that update contained,
or to review past updates.

## Outcome

1. **A changelog view reachable from inside the app** — e.g. a header
   control (in the spirit of the existing **⚙ Data** menu added by intent
   004) that opens a panel/screen listing releases most-recent-first, each
   with a date and a short, plain-language list of what changed.
2. **User-facing wording, not the raw `CHANGELOG.md`.** `CHANGELOG.md`'s
   entries are written for contributors (they reference intent/spec file
   paths, implementation detail like `schemaVersion` or `migratePerson()`).
   The in-app version restates the same shipped changes in plain language a
   non-technical user would understand — no file paths, function names, or
   requirement numbers.
3. **Content ships inside `index.html`, not fetched from `CHANGELOG.md` at
   runtime.** Consistent with the single-file PWA constraint (`CLAUDE.md`
   "Conventions"; tool docs §5.5) and with the app needing to work fully
   offline once installed (tool docs §5.5's service-worker caching) — a
   separate `CHANGELOG.md` fetch would need its own offline-caching and
   markdown-parsing logic for no real benefit over an inlined list.
4. **Something marks unseen updates.** At minimum, a way for a returning
   user to notice that the app updated since they last looked (e.g. a badge
   or dot on the control from point 1) rather than the changelog being
   something they'd only find by going looking for it. The exact mechanism
   (badge, one-time banner, etc.) is a spec-stage decision.
5. **Every future requirement that changes user-visible behaviour adds an
   entry here alongside its `CHANGELOG.md` entry.** This is a process
   change as much as a UI one — from this requirement onward, "add a
   `CHANGELOG.md` entry" (`CLAUDE.md`) also means adding the matching
   plain-language in-app entry in the same PR.

## Non-goals

- **Not a replacement for `CHANGELOG.md`.** The Git-facing changelog keeps
  its existing contributor-oriented detail and role in the lifecycle
  (`CLAUDE.md`, `CONTRIBUTING.md`); this adds a second, user-facing
  presentation of the same shipped history, it doesn't replace either
  `CHANGELOG.md` or §8 Build history.
- **No retroactive backfill requirement beyond what's reasonable.** This
  intent doesn't require perfectly reconstructing plain-language entries
  for every historical release before the app existed as such — a
  reasonable starting point (e.g. from the JSON import/export release
  onward, or all four shipped requirements — a spec-stage decision) is
  acceptable, so long as the mechanism is in place for every release from
  here on.
- **No push notifications, email, or any out-of-app notification** about
  new versions — the "unseen update" signal in Outcome point 4 is inside
  the app only, seen next time it's opened.
- **No versioning/release-numbering scheme beyond what already exists**
  (dated `CHANGELOG.md` headings and the `sw.js` cache version). This
  intent doesn't introduce semantic versioning or a version number shown
  in the UI unless the spec stage decides that's the simplest way to key
  the "what's new since last visit" comparison in point 4.

## Constraints

- **Respect the module-level/memoised component pattern** (`CLAUDE.md`
  §5.3, tool docs §5.3) for any new component this view introduces — no
  inline subcomponent definitions inside a parent component.
- **No new dependencies.** A list of dated entries with a short bullet list
  each needs nothing beyond what's already in the page — no markdown
  renderer, no router.
- **Data lives on-device only, as everywhere else in this app** — any
  "last seen version" state (for the unseen-update marker in Outcome point
  4) goes in `localStorage` alongside the existing saved plan, not to any
  server (this app has none, per `CLAUDE.md`).
- **Not an engine change.** `projectJoint()` is untouched; no new
  `tests/test-engine.js` cases are expected from this requirement alone.
- **Update `docs/TOOL_DOCUMENTATION.md` in the same PR:** a new §3
  subsection documenting the changelog view and the unseen-update marker; a
  new §8 Build history entry; and removal of the now-implemented bullet
  from §7's "Possible future additions".
- **Add a `CHANGELOG.md` entry** naming this intent, per `CLAUDE.md` — and,
  per Outcome point 5, the matching in-app entry, establishing the pattern
  every subsequent requirement should follow from here on.
- **Bump the service worker cache version** (`sw.js`) as with any
  `index.html` change.
