# 039 — A still-working partner's take-home pay

## Status

Roadmap #8 (originally #15). Realism fix to joint planning, free tier.

## What's wrong

From the first person's retirement, all household spending is paid from
savings, even while the other person is still working (docs §4.5, §7 item 2).
That understates how long the money lasts when retirement dates are years
apart.

## Decisions

- New per-person input **Take-home Pay (Annual)**, in today's money: the pay
  that goes on household costs, after tax and the person's own pension and
  savings contributions. Shown only in couple mode, because spending only
  starts at the first retirement, so in individual mode it could never apply.
- It counts only in years when someone in the household has retired and this
  person hasn't. It rises with the household inflation rate (no real pay
  growth). It pays for spending after guaranteed income (State Pension, DB
  pension) and before pension drawdown and savings. Pay above what the
  household spends is not saved. Contributions are set separately, as now.
- It is net pay, so it isn't taxed again and doesn't affect the person's
  allowances or bands.
- Engine: optional `takeHomePay` on the person; absent = 0, so the baseline
  is unchanged. Rows gain `workIncome` (household) and `p1WorkIncome` /
  `p2WorkIncome`. The income chart gets an "Earnings" bar, shown only when
  there is any.
- Docs §4.5 and §7 item 2 are rewritten: salary is still not modelled
  before the first retirement (not needed), nor real pay growth.
