# 042 — Share your plan with your own AI assistant

## Status

Roadmap #36. Split tier (decided on the roadmap): free gets a basic snapshot,
Advanced gets the full detail. The app never embeds an AI or calls one.

## Decisions

- New "Share with your AI assistant" view in the ⚙ Data menu, with **Copy**
  and **Download (.md)**.
- Format: Markdown, which every chat assistant reads well. It contains:
  - a header saying what the tool is, that figures are illustrative under
    stated assumptions, and that the assistant should not treat it as
    financial advice
  - every input, grouped as the app groups them
  - the headline results: verdict, pot at retirement, first-year income
    after tax (future £ and today's money), Living Standard, the year money
    lasts until, and estimated lifetime tax
  - a methodology summary with a link to the live app
  - the plan as a JSON block in the same format as Export, so an assistant
    with the MCP server (055) can recalculate it
  - five example prompts, phrased as questions for the user to ask, such
    as "Which of my assumptions does this projection depend on most?"
- **No personal identifiers.** Names become "Person 1" / "Person 2". DB
  scheme names and savings account names become generic labels. No dates of
  birth exist in the app, so ages stay.
- **Advanced adds** a year-by-year table (balances, income by source, tax,
  spending) and a summary of each saved scenario (046).
- The view states plainly that the text goes wherever the user pastes it.
