# Plan — 002 extra savings accounts

Breaks `spec/002-extra-savings-accounts.md` into an ordered implementation
sequence inside `index.html` (+ `sw.js`, `test-engine.js`,
`docs/TOOL_DOCUMENTATION.md`). Each step is independently checkable before
moving to the next; steps 1–4 touch the engine/state and must pass
`node test-engine.js` before steps 5–7 (UI) build on top of them.

## 1. Engine data shape (`index.html`, inside the extract markers)

- `makePerson()` (`index.html:622`): remove `isaBalance` / `isaContribution`
  / `isaGrowth`; add `cashIsaBalance/Contribution/Growth`,
  `ssIsaBalance/Contribution/Growth` (defaults carried over from the old
  fields: `25000` / `500` / `5`), `lisaBalance/Contribution/Growth`
  (`0`/`0`/`5`), `otherSavings: []`.
- Second person's override object (`index.html:1343-1351`) updates its
  `isaBalance`/`isaContribution` overrides to `ssIsaBalance`/
  `ssIsaContribution` with the same values (`20000`/`400`), so the existing
  "Add a partner" default is unchanged in total.
- Add `migratePerson()` per spec §2, inside `// ENGINE-EXTRACT-START` /
  `// ENGINE-EXTRACT-END`, directly above or below `projectJoint()`.

## 2. `projectJoint()` rewrite (`index.html:1230-1334`)

Work through the existing function top to bottom, changing only what the
spec calls out:

1. `init(p)`: replace the single `isa`/`mIsaG` pair with `cashIsa`/`ssIsa`/
   `lisa` balances and their three monthly-rate equivalents
   (`mCashIsaG`/`mSsIsaG`/`mLisaG`), plus `otherSavings` as a working copy
   (`p.otherSavings.map(a => ({ ...a }))`, so accumulation/drawdown mutate
   copies, never the React state array).
2. Lump sum (`index.html:1264-1271`): the 25% lump sum still lands in one
   place — put it in `ssIsa` (documented choice, mirrors "opening S&S ISA"
   from the migration in spec §2) rather than splitting it.
3. Inheritance (`index.html:1273`): same treatment — lands in `ssIsa`.
4. Accumulation loop (`index.html:1322-1325`, not-retired branch): three
   monthly loops for `cashIsa`/`ssIsa` (existing pattern) and one for
   `lisa` with the `* 1.25` bonus (spec §3). Add a monthly loop per
   `otherSavings` entry (contribution, no bonus, own growth rate).
5. Retired branch (`index.html:1326-1328`): grow `cashIsa`/`ssIsa`/`lisa`
   and every `otherSavings` entry at their own rate — no contributions,
   matching today's pattern for every account type.
6. Gap-funding (`index.html:1291-1299`): replace the single `isaDraws`
   proportional step with the four-tier loop from spec §5. Build the tier
   list per row from the current `pp` array: tier 0 flattens every retired
   person's `otherSavings` into individual draw instances; tiers 1–3 are
   each retired person's `cashIsa`/`ssIsa`/`lisa` (tier 3 filtered to
   `age >= 60`). Track per-instance draws so `otherSavings` balances can be
   written back individually.
7. Row output (`index.html:1300-1317`): add `p1CashIsa`/`p1SsIsa`/
   `p1Lisa`/`p1OtherSavings` (and `p2*`) alongside the existing
   `p1Isa`/`p2Isa`, where `p1Isa = p1CashIsa + p1SsIsa + p1Lisa` (keeps
   every existing downstream reader — charts, cards — working unchanged
   off `p1Isa`/`totalIsa`). Add `totalOtherSavings` for the depletion check
   and new chart series.
8. Balance write-back after draws (`index.html:1319-1321`): apply each
   tier's draws to the matching `cashIsa`/`ssIsa`/`lisa`/`otherSavings[i]`
   balance instead of the single `x.p.isa -= isaDraws[i]`.

## 3. Depletion check (`index.html:1475`)

Change `r.totalPension + r.totalIsa < 1000` to
`r.totalPension + r.totalIsa + r.totalOtherSavings < 1000`, per spec §7.

## 4. `test-engine.js` — run before touching any UI

- Update the fixed baseline-scenario object literal to the new field names
  (spec §10's last bullet).
- Delete the stale `test-fixtures/individual-baseline.json`, run
  `node test-engine.js --update-baseline` (or whatever flag/comment the
  harness uses — see `test-engine.js` itself) to regenerate it against the
  new engine, then read the diff to confirm it's only the expected field
  renames/zeros, not a behaviour change, before committing it.
- Add the five new checklist items from spec §10 (LISA bonus, LISA
  post-retirement growth-without-draw, LISA age-60 gate, four-tier drawdown
  order, `migratePerson()` old-shape/new-shape/undefined cases).
- Run `node test-engine.js` — every item, old and new, must print `✓`
  before moving on.

## 5. State initialisation (`index.html`, `RetirementCalculator`)

- Wrap both `pick('person1', ...)` / `pick('person2', ...)` calls in
  `migratePerson(...)` (spec §2).
- Add stable `useCallback` handlers for `otherSavings` add/remove/update,
  keyed by `id`, following the existing `field`-name callback pattern
  (`docs/TOOL_DOCUMENTATION.md` §5.3 point 5) — e.g.
  `updatePersonField(personKey, field, value)` already exists for scalar
  fields; add `updateOtherSavings(personKey, id, field, value)`,
  `addOtherSavings(personKey)`, `removeOtherSavings(personKey, id)`.

## 6. UI components (module level, memoised — `index.html`)

- Add `IsaTypeAccount` (label + 3×`SliderWithInput`) and
  `OtherSavingsAccount` (name input + 3×`SliderWithInput` + remove button)
  above `PersonInputs`, matching its existing `React.memo` + prop-shape
  style.
- In `PersonInputs`: replace the current single ISA slider group
  (`index.html:820-848`) with three `IsaTypeAccount`s (Cash / S&S / LISA),
  the card heading changed from "ISA Savings" to "Savings", followed by
  `person.otherSavings.map(...)` and an "+ Add savings account" button.
- Wealth chart (`index.html:1104-1124`) and per-person breakdown cards
  (`index.html:1719-1721`): add the "Other Savings" series/line next to the
  existing Pension/ISA ones, reading `p1OtherSavings`/`p2OtherSavings`
  from §2.7.
- Assumptions text (`index.html:2007`): add the drawdown-order sentence
  from spec §5.
- Warnings memo (`index.html:1496-1508`): add the two ISA/LISA allowance
  checks from spec §6.

## 7. Docs and packaging

- `docs/TOOL_DOCUMENTATION.md`: apply every change listed in spec §9
  (§3.3, §4.1–§4.3, §4.6, §4.7, §5.4, §7).
- `sw.js`: bump `CACHE` to the next version.

## 8. Manual verification (no build step — open `index.html` directly)

Exercise per `CLAUDE.md`'s "no build step" testing convention, since the UI
layer isn't covered by `test-engine.js`:

- Fresh load (no saved state): confirm the "Savings" card shows Cash ISA /
  S&S ISA / LISA / no other-savings rows, with the same opening total as
  before this change.
- Simulate an old save (paste a pre-migration `person1` shape into
  `localStorage` via devtools, reload): confirm no crash and the old ISA
  balance appears under Stocks & Shares ISA.
- Add two "other savings" accounts, remove one, confirm sliders stay
  responsive while dragging (the original performance bug's regression
  check) and the remaining account's `id`/values are intact.
- Push a scenario into retirement with LISA contributions and confirm the
  wealth chart's LISA-inclusive ISA total and the new Other Savings series
  both render.
- Trigger both new warnings (ISA total > £20k, LISA > £4k) and confirm the
  banner text.
- Toggle joint mode on/off, confirm both people's savings cards behave
  identically to individual mode (regression guard, same spirit as the
  existing joint-mode parity check in §5.4).

## 9. PR

Per `CLAUDE.md`'s AI SDLC workflow: open the PR from
`002-extra-savings-accounts` into `main`, referencing
`intent/002-extra-savings-accounts.md`, and move
`intent/002-extra-savings-accounts.md` +
`spec/002-extra-savings-accounts.md` into their `done/` directories in the
same PR.
