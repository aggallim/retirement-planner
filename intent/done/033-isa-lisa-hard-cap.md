# 033 — Hard-cap ISA and LISA contributions

## Status

Roadmap item #4 (originally #24). Decisions settled by grilling with the
owner on 2026-09-30.

## What's wrong

The £20,000 combined ISA allowance (Cash ISA + Stocks & Shares ISA + LISA)
and the £4,000 LISA limit are only warned about. The engine adds every
contribution in full, so a plan over the limit overstates ISA saving.
`docs/TOOL_DOCUMENTATION.md` §4 and §7 item 7 record this as deliberate,
because it is unclear which account absorbs an excess.

Separately, real LISAs accept contributions (and the 25% bonus) only until
the holder's 50th birthday. The tool keeps paying LISA contributions until
retirement.

## Resolved decisions

- **Input prevention is the primary control.** Each of the three ISA
  contribution boxes gets a dynamic maximum: the headroom left under the
  £20,000/yr combined allowance after the other two boxes. The LISA box is
  also capped at £4,000/yr on its own. Only the box being edited is limited;
  other boxes are never rewritten. Limits are per person.
- **Visible limit.** Each box's subtitle shows how much of the shared
  allowance is left. Limits stay monthly, matching the existing boxes.
- **Engine backstop.** `projectJoint()` and the estimate function that
  mirrors it also cap contributions: LISA to £4,000 first, then any excess
  over £20,000 comes off S&S ISA, then Cash ISA. The 25% bonus applies only
  to the capped LISA contribution.
- **Old plans.** Saved plans and imported JSON already over the limit load
  unchanged (no silent data change). The engine caps them in the projection.
- **Allowance figures** are fixed nominal every year, like the pension
  annual allowance. No inflation uprating.
- **LISA age 50.** LISA contributions and the bonus stop once the person's
  age reaches 50 (last contributing year is age 49). Conservative: the real
  rule allows part of the year the person turns 50. Applied in the engine.
- **Warnings.** The two "exceed allowance" banners are reworded to say what
  the projection used. A fact-only line appears when LISA contributions
  dropped at age 50 affect the plan. No "you should" wording.

## Out of scope

- LISA first-home exception (§7 item 10) and the age-40 opening limit.
- Inflation-uprating the allowances.
- Clamping or rewriting saved data.

## Delivery

`index.html` (input limits, engine cap, age-50 rule, estimate function,
warnings, tooltips); `docs/TOOL_DOCUMENTATION.md` §3.5, §4, §5.4, §7;
`CHANGELOG.md`; `USER_CHANGELOG` (user-facing); `sw.js` cache and
`APP_VERSION` bump. Tests in `tests/test-engine.js` for the caps, the
order of reduction, the bonus on the capped amount and the age-50 cutoff.
