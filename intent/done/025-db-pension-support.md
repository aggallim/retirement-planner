# 025 — Defined Benefit (DB) pension support

## Status

Resolved via the `grilling` skill, run across two sessions in three rounds
total. Round 1 was conducted directly against the repo — reading the
Notion roadmap item, `projectJoint()`, the State Pension modelling this
closely mirrors, and the existing per-person input patterns (single fixed
field vs. repeatable list) — in a separate Claude Code session. Rounds 2–3
continued in a planning conversation without direct repo access, working
from round 1's resolved decisions. Covers Notion roadmap item **#2** (orig.
**#25** — DB pension support, reclassified from paid to free) plus two new
paid-tier items surfaced during round 1 that are explicitly **not** built
now: **#31** (multiple DB pensions per person) and **#32** (per-DB-pension
indexation choice).

## Problem

`docs/TOOL_DOCUMENTATION.md` §7 known limitation #8: "Defined benefit
pensions are not supported — only defined contribution pots." Both the
product/UX review and the founder-level commercial review flagged this as
a real gap, particularly for the 50–60/near-retirement segment identified
as the tool's strongest product/market fit — many people in that segment
still hold an old employer DB scheme, which the tool currently cannot
represent at all. The roadmap's own principle (see the Notion roadmap's
"Principles" section) is that closing a gap like this belongs in the free
tier — it's about the calculation being complete and honest, the same
logic already applied to UK income tax modelling — not a premium
convenience.

What's there today: `projectJoint()` has no concept of DB income anywhere.
State Pension is the closest existing analogue — a per-person amount and
start age, inflation-uprated from today, taxed per-person alongside
pension drawdown (per the recently-shipped UK tax modelling, intent 018).
Other Savings is the closest existing analogue for a repeatable,
user-named list of entries. The existing warning banner already flags "a
gap exists between retirement and State Pension age." The "Your projection
assumes..." assumptions panel is a deliberately fixed six-line list. The
Retirement Income vs Expenses chart currently breaks out pension drawdown,
ISA and State Pension as separate series.

## Outcome

### Ships now (free tier)

1. **One DB pension per person** — three fields: name, amount, start age.
   The name field is included even though there's only one entry, so the
   future paid repeatable-list version (#31) is a strict superset with no
   schema migration needed when someone unlocks multiple entries.
2. **Its own UI section**, not folded into "State Pension and
   inheritance." State Pension is universal; a DB pension is conditional —
   keeping it separate avoids lengthening the input list for the majority
   of casual users who have none.
3. **Escalation**: uprated by the single household inflation rate, exactly
   like State Pension — no new per-scheme indexation input in the free
   tier. This is a known simplification (real DB schemes vary: CPI-capped,
   RPI, fixed %, none) and **must be flagged to the user in two places**:
   (a) a short inline tooltip on the DB pension amount field itself, and
   (b) a line added to the existing "How we calculate this" methodology
   section. Neither alone is sufficient — the tooltip is seen at the point
   of entry but isn't discoverable later; the methodology section is the
   permanent record but isn't seen at the moment it matters.
4. **Tax treatment**: taxed per-person exactly like State Pension — added
   to that person's own taxable income, sharing their own personal
   allowance and tax bands with their State Pension and pension drawdown,
   before household totals are summed. This is the actual point of the
   feature being free rather than paid — the household income figure
   would be dishonest if DB income slipped through untaxed.
5. **Funding priority**: pooled together with State Pension into one
   combined "guaranteed income" figure that funds target expenses first,
   ahead of the 4%-rule pension drawdown and the savings tiers (other
   savings → Cash ISA → S&S ISA → LISA). State Pension and DB pension are
   economically identical for this purpose — both non-depletable,
   already-promised income — so there is no real ordering preference
   between them to model.
6. **Display stays separate despite the engine pooling above**: the
   Retirement Income vs Expenses chart gets a distinct series/colour for
   DB pension, not merged into the existing State Pension bar. Pooling for
   waterfall/funding logic and pooling for display are different concerns
   — merging them visually would be a real transparency regression for an
   app whose core asset (per every review so far) is letting users see
   exactly where their numbers come from.
7. **New warning**: a gap between a person's retirement age and their DB
   pension start age, mirroring the existing State Pension gap warning's
   logic directly (per-person check, same warning-banner mechanism).
8. **Assumptions panel**: DB pension appears as a **conditional** extra
   line — only shown when at least one person has actually entered a DB
   pension. The panel's existing fixed six-line list is otherwise
   unchanged, consistent with not overwhelming users who have none.
9. **Terminology**: "Defined Benefit (DB) Pension" — the real industry
   term, kept as-is rather than softened by a plain-language paraphrase.
   Unlike more abstract concepts the existing plain-language pass (intent
   016) simplified, the people who actually hold an old employer DB scheme
   already use this term; inventing a paraphrase would reduce clarity for
   exactly the audience who needs this field.

### Explicitly out of scope — documented as known limitations, not approximated

10. **No commutation / tax-free lump sum** from the DB scheme itself.
    Commutation factors are scheme-specific and there's no factual basis
    to model them accurately; a user wanting to approximate a DB lump sum
    can already use the existing Expected Inheritance field. "Not
    modelled" is honest; an invented commutation factor isn't.
11. **No interaction with the DC pension's Annual Allowance or Lump Sum
    Allowance.** Real DB accrual uses a value-of-growth test (16× the
    increase in annual pension) against the £60k Annual Allowance, and DB
    crystallisation uses a 20×-annual-pension valuation against the Lump
    Sum Allowance — but the tool doesn't model DB accrual at all (the user
    enters an already-promised income figure directly), so there's no
    accrual data to test either allowance against. Guessing a valuation
    would produce a number that looks precise but isn't.
12. **No survivor's pension.** The tool has no death-triggered mechanic
    anywhere — every income source simply stops being counted once a
    person's projection passes their life expectancy. Adding
    survivor-pension modelling for DB alone, when nothing else in the tool
    has an equivalent mechanic, would be an inconsistent special case for
    a niche detail.

### Paid-tier follow-ons (separate future items — not built as part of this requirement)

13. **Multiple DB pensions per person** (repeatable list, same shape as
    Other Savings) — Notion roadmap item **#31**. Real people often have
    2+ old employer schemes with different start ages; the free tier's
    single-entry limit means they'd otherwise have to hand-combine
    figures themselves.
14. **Per-DB-pension indexation choice** (fixed %, capped CPI, RPI, or
    none, per scheme, instead of the household inflation rate) — Notion
    roadmap item **#32**.

### Data / persistence

15. New optional per-person field(s) added to `PERSISTED_FIELDS`. Absent
    in an older saved plan defaults to "no DB pension" (empty/none) — no
    migration function is needed (unlike `migratePerson`'s handling of the
    ISA split), since this is a new optional addition rather than a
    restructuring of existing data.

## Verification

New engine logic lives inside the existing `ENGINE-EXTRACT` span so
`tests/test-engine.js` exercises it directly, per `docs/TOOL_DOCUMENTATION.md`
§5.4. New test cases needed:

- DB income is taxed per-person alongside State Pension and drawdown,
  sharing that person's personal allowance and bands correctly.
- DB and State Pension are correctly pooled and fund target expenses ahead
  of pension drawdown and the savings tiers.
- The DB-to-retirement-age gap warning triggers correctly (and only when
  there actually is a gap).
- The existing individual-mode regression fixture (`tests/fixtures/`) is
  unaffected when no DB pension is entered — default behaviour must be
  byte-for-byte identical to today's output.

`docs/TOOL_DOCUMENTATION.md` needs updating in the same PR: §3 (user
guide, new DB pension section), §4 (financial technicals — tax treatment,
funding priority, escalation), §4.7 (no new reference figures, but note
the simplification), §5.4 (new verification checklist items above), and
§7 (known limitation #8 narrows from "not supported" to "single DB pension
per person supported; commutation, Annual/Lump Sum Allowance interaction
and survivor's pension not modelled" — plus the existing limitation #5,
"one inflation rate applies to all spending categories," gets a
cross-reference since DB escalation reuses the same household rate).
`CHANGELOG.md` entry and a `USER_CHANGELOG` entry (this is user-facing) are
both required in the same PR, per the usual convention.
