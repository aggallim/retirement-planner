# 008 — Dismissable warning banner

## Status

Proposed.

## Problem

The header's warning banner (the red-bordered box below the summary panel,
`warnings.length > 0 && ...` at `index.html:2189-2198`) lists every
currently-true warning from the `warnings` memo (`index.html:2041-2056`) —
pension/ISA/LISA annual-allowance breaches, a State Pension start-age gap,
household income below the PLSA minimum band, funds projected to run out
before plan end. It's recomputed fresh on every render with no dismiss
control. Once a warning condition is true, the banner stays visible on
every visit for as long as the underlying figures keep triggering it, even
after the user has seen it and consciously decided not to act on it (e.g. a
State Pension gap they're aware of and planning around deliberately).
Reported directly by the user, with a screenshot showing the banner listing
a 12-year and a 2-year State Pension gap (one per person, in couple mode).

## Outcome

Resolved via the `grilling` skill:

1. **Whole-banner dismiss, not per-line.** A single close control on the
   banner hides the entire thing — not each warning line individually.
2. **Dismissal persists across reloads**, via `localStorage`, consistent
   with how the rest of the app's state already persists locally.
3. **Dismissal is tied to the exact set of warnings shown at the time it
   was dismissed.** If the computed `warnings` array changes at all after
   that — a warning's wording/figures change, a new warning appears, or the
   mix of active warnings otherwise differs from the dismissed snapshot —
   the banner reappears. Dismissal acknowledges "I've seen *this*", not
   "never warn me about anything again."
4. **The existing Reset button clears the dismissal too.** Resetting the
   plan back to defaults (which already wipes other saved state) also
   clears any dismissed-warning snapshot.
5. **Dismissal is local-only.** It does not round-trip through the JSON
   Export/Import plan feature (intent 004) — it's a device/browser UI
   preference ("have I seen this"), not plan data. Importing an exported
   plan on a different device shows all currently-applicable warnings,
   regardless of what was dismissed on the device that exported it.

## Non-goals

- **No per-warning-line dismissal.** Only whole-banner dismiss/show, per
  the resolved decision above — a possible separate, later requirement if
  ever wanted, not part of this one.
- **No change to which conditions produce a warning, or their wording or
  thresholds.** Purely about acknowledging and hiding the banner, not the
  warning logic in the `warnings` memo.
- **No snooze/mute-for-N-days mechanic.** Dismissal is binary (shown or
  not) and keyed to the exact warning set, not time-based.

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` gets bumped per the
  usual deploy convention, since this is user-facing.
- `SliderWithInput`, `PersonInputs`, `CustomTooltip`, `WealthChart` and
  `IncomeChart` stay module-level and memoised (`CLAUDE.md` §5.3) — if the
  banner is pulled into its own component to host the dismiss control, it
  follows the same module-level, stable-handler pattern.
- UI-only change — no `projectJoint()` or calculation logic is touched, so
  the tool docs §5.4 verification checklist doesn't apply, but the parts of
  `docs/TOOL_DOCUMENTATION.md` describing the warning banner should be
  updated to match, per `CLAUDE.md`.
