# 004 — JSON import/export

## Status

Proposed. Drafted, then walked through explicitly with the user — see
"Decisions confirmed with the user" below; this isn't a set of assumed
defaults.

## Problem

All plan data lives in a single browser's `localStorage` (`ukRetirementPlanner.v1`,
`index.html` §"Persistence"), which `docs/TOOL_DOCUMENTATION.md` §7 already lists
as a deliberate limitation: *"Device-local storage — phone and laptop keep separate
plans, and clearing browser data erases the saved plan."* There is no way to move a
plan between devices, back it up outside the browser, or recover it after clearing
site data. §7's "Possible future additions" already names the fix: *"Export and
import a plan as JSON, for cross-device sync and backup."* This intent turns that
roadmap line into a concrete requirement.

## Outcome

1. **A settings/data area** (new UI surface, separate from the existing
   Save-indicator/↺ Reset controls in the header per §3.6) hosts two new
   controls: **Export** and **Import**.
2. **Export** downloads the current plan as a `.json` file (e.g.
   `retirement-plan-YYYY-MM-DD.json`) via a client-side Blob + `<a download>` —
   no server, upload, or account involved, consistent with this app having no
   backend. The file contains the full current input state — everything
   presently persisted under `ukRetirementPlanner.v1` (joint/individual mode,
   both people's pension/ISA/other-savings/State-Pension/expense figures,
   mortgage, growth assumptions, inheritance, etc.) — plus an explicit
   **`schemaVersion`** field. It does **not** include the computed projection
   — inputs are fully sufficient to reproduce it, so the export stays a
   backup/transfer file rather than also trying to be a standalone report.
3. **Import** opens a file picker, reads the selected file, and — once it
   passes the validation in point 5 — shows a confirmation dialog ("This will
   replace your currently saved plan on this device — continue?") before
   touching anything. Only on confirmation does it overwrite `localStorage`
   and re-render the app from the imported figures. Declining the dialog, or
   cancelling the file picker, leaves the current plan untouched.
4. **Per-field tolerance, not all-or-nothing.** Import reuses the same
   philosophy as the existing `pick(key, fallback)` loader (`index.html`
   §"Persistence"): a field missing from the imported JSON falls back to its
   default rather than aborting the import, and a field the file doesn't
   recognise (e.g. from a newer app version) is ignored rather than rejected.
   The goal is that adding a field to the saved-state shape in a future
   requirement doesn't require every previously-exported file to become
   invalid, and opening a newer export in an older build degrades gracefully
   instead of crashing.
5. **Reject only actual garbage.** Import still requires the file to parse as
   JSON and be a plausible plan object (a top-level object, not a string,
   array, or unrelated JSON blob) before offering the confirmation dialog. A
   file that isn't a plan at all — unparseable JSON, wrong top-level shape —
   is rejected with a clear error message and the current plan is left
   untouched. The bar is "not garbage," not "matches every field."
6. **`schemaVersion` exists for future migrations.** The field is written on
   export and read on import so that a later breaking change to the saved-state
   shape (in the style of intent 002's old-ISA-shape migration) has something
   to branch on. This intent does not need to define any actual migration
   transform, since `v1` is the only shape that has ever existed — it only
   needs the field to be present so future work isn't retrofitting it.
7. **Explicit warning before export.** The exported file is a verbatim,
   plaintext copy of real personal financial figures — before the download
   starts, show a clear warning that the file contains that data and should
   only be stored/shared somewhere the user trusts. No encryption or password
   protection (would need a new dependency, which is out of scope — see
   Constraints); the warning is the only new protection, and it's a UX nudge,
   not a technical control. Whether it shows once or every export is a
   spec-stage decision, not settled here.

## Non-goals

- **No live cross-device sync.** This is manual file export/import only — no
  account system, no server-side storage, no automatic background sync. The
  app remains backend-free per `CLAUDE.md`.
- **No merge-import.** Import is full-overwrite-on-confirm, not a field-by-field
  merge of the imported file into the currently saved plan. (Per-field
  tolerance in point 4 above is about *missing/unknown* fields degrading
  gracefully, not about combining two plans.) Confirmed explicitly with the
  user rather than assumed — see below.
- **No encryption, password-protection, or redaction/anonymisation** of the
  exported file. The file remains a verbatim copy of the user's figures — no
  new *technical* exposure is introduced beyond what already sits in
  `localStorage` today, but point 7 above does add a one-time UX warning
  since the data is now portable as a file rather than staying inside the
  browser. That warning is in scope; encryption/redaction tooling is not.
- **No drag-and-drop import UI.** A file-picker control satisfies this intent;
  drag-and-drop (or any other input mechanism) is a future enhancement, not
  required here.
- **No concrete migration transform.** As noted above, `schemaVersion` just
  needs to exist and be read — writing the logic that upgrades an old shape to
  a new one is deferred until there's an actual old shape to migrate from.

## Constraints

- **New settings/data menu, not the existing header controls.** Chosen
  deliberately to leave room to grow (e.g. a future "clear data" action)
  without crowding the Save-indicator/↺ Reset controls in §3.6. Confirmed
  explicitly with the user rather than assumed — see below.
- **No new dependencies.** File download/read uses standard Blob and
  `FileReader`/`<input type="file">` APIs already available in evergreen
  browsers — the single-file PWA constraint (`CLAUDE.md`, tool docs §5.5)
  holds, and this must not become a reason to add a build step or a library.
  The point 7 warning is plain markup/state, not a dependency.
- **Respect the module-level/memoised component pattern** (`CLAUDE.md`, tool
  docs §5.3) for any new components this menu introduces — no inline
  subcomponent definitions inside a parent component.
- **Not an engine change.** `projectJoint()` itself is untouched by this
  intent — only how state gets into/out of `localStorage` changes. No new
  `tests/test-engine.js` cases are expected, but the manual verification pass
  should include an export → Reset → import round trip confirming the
  restored plan matches the original figures exactly.
- **Update `docs/TOOL_DOCUMENTATION.md` in the same PR:** a new subsection
  under §3 documenting the Export/Import controls, the pre-export warning, and
  the confirm-before-overwrite import behaviour; §7 — update limitation #9 to
  note manual export/import now bridges devices (sync is still not automatic)
  and remove the now-implemented "Possible future additions" bullet; a new §8
  Build history entry explaining the `schemaVersion` field and the
  per-field-tolerant import design.
- **Add a `CHANGELOG.md` entry** naming this intent, per `CLAUDE.md`.
- **Bump the service worker cache version** (`sw.js`) as with any
  `index.html` change.

## Decisions confirmed with the user

This intent was drafted, then walked through point-by-point with the user
before being treated as settled, rather than shipped on assumed defaults.
Four genuine forks were raised explicitly; three confirmed the draft as
written, one changed it:

1. **Export scope** (inputs only vs. inputs + computed projection) — user
   confirmed **inputs only**, as drafted.
2. **UI placement** (new settings/data menu vs. extending the existing header
   controls) — user confirmed **new settings/data menu**, as drafted.
3. **Import behaviour** (full overwrite only vs. supporting merge) — user
   confirmed **full overwrite only**, as drafted.
4. **Export sensitivity** (plain JSON with no extra protection vs. an
   explicit warning before export) — user chose **add an explicit warning**,
   changing the original draft. Outcome point 7 and the corresponding
   Non-goals/Constraints entries above reflect this.
