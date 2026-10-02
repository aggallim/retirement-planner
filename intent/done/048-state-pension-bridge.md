# 048 — Bridge to State Pension view

## Status

Roadmap #17 (originally #13). Advanced.

## Decisions

- Card shown in Advanced mode when anyone retires before their State Pension
  age (or before their DB pension starts).
- For each such person: the bridge years (retirement year to the year before
  State Pension), with a summary such as "3-year bridge, 2031 to 2033: £X
  drawn from pensions and savings (today's money)".
- Table, one row per household bridge year: spending, guaranteed income,
  earnings (039), pension drawdown, tax, from savings, and savings left at
  the end of the year.
- Built from the existing projection rows. No engine change.
