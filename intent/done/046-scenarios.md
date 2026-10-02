# 046 — Save and compare scenarios

## Status

Roadmap #15 (originally #5). Advanced.

## Decisions

- "Scenarios" card (Advanced only):
  - **Save current plan as…** stores a named copy of every plan input (up
    to 10).
  - Each saved scenario can be loaded (replaces the current inputs, after a
    confirm), renamed or deleted.
- **Compare:** tick up to three saved scenarios to set beside "Current plan":
  - a table of headline results: lasts until, pot at retirement, first-year
    income after tax in today's money, Living Standard, money left at the
    end in today's money, lifetime tax
  - a line chart of total savings over time, one line each
- Scenarios are saved with the plan (`scenarios` joins `PERSISTED_FIELDS`)
  and go through Export/Import. A scenario holds plan inputs only, never
  other scenarios.
- Each scenario is projected the same way as the current plan, Advanced
  inputs included.
