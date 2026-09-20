# Plan — 011 "Can I retire?" headline verdict

Implementation sequence for `spec/011-can-i-retire-headline.md`. Branch-only
working file, deleted before this PR is marked ready.

1. `index.html` — engine layer, right after `projectJoint()`
   (`index.html:1647+`): add `planSucceeds()` (extracted from `longevity`'s
   existing depletion test) and `findSupportableDelta()` (the bidirectional
   shared-delta search, bounded by the existing per-person retirement-age
   slider limits). Both pure, module-level, no React dependency — same
   category as `projectJoint()` itself.
2. `tests/test-engine.js` — add cases for `findSupportableDelta()` per
   spec §8: already-succeeding plan (expect a negative delta or `null` at
   the floor), failing-but-fixable plan (expect the smallest positive
   delta), failing-and-unfixable-within-bounds plan (expect `null`), and
   individual mode (`person2: null`) matching the general case. Run
   `node tests/test-engine.js` and confirm all pass, including the
   pre-existing 14.
3. `index.html` — `RetirementCalculator`: add the `verdict` `useMemo`
   directly after `longevity` (`index.html:2165-2191`), per spec §3.
4. `index.html` — new `VerdictHero` module-level, memoised component
   (alongside `WealthChart`/`IncomeChart`, per `CLAUDE.md` §5.3): status
   badge (direct), headline sentence (hedged, per spec §4's four message
   cases), insights panel (rule-based, reusing `longevity` fields),
   caveat line, and the existing progress bar carried over unchanged from
   the current Longevity Analysis card.
5. `index.html` — layout restructure inside the
   `max-w-7xl mx-auto px-6 py-8` results container:
   - Render `<VerdictHero>` immediately after the warning banner and
     before the existing summary card row (`index.html:2426+`) — the hero
     takes the "first thing shown" position; the card row moves to
     directly beneath it, otherwise unchanged.
   - Delete the Longevity Analysis card
     (`index.html:2672-2697`) from the `lg:col-span-2` results column
     (`index.html:2671+`) — Wealth Projection becomes that column's first
     item.
6. `sw.js` — bump `CACHE` to the next version.
7. `index.html` — add a `USER_CHANGELOG` entry for the new headline/
   layout, versioned to match.
8. `docs/TOOL_DOCUMENTATION.md` — update §3.4 (replace the "Longevity
   Analysis" bullet, reword the "Summary cards" bullet, document the
   supportable-age search) and §5.4 (new verification checklist items for
   `findSupportableDelta`), per spec §6.
9. `CHANGELOG.md` — entry under today's date naming
   `intent/011-can-i-retire-headline.md`.
10. Manual verification per spec §8: failing plan shows "needs attention"
    plus a later supportable age (if any); succeeding plan shows "on
    track" plus an earlier supportable age (if any); a person's age near
    the 75 ceiling (or the floor) with no in-range delta shows "no
    supportable age found" rather than crashing; the old Longevity
    Analysis card is gone; the card row still renders correctly below the
    hero; couple mode's headline names both people, individual mode's
    names one.
11. Move `intent/011-can-i-retire-headline.md` and
    `spec/011-can-i-retire-headline.md` into their `done/` dirs, `git rm
    plan.md`, push, mark PR #14 ready for review.
