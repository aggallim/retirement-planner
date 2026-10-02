# 051 — Monte Carlo simulation

## Status

Roadmap #20 (originally #2). Advanced.

## Decisions

- Engine: optional `returnShocks` argument, an array indexed by projection
  year of `{ growth, cash }` percentage-point changes to that year's growth.
  `growth` applies to pensions, Stocks & Shares ISA and LISA; `cash` to the
  Cash ISA and other savings. Absent means unchanged (baseline untouched).
- Simulation (outside the engine): 1,000 runs. Each year's shocks are drawn
  from a normal distribution: 12% standard deviation for growth assets, 1%
  for cash. Each year is independent, and the same shock applies to both
  people. A fixed seed means the same plan always gives the same result.
  These volatilities are illustrative and held in one constant, stated in the
  card and the docs.
- Output:
  - the share of runs in which the money lasts to plan end
  - a fan chart (10th, 50th and 90th percentile of total savings, today's
    money)
  - the median year money runs out, in runs where it does
- It runs only when the user clicks "Run 1,000 simulations", then shows a
  note if inputs have changed since.
- Wording: "In X% of simulated return sequences, the money lasted…". It's
  described as a test of the plan against varied returns, not as a forecast.
