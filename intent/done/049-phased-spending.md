# 049 — Phased and one-off spending

## Status

Roadmap #18 (originally #8). Advanced.

## Decisions

- **Spending phases:** a list of { from age, to age, change % (−50 to +50) },
  where the ages are Person 1's (the plan's timeline). They apply to annual
  expenses only, not healthcare or the mortgage. Overlapping phases add up.
  Example presets offered: "Active early years +15% to 75", "Slower later
  years −20% from 80".
- **One-off costs:** a list of { name, Person 1's age, amount in today's
  money }, such as a car or a wedding. Inflation-uprated to their year and
  added to that year's spending. They only count from the first retirement
  onward, because the model has no spending before retirement; the age box
  starts at retirement age.
- Engine: optional `spendingPhases` and `oneOffCosts` arguments; absent
  means unchanged. Rows gain `oneOffSpending`. Funded like all spending.
- Advanced-only: ignored in Simple mode (044).
