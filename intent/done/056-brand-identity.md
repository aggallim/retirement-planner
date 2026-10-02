# 056 — Brand identity and visual design

## Status

Roadmap #33. Free. Done before the paid-tier UI settles, as the roadmap
suggests.

## What's wrong

The app looks like default AI-generated UI: Tailwind's stock `blue-600`, a
blue-to-teal gradient wordmark, a pale blue gradient page, and heavy
`shadow-lg` on every card.

## Decisions

- **Name unchanged:** "UK Retirement Planner". A rename belongs with the
  domain decision (#24), which is the owner's.
- **Palette:**
  - "Ink" navy replaces Tailwind's blue as the primary (600 = `#3a518f`)
  - teal stays as the partner colour
  - a marigold accent (`#d9a21b`) only in the mark
  - warm paper background (`#f7f5f0`) instead of the blue gradient
  - dark mode gets matching ink tones
  - done in the Tailwind config (036), so every `blue-*` class follows
    without touching each component
- **Mark:** a sun rising over a horizon line on an ink rounded square. Used
  for `icon.svg`, the favicon, the touch icon and a header logo beside a
  plain Fraunces wordmark (no gradient text).
- **Surfaces:** cards use a hairline border and a soft shadow instead of
  `shadow-lg`. The header sits on the paper background with a bottom rule.
- **Charts:** Person 1's series move from stock blue to ink. All other
  series keep their meaning-based colours.
- `feedback.html` and the manifest theme colour follow the same palette.
