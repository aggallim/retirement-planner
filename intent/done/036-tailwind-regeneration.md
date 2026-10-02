# 036 — Regenerate the inlined Tailwind CSS from the app source

## Status

Tooling that the rest of the 034 batch needs. Repo-only (no user-facing
change of its own).

## Problem

The Tailwind CSS in `index.html` was generated once. Any class used later
for the first time has no CSS behind it (docs §5.1). Regenerating it showed
several classes already in the code that silently do nothing today. For
example, `focus-visible:ring-2` on the tooltip buttons, `grid-cols-4` on a
couple's summary card when other savings exist, and several hover colours.
The batch adds a lot of new UI, so hand-writing each missing rule doesn't
scale.

## Decisions

- Add `tools/tailwind/` with a pinned Tailwind CLI (3.4.19, the version
  that built the current CSS), a config and `build.mjs`. The script takes the
  app script out of `index.html`, scans it for classes, and writes the
  minified CSS back into the `<style>` tag on line 26.
- The config safelists every class in the current CSS, so the output is a
  strict superset. Nothing that renders today can lose its styles.
- Dev-only, like `tools/feedback/worker/package.json`. The site still has
  no build step: the generated CSS is committed inside `index.html`.
- The brand palette (intent 056) is defined in this config too.
