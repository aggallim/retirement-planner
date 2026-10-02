# 053 — Multiple DB pensions and per-scheme indexation

## Status

Roadmap #31 and #32. Advanced, building on the free single DB pension (025).

## Decisions

- **More schemes (#31):** in Advanced mode each person can add more DB
  pensions to a list (name, yearly amount in today's money, start age), the
  same pattern as other savings. The existing single DB pension stays as the
  first scheme, so nothing migrates.
- **Indexation (#32):** every scheme, including the first, gets an increase
  choice:
  - follow my inflation assumption (default, same as today)
  - CPI capped at a rate
  - RPI
  - fixed rate
  - no increases
- **RPI** is modelled as the inflation input plus 1 percentage point until
  2030, then equal to the inflation input. RPI is being aligned with CPIH
  from February 2030 (UKSA/HM Treasury response to the RPI reform
  consultation). The figures live in `UK_REFERENCE.rpi`, with source.
- The increase applies from today (to the today's-money amount), as now.
  Deferred revaluation and payment indexation are not modelled separately.
- In Simple mode the extra schemes and the indexation choices are ignored
  (044). A note says how many Advanced schemes are switched off.
- Engine: `dbPensionsOf(p)` returns every scheme with its indexation, and
  the uprating helper is `dbIndexFactor()`. The old `dbPensionOf()` stays for
  the first scheme. Row fields are unchanged (household and per-person DB
  totals).
