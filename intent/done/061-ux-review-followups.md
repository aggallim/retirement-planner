# 061 — UX review follow-ups

## Status

Child of 059. Delivers what is still open from the Notion "UI/UX Form &
Data-Entry Review (Sept 2026)" after v20, which shipped its P0s (030
accessible names and tooltips, 031 thousands separators and
restore-on-blank, 032 autosave flush, failure notice and the misplaced
cleanup).

## What's still open

| Review item | Priority |
|---|---|
| Clamp feedback via a polite live region (silent snapping) | P1 |
| Inline field-level warnings linked to the banner (`aria-describedby`) | P1 |
| Banner: live-region semantics, a count, lines that jump to the field | P1 |
| Collapsible input sections with one-line summaries, plus a jump nav | P1 |
| "Changed from default" markers | (tip in §1) |
| Pending-state dimming with `aria-busy`; announce the verdict on pause | P2 |
| Undo for Reset, `navigator.storage.persist()`, multi-tab `storage` warning | P2 |
| "Last exported" reminder | (tip in §5) |
| Optional first-run quick start for the five essentials | P3 |

## Decisions (made by the agent, per 059)

- **Clamp hint.** When a typed value is out of range, the box snaps as now
  and a short hint shows under the field for four seconds, e.g. "The
  highest is 75, so it's set to 75." Blank or non-numeric input says "Not
  a number, so it's kept at 250,000." The hint sits in an
  `aria-live="polite"` region inside `SliderWithInput`, so it is announced
  once and never interrupts.
- **Inline warnings.** The warnings list becomes structured (text, the
  person, the field it belongs to). Each per-person warning also appears
  as an amber line under its field, linked with `aria-describedby`, and
  stays visible when the banner is dismissed:
  annual allowance → Employer Contribution; State Pension or DB gap →
  Retirement Age; LISA limit and LISA stop age → LISA contribution;
  combined ISA allowance → each ISA contribution that is above zero.
  Household warnings (income below the minimum standard, funds running
  out) link to the Living Standard card and the headline verdict. Not
  `aria-invalid`: these are soft warnings and the clamps already make
  impossible combinations unreachable.
- **Banner.** `role="status"`, a heading "N things to check", and each line
  is a button that scrolls to its field, highlights it and moves focus to
  the input. The icon plus heading means it doesn't rely on colour.
- **Collapsible sections.** Each person's Savings, Pension, Defined Benefit
  pension and State Pension groups become accordions (`aria-expanded`,
  `aria-controls`). Open by default (no change for current users); a
  collapsed group shows a one-line summary such as "£120,000 · £600/mo".
  Open/closed is remembered per device (a convenience, `localStorage`).
  A section holding an inline warning opens itself so the warning is
  never hidden.
- **Jump nav.** A "Jump to" row under the header: buttons on wider
  screens, a `<select>` on phones. Targets: Result, What if, inputs for
  each person, Living costs, Inflation & risk, Charts, Living Standard,
  How we calculate.
- **Changed-from-default marker.** Sliders show a small "edited" dot (with
  text for screen readers, "changed from the default of £X") when the
  value differs from a fresh plan's default. Person 1 and the partner use
  their own defaults.
- **Calculated values** (subtitles like "Outstanding balance today ≈ …")
  are already plain text, not inputs, so no change is needed.
- **Pending state.** While deferred results lag the inputs, the results
  column fades to 80% after a 150 ms delay (so quick work never flickers)
  and sets `aria-busy`. Input is never blocked.
- **Verdict announcement.** A visually hidden polite live region announces
  the headline verdict one second after the inputs stop changing, not on
  every tick.
- **Reset with undo.** Reset no longer reloads the page. It keeps a copy of
  the plan in memory, puts the defaults back, and shows a toast for 10
  seconds with "Undo" and "Download a backup". The confirmation dialog
  stays (it's destructive).
- **`navigator.storage.persist()`** is requested once, silently, after the
  first successful save.
- **Multi-tab.** If another tab saves the plan, a notice offers "Load the
  latest" or "Keep this version" (which saves this tab's plan over it).
- **Last exported.** Export records the date on this device; the Data
  menu shows "Last exported: 4 Oct 2026" or "Not exported yet".
- **Quick start.** First visit only (no saved plan and not dismissed): a
  dialog asks for age, retirement age, pension pot, monthly pension
  contribution and yearly spending, prefilled with the defaults. "Use
  these" applies them; "Skip" keeps the example plan. It never shows again
  on that device either way.
- **Not done:** a log-scale slider (the typed box is already the precise
  route, and a log scale would change drag behaviour everyone is used
  to); skeleton loaders (the review advised against them).
- **Performance (§5.3).** All new components are module-level and
  memoised; handlers stay stable; the per-person warning maps are kept
  referentially stable so one person's drag doesn't re-render the other.

## Delivery

`index.html`; `docs/TOOL_DOCUMENTATION.md` §3 and §5.4; `CHANGELOG.md`;
`USER_CHANGELOG` (user-facing). Verified in a headless browser (Playwright)
for keyboard, clamp, reset/undo, multi-tab and quick-start behaviour.
