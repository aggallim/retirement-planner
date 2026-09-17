# 005 — User-facing changelog, built into the app

## Status

Resolved — ready for implementation. Fleshed out from
`intent/005-user-facing-changelog.md` by resolving the one open design
decision that document deliberately left unsettled (exact placement within
the `SettingsMenu` popover).

## Problem

See `intent/005-user-facing-changelog.md` §Problem — unchanged here.
`CHANGELOG.md` is developer-facing; there's no plain-language "what's new"
reachable from inside the app itself.

## Outcome

See `intent/005-user-facing-changelog.md` §Outcome, points 1–6 —
unchanged here. This spec adds the implementation-level detail those
points didn't settle.

### Resolved design decision

Intent's Constraints section explicitly deferred one thing: *"Exact
placement within the `SettingsMenu` popover is a spec-stage decision, not
settled here... five-plus backfilled entries plus future growth could make
a single non-scrolling panel unwieldy next to the existing Export/Import
controls."*

**Resolved: a swappable secondary view within the same popover, not a
third stacked section.**

`SettingsMenu` (`index.html`, currently ~line 1676) gains one new piece of
local state: `view`, `'menu' | 'whatsnew'`, default `'menu'`. This is
transient UI state exactly like the existing `open`/`importError` state
already on this component — it isn't persisted, and it resets to `'menu'`
whenever the popover closes, so it always reopens on the default view.

- **Menu view** (unchanged Export/Import content) gains one new row, below
  Import and separated by the same `border-t` divider pattern already used
  between Export and Import: a plain text link (not a filled button — lower
  visual weight than the primary actions), reading **"What's new
  (`{latest version}`)"**, where `{latest version}` is read directly off
  the data (`USER_CHANGELOG[0].version`) rather than hardcoded, so it can
  never drift. Clicking it sets `view` to `'whatsnew'`.
- **What's new view** replaces the panel's content entirely (same popover,
  same open/close state, different inner content) — a "← Back" link at the
  top sets `view` back to `'menu'`, followed by the full `USER_CHANGELOG`
  list, newest first, each entry showing its version, date, title, and
  plain-language bullets.
- The panel header's **✕ close button keeps its current meaning** (closes
  the whole popover) regardless of `view` — "← Back" is a separate,
  lower-level navigation action within the panel, not a replacement for
  it.

Rationale: a third stacked section would make the popover's height grow
unboundedly as entries accumulate, right next to the Export/Import
controls that need to stay easy to find and tap — exactly the kind of
mobile-cramping problem intent 003 already had to fix once for the header
itself. A swappable view keeps the popover a bounded, single-purpose
surface at any given moment, and needs no new component or dependency —
just one more local state variable and a conditional render inside the
already-memoised `SettingsMenu`.

No new icon is introduced for the "What's new" link — it's a text link
with no leading icon, keeping it visually distinct from (lower-weight
than) the icon-led Export/Import buttons.

### Data shape

A new module-level constant, placed next to `PERSISTED_FIELDS` in the
Persistence section:

```js
const USER_CHANGELOG = [
  // Newest first. Only entries for changes a user of the app would
  // notice -- see intent 005's inclusion rule. version reuses the sw.js
  // CACHE value at the point that change shipped.
  {
    version: 'v5',
    date: '2026-09-17',
    title: '...',
    items: ['...', '...']
  },
  // ...
];
```

`version`/`date`/`title`/`items` (a plain string array, one bullet per
item) is the complete shape — no additional fields needed for a static,
always-visible list with no unseen-tracking (per intent's confirmed
non-goals).

### Backfill

Three entries, translating the existing `CHANGELOG.md` content (dates
copied verbatim from there) into plain language with no implementation
detail:

- `v5` / `2026-09-17` — JSON import/export (004): export/import your plan
  as a file, with the pre-export warning and confirm-before-overwrite
  behaviour described in plain terms.
- `v4` / `2026-09-16` — Mobile sticky summary bar (003): the summary
  numbers stay visible while scrolling on a phone, and no longer get
  squashed or cut off.
- `v3` / `2026-09-16` — Extra savings accounts (002): Cash ISA, Stocks &
  Shares ISA, LISA and any number of other savings accounts, each tracked
  separately, with the LISA bonus and age-60 rule described in plain
  terms.

Exact wording is drafted during implementation (this spec fixes the shape
and the three source entries, not the final copy).

### This requirement's own entry

Per the inclusion rule, shipping the "What's new" view is itself a
user-facing change (a new piece of UI) — the PR that implements this spec
adds a fourth entry, `v6` (the `sw.js` cache version this change bumps to),
on top of the three backfilled ones. This is the first real-world
application of the rule going forward, not just the one-time backfill.

## Non-goals

See `intent/005-user-facing-changelog.md` §Non-goals — unchanged.

## Constraints

See `intent/005-user-facing-changelog.md` §Constraints — unchanged, with
one addition:

- **`view` state must reset to `'menu'` on close**, not persist across a
  close/reopen — resolved above, stated explicitly here since it's the
  kind of small detail that's easy to get wrong (e.g. by only resetting on
  unmount, which a popover toggled via CSS/conditional render never does).

## Open questions

None remaining. The one point `intent/005-user-facing-changelog.md` left
open (popover placement) is resolved above.
