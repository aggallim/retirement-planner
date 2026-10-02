# 040 — "What if?" sliders

## Status

Roadmap #7 (originally #4). Free tier.

## Decisions

- A "What if…?" card directly under "Your projection assumes...", collapsed
  by default to keep the page short.
- Four sliders, all relative to the current plan and applied together:
  - retire earlier or later: −5 to +5 years, one shared change for both
    people, within the usual retirement-age limits
  - spending: −30% to +30%
  - investment growth: −3 to +3 percentage points, applied to every account
  - extra pension contribution: £0 to £1,000 a month per person, kept within
    the annual allowance
- It shows "Your plan" next to "What if" for: whether the plan lasts, the
  year the money runs out (or "lasts beyond plan end"), the pot at
  retirement, first-year income after tax in today's money, and the Living
  Standard.
- "Apply to my plan" writes the changes into the real inputs (with a
  confirm). "Reset" sets the sliders back to zero. The slider positions are
  not saved; they're a scratch pad.
- Wording follows the batch rule: "With these changes, under the same
  assumptions…". Nothing says what to choose.
