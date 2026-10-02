# 050 — Printable report / PDF

## Status

Roadmap #19. Advanced.

## Decisions

- A "Report (PDF)" button in Advanced mode opens a full-page report view,
  then the browser's print dialog, where "Save as PDF" makes the file. No
  PDF library, so nothing is added to the bundle and it works offline.
- Report contents:
  - title, date, app version, the not-advice notice
  - the verdict and headline figures
  - every input
  - both charts, drawn at a fixed print width
  - spending and income by source, every year
  - the methodology summary and the reference figures with their tax year
- Names are shown as entered: this file is for the user.
- Print CSS hides everything except the report. "Close" returns to the app.
