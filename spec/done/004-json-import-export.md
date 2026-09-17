# 004 — JSON import/export

## Status

Resolved — ready for implementation. Fleshed out from `intent/004-json-import-export.md` by resolving the one open design decision that document deliberately left unsettled (export-warning frequency).

## Problem

See `intent/004-json-import-export.md` §Problem — unchanged here. All plan data lives in a single browser's `localStorage`, with no way to move a plan between devices, back it up outside the browser, or recover it after clearing site data.

## Outcome

See `intent/004-json-import-export.md` §Outcome, points 1–7 — unchanged here. This spec adds the implementation-level detail those points didn't settle.

### Resolved design decision

Intent point 7 explicitly deferred one thing: *"Whether it shows once or every export is a spec-stage decision, not settled here."*

**Resolved: the warning shows before every export, not just the first.**

Rationale: it's a lightweight, single-line notice ahead of the file download — not a modal the user has to click through — so the repeated-friction cost of showing it every time is low. Against that small cost, a one-time-only warning has a real failure mode: the person who actually mishandles the file (attaches it to the wrong email, drops it in a shared cloud folder) is very unlikely to be the same person who read and remembered a warning from months earlier on their first-ever export. The warning is only useful at the moment someone is about to create a new copy of the file, so it belongs at that moment, every time — consistent with how the rest of the app already prefers a live, always-current warning banner (§3.5) over a one-time dismissible notice.

Concretely: the warning is a short line of text directly in the Export control's UI (not a separate confirmation dialog requiring a click to proceed) — e.g. "This file contains your personal financial figures in plain text. Store or share it only somewhere you trust." — visible every time the settings/data area is open, not gated behind a one-time acknowledgement flag in `localStorage`. This keeps it distinct from the Import confirmation dialog (intent point 3), which *is* a click-through gate, because import is a destructive action (overwrites the current plan) and export is not.

## Non-goals

See `intent/004-json-import-export.md` §Non-goals — unchanged.

## Constraints

See `intent/004-json-import-export.md` §Constraints — unchanged. One addition:

- **The export warning is static text, not a dismissible/acknowledgement-tracked banner.** No new `localStorage` key for "has the user seen this," per the Resolved design decision above — that would reintroduce exactly the one-time-only behaviour just ruled out.

## Open questions

None remaining beyond what's resolved above.
