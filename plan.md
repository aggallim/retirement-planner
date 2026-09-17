# Plan — 005 User-facing changelog

Implementation sequence for `intent/005-user-facing-changelog.md` /
`spec/005-user-facing-changelog.md`. Working file only — deleted before
this PR merges (`CLAUDE.md` step 4 / `CONTRIBUTING.md` step 5).

## Current state (what this plan builds on)

- `SettingsMenu` (`index.html`, ~line 1676) is a memoised, module-level
  component with `open` (popover visibility) and `importError` local
  state, an Export section and an Import section separated by a
  `border-t border-slate-100` divider. The panel header is a fixed
  `"Export & import"` title + a ✕ button that calls `setOpen(false)`.
  Full current code read and confirmed before writing this plan.
- `PERSISTED_FIELDS`/`SCHEMA_VERSION`/`exportPlan`/`validatePlanShape`/
  `importPlanFields` live together in the Persistence section (~line
  700–735) — `USER_CHANGELOG` joins them there.
- `sw.js` `CACHE` is currently `'retirement-planner-v5'`.

## Sequence

1. **Add `USER_CHANGELOG`**, module-level, next to `PERSISTED_FIELDS`.
   Newest first. Drafted copy (spec fixed the shape and sources, not the
   final wording):

   ```js
   const USER_CHANGELOG = [
     {
       version: 'v6',
       date: '2026-09-17',
       title: "See what's changed, right here",
       items: [
         "A new \"What's new\" link in the Data menu shows a plain-language history of updates to the app."
       ]
     },
     {
       version: 'v5',
       date: '2026-09-17',
       title: 'Export and import your plan',
       items: [
         'Save your figures to a file from the Data menu, so you can back them up or move them to another device.',
         'Importing a file shows a warning first and asks you to confirm before it replaces what’s currently saved.'
       ]
     },
     {
       version: 'v4',
       date: '2026-09-16',
       title: 'Smoother summary bar on mobile',
       items: [
         'The Pot / Income / Living Standard summary stays visible while you scroll on a phone, without squashing or cutting off the numbers.'
       ]
     },
     {
       version: 'v3',
       date: '2026-09-16',
       title: 'Track more types of savings',
       items: [
         'Split the single ISA field into three: Cash ISA, Stocks & Shares ISA, and LISA — each with its own balance and growth rate.',
         'Add any number of other savings accounts (like Premium Bonds) alongside your ISAs.',
         'LISA contributions get the 25% government bonus automatically, and can’t be used to cover costs before you turn 60.',
         'A warning appears if your combined ISA/LISA contributions go over the annual allowance.'
       ]
     }
   ];
   ```

   (Escaped apostrophes shown for the single-quoted JS strings above; use
   whichever quoting the surrounding file already favours at the exact
   insertion point.) `v6`'s date (2026-09-17) is today's actual date,
   confirmed via `date +%Y-%m-%d` rather than assumed; the other three are
   copied verbatim from `CHANGELOG.md`.

2. **Add `view` state to `SettingsMenu`**: `const [view, setView] =
   useState('menu');` (`'menu' | 'whatsnew'`). Reset it automatically
   whenever the popover closes, covering every close path (✕ button, the
   header toggle button, a successful export, a successful import) with
   one rule instead of threading a reset through each:

   ```js
   useEffect(() => {
     if (!open) setView('menu');
   }, [open]);
   ```

3. **Header title becomes conditional**: `view === 'whatsnew' ? "What's
   new" : 'Export & import'`. The ✕ button's behaviour is unchanged —
   still just `setOpen(false)` — closing always means closing the whole
   popover, never just stepping back a view (per spec).

4. **Add the "What's new" link row** to the menu view, below the Import
   section, same `border-t border-slate-100 pt-2` divider pattern already
   used between Export and Import. A plain text link (no icon, no
   button-style background/border — lower visual weight than Export/
   Import), reading `` `What's new (${USER_CHANGELOG[0].version})` ``.
   `onClick` sets `view` to `'whatsnew'`.

5. **Add the what's-new view**, rendered instead of the menu-view content
   when `view === 'whatsnew'`:
   - A "← Back" link at the top, `onClick` sets `view` back to `'menu'`.
   - `USER_CHANGELOG.map(...)`, each entry showing version + date (small,
     muted text), title (bold), and its `items` as a bullet list.
   - Wrap the entry list in its own scrollable region (e.g. `max-h-64
     overflow-y-auto` on the list container, popover itself stays `w-72`)
     so the popover's *height* stays bounded as entries accumulate —
     this is the actual mechanism behind the "avoid unbounded growth"
     reasoning in the spec's resolved decision; without it, a scrollable
     view is just a stacked section with extra steps.

6. **Bump `sw.js`** `CACHE` from `v5` to `v6` — matches the `v6` entry
   just added to `USER_CHANGELOG` (point 1). If any other `index.html`
   change happens first and claims `v6`, renumber the new entry and the
   cache bump together, not one without the other.

## Manual verification

Not an engine change (`projectJoint()` untouched) — no new
`tests/test-engine.js` cases expected, per spec. Verify by hand:

- [ ] `node tests/test-engine.js` still 14/14 (unaffected, confirms
      nothing else broke).
- [ ] `node --check` on the extracted app script.
- [ ] Open the Data menu → "Export & import" shows as before, with the
      new "What's new (v6)" link visible below Import.
- [ ] Click it → view swaps to "What's new", showing all four entries
      newest-first (v6, v5, v4, v3), each with correct version/date/
      title/bullets; long content scrolls within a bounded area rather
      than growing the whole popover.
- [ ] Click "← Back" → returns to the Export/Import menu view.
- [ ] Close the popover (✕) while on the what's-new view, reopen it →
      opens back on the menu view, not stuck on what's-new.
- [ ] Toggle-close via the header "Data" button while on the what's-new
      view → same reset behaviour as the ✕ button.
- [ ] Export and Import still work exactly as before (regression check —
      this PR shouldn't touch their behaviour, only add a sibling view).
- [ ] No new console errors.
- [ ] Visual check at a narrow (mobile) width — the what's-new view
      doesn't overflow or get cut off.

## Docs updates (same PR, per `CLAUDE.md`)

- `docs/TOOL_DOCUMENTATION.md` §3 — new subsection documenting the
  "What's new" link/view inside the Data menu.
- §8 — new Build history entry: why a swappable view instead of a third
  stacked section (the mobile-cramping precedent from intent 003), and
  that `USER_CHANGELOG` reuses the `sw.js` cache version with intentional
  gaps.
- `CHANGELOG.md` — new dated entry naming `intent/005` (developer-facing,
  technical — unaffected in role by this feature).
- `CLAUDE.md` **and** `CONTRIBUTING.md` — add the new conditional
  same-PR step: *"add a `USER_CHANGELOG` entry in `index.html`, if (and
  only if) the change is user-facing"* — worded like the existing
  `CHANGELOG.md`-entry requirement but conditional, per intent's
  Constraints. This is the step that makes the rule stick for future
  requirements, not just this one.

## Explicitly out of scope (intent/spec Non-goals — don't drift into these)

No GitHub Releases or git tags, no semantic versioning, no "unseen update"
badge/indicator or last-seen tracking, no change to `CHANGELOG.md`'s
existing role, no ongoing backfill process beyond this one-time v3–v5
catch-up.
