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
