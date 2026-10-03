# 043 — AI and search discoverability

## Status

Roadmap #29. Non-functional, free tier.

## Problem

The page is an empty `<div id="root">` plus "Loading your plan…" until
JavaScript runs. Most AI crawlers don't run JavaScript, so they see nothing
to describe or cite. There's no description, no structured data, no
`llms.txt`, no `robots.txt` and no sitemap.

## Decisions

- Static, crawlable summary inside `#root`: what the tool does, who it's for,
  what it models, the privacy stance, and "not financial advice". React
  replaces it on mount; the boot overlay already covers it for people.
- `<meta name="description">`, a canonical URL, Open Graph and Twitter card
  tags, and JSON-LD (`WebApplication` with `isAccessibleForFree`, plus a short
  `FAQPage`).
- `llms.txt` (the llmstxt.org format: summary, key facts, links) and
  `llms-full.txt` (the full methodology and reference figures in plain
  Markdown, for citation).
- `robots.txt` allowing all crawlers, including AI ones, and pointing at
  `sitemap.xml`.
- No tracking or analytics are added. The privacy stance is unchanged.
