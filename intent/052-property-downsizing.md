# 052 — Property and downsizing

## Status

Roadmap #21 (originally #21, un-shelved). Advanced.

## Decisions

- "Home & downsizing" inputs (Advanced):
  - home value today
  - house price growth (default 3%/yr)
  - "Plan to downsize" toggle, and if on:
    - Person 1's age at the move
    - new home cost as a % of the sale price (default 60%)
    - moving costs as a % of the sale price (default 5%: stamp duty, fees,
      removals, combined)
- At the move:
  - Released cash = sale price × (1 − costs %) − new home cost − any mortgage
    still owed. The mortgage is treated as repaid and its payments stop.
  - Released cash goes into a "Downsizing proceeds" savings pot, owned by
    Person 1 for the projection. It grows at Person 1's Cash ISA rate and is
    drawn first, with other savings.
  - If the figure is negative, nothing is released, and the card says so.
- The home itself is never counted as spendable savings. Rows carry
  `homeValue` for display and `downsizeRelease` in the year it happens. A
  summary shows the projected home value at the move and at plan end.
- Engine: optional `property` argument; absent means unchanged.
