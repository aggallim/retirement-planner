# 047 — Pension vs ISA vs cash comparison

## Status

Roadmap #16 (originally #14). Advanced.

## Decisions

- "Where an extra monthly amount goes" card. Inputs: an amount (£25 to
  £2,000 a month, the cost to you) and which person.
- Four options, each run through the real engine on top of the current plan:
  - **Pension:** the amount grossed up by basic-rate relief at source (×1.25),
    within the annual allowance.
  - **Stocks & Shares ISA:** limited to what is left of the ISA allowance; if
    that limits it, the row says so.
  - **Cash ISA:** the same limit.
  - **Other savings:** a new account growing at that person's Cash ISA rate.
- Results per option: first-year income after tax in today's money, the year
  money lasts until, money left at the end in today's money, and lifetime
  tax. The best figure in each column is highlighted, as data not advice.
- Stated plainly: higher- and additional-rate relief claimed back through
  self-assessment isn't modelled, nor salary sacrifice or NI savings, nor
  employer matching of extra contributions.
