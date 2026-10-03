# 054 — Cap on extra savings accounts in Simple mode

## Status

Roadmap #22. Gate.

## Decisions

- Simple mode: up to **3** "other savings" accounts per person. With 3, the
  add button is disabled and says "Advanced mode allows more accounts".
- Advanced: no limit.
- Plans that already have more than 3 keep all of them, in either mode, and
  they all still count. The cap only stops adding more. Taking a working
  feature away from existing free users would break the "core accuracy is
  always free" principle.
- Docs §7 item 11 is updated.
