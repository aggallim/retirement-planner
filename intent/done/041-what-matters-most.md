# 041 — "What matters most" sensitivity

## Status

Roadmap #6 (originally #7). Free tier. Wording constraint from the owner:
show mechanical consequences of hypothetical changes only, never "you
should".

## Decisions

- A collapsible "What matters most in your projection" card. It's computed
  only while open, to keep slider drags fast.
- Nine one-at-a-time changes, each run through the real engine: retire 2
  years later or earlier; spend 10% less or more; growth 1 point higher or
  lower; inflation 1 point higher; £100 a month more into each person's
  pension; plan horizon 5 years longer.
- Measure: money left at the end of the plan, in today's money, plus the
  change in the year the money runs out where there is one. Rows are sorted
  by the size of the change in money left, with a bar for each.
- Heading text: "How your projection responds to one change at a time.
  These are not recommendations." Each row reads, for example: "Retire 2
  years later: £84,000 more left at the end (today's money); money lasts 4
  years longer."
