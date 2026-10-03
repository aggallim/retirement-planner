# 038 — Mortgage balance with interest

## Status

Roadmap #9 (originally #16). Correctness fix, free tier.

## What's wrong

The outstanding mortgage shown on the Wealth Projection chart is
`monthly payment × 12 × years left`, i.e. a 0% loan. A real repayment
mortgage's balance is the present value of the remaining payments at its
interest rate, which is lower, much lower early in the term (docs §7 item 3).

## Decisions

- New shared input **Mortgage Interest Rate** (0–10%, step 0.1) under Living
  Costs, shown only while there is a mortgage. Default 4.5% for new plans
  and for saved plans that don't have it yet.
- The payment and the years left stay as the user's inputs, so the payment
  and payoff year don't change. Only the balance changes:
  `balance = payment × (1 − (1 + i)^−n) / i`, where `i` is the annual rate
  ÷ 12 and `n` is the months left at the start of each row year. At 0% this
  is exactly the old straight-line figure.
- Engine: new optional `mortgageRate` argument; when absent it is 0, so the
  regression baseline and old callers are unchanged.
- The Living Costs section shows "Outstanding balance today ≈ £X" under the
  rate, so a user can check it against their statement.
- Interest-only mortgages are not modelled.
