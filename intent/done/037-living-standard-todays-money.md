# 037 — Compare the Living Standard in today's money

## Status

Roadmap #5 (originally #23), "PLSA forward-inflation". Correctness fix,
free tier.

## What's wrong

The Retirement Living Standards bands are in today's money. The household
income they're compared with is in future pounds at the first year both
people are retired. So a plan retiring in 30 years at 3% inflation looks
about 2.4 times richer than it is against the bands. The app admits this in
a footnote, and docs §7 item 6 lists it as a limitation.

## Decisions

- Compare like with like: deflate the first-year after-tax household
  income to today's money (the existing `deflate()`), then compare with the
  bands. This is equivalent to inflating the bands forward to that year.
  Today's money is easier to understand than inflating every band.
- The Living Standard level is now based on today's money wherever it
  appears: the summary card, the sticky mobile bar, the gauge and its
  marker, and the "below minimum living standard" warning.
- The gauge section leads with the today's-money income, with the future-£
  figure as the secondary line. The "aren't directly comparable" footnote is
  replaced by one saying the comparison is in today's money.
- The bands themselves and their source are unchanged.
- Docs §7 item 6 is removed as a limitation.

## Addendum, 2026-10-02 (found while building)

Two problems became visible once the income was compared in today's money.
Both are fixed in this intent because without them the comparison would
still be misleading:

1. **State Pension and DB pension in the household figure were today's-money
   amounts added to a future-£ pension figure.** The household income now
   takes both from the projection's own nominal figures for that year.
2. **"Sustainable income" only counted the pension pot.** ISAs (including
   the tax-free lump sum, which the model moves into the Stocks & Shares
   ISA) and other savings were left out. The default plan, with a £1.66m pot
   at retirement, showed about £13,700 a year in today's money. The
   withdrawal rate now applies to every pot: the pension part is taxed, the
   savings part is tax-free. The breakdown gains a "Savings" figure. This is
   the usual reading of the 4% rule (a share of the whole portfolio), and the
   projection engine is unchanged.
