# 002 — Extra savings accounts

## Status

Resolved — ready for implementation. Fleshed out from
`intent/002-extra-savings-accounts.md` by resolving the design decisions that
document deliberately left to this stage: per-person data shape, the
localStorage migration mechanism, how the combined ISA/LISA allowance is
enforced, the multi-tier drawdown algorithm (including its interaction with
joint mode's shared gap), how "other savings" surfaces in totals/charts, and
the input-form layout.

## Problem

See `intent/002-extra-savings-accounts.md` — the app currently collapses
every person's ISA-type and non-ISA savings into a single `isaBalance` /
`isaContribution` / `isaGrowth` triple (`index.html:629-631`), so the
projection can't reflect a LISA's 25% bonus or age-60 restriction, can't
show cash growing more slowly than invested savings, and can't warn on
contributions above the real ISA/LISA allowances.

## Outcome

### 1. Data shape

Each person's state object (`makePerson()`, `index.html:622`) drops the three
flat `isa*` fields and gains:

```js
cashIsaBalance: 0,      cashIsaContribution: 0,   cashIsaGrowth: 2,
ssIsaBalance: 25000,    ssIsaContribution: 500,   ssIsaGrowth: 5,
lisaBalance: 0,         lisaContribution: 0,      lisaGrowth: 5,
otherSavings: []        // [{ id, name, balance, contribution, growth }]
```

- `cashIsaGrowth`/`ssIsaGrowth`/`lisaGrowth` keep the existing
  Poor/Average/Aggressive-or-custom-% shape (`ISA_OPTS`, `index.html:758`).
  Stocks & Shares ISA keeps the current default rate (5%); Cash ISA defaults
  to a lower rate (2%, a new "Poor" cash-savings preset) since it is
  deliberately a slower-growing pot; LISA defaults to the same options as
  Stocks & Shares (it's normally invested).
- The default person (`makePerson({ name: 'You' })`) carries its existing
  opening balance forward into `ssIsaBalance: 25000` /
  `ssIsaContribution: 500` — the previous single-field defaults — with
  `cashIsaBalance`/`lisaBalance` defaulting to 0, so a brand-new user sees
  the same total opening position as today.
- `otherSavings` entries get a stable `id` (e.g. `crypto.randomUUID()`, with
  a `Date.now()+Math.random()` fallback for non-secure contexts) generated
  once at creation, used as the React `key` and for add/remove/update
  targeting — never the array index, since removing an earlier item would
  otherwise reassign every later item's identity mid-render.
- `isaTotal` (used everywhere the app currently reads a person's ISA figure —
  breakdown cards, wealth/income charts, depletion check) becomes
  `cashIsaBalance + ssIsaBalance + lisaBalance`, computed once inside
  `projectJoint()`'s per-row output rather than at every call site.

### 2. localStorage migration

Add a pure `migratePerson(saved)` function, placed inside the same
`// ENGINE-EXTRACT-START` / `// ENGINE-EXTRACT-END` block as `projectJoint()`
(intent 001's extraction markers) so `test-engine.js` can exercise it
directly without a DOM.

```js
function migratePerson(saved) {
  if (!saved || saved.ssIsaBalance !== undefined) return saved; // already new shape (or nothing saved)
  const { isaBalance, isaContribution, isaGrowth, ...rest } = saved;
  return {
    ...rest,
    cashIsaBalance: 0,      cashIsaContribution: 0,   cashIsaGrowth: 2,
    ssIsaBalance: isaBalance ?? 0,
    ssIsaContribution: isaContribution ?? 0,
    ssIsaGrowth: isaGrowth ?? 5,
    lisaBalance: 0,         lisaContribution: 0,      lisaGrowth: 5,
    otherSavings: []
  };
}
```

Presence of `ssIsaBalance` is the shape marker: old saves never had it, new
saves always do (even a fresh LISA-less person gets `lisaBalance: 0`
explicitly, never omitted), so the check is unambiguous and needs no version
counter. Call it where `person1`/`person2` state is initialised:

```js
const [person1, setPerson1] = useState(migratePerson(pick('person1', makePerson({ name: 'You' }))));
```

A person with no saved state at all (`pick` returns the `makePerson()`
fallback, already new-shape) passes through unchanged. This is a one-way,
read-time migration — nothing is written back to `localStorage` until the
user's next autosave, which is harmless since the in-memory shape is already
correct from the first render.

### 3. LISA government bonus

Applied only to contributions, monthly, alongside the existing monthly
compounding loop (`index.html:1322-1325`):

```js
for (let m = 0; m < 12; m++) x.p.lisa = x.p.lisa * (1 + x.p.mLisaG) + x.p.cfg.lisaContribution * 1.25;
```

This mirrors the existing lump-sum special case (`docs/TOOL_DOCUMENTATION.md`
§4.2) in spirit: a fixed, non-configurable government top-up applied inside
the engine rather than as a separate input. The bonus applies only while the
person is still contributing (i.e. not yet retired) — LISA contributions
stop at retirement for the same reason pension and other-account
contributions already do (nobody in this model contributes after their
salary stops); growth continues uninterrupted either side of that line, and
either side of age 60.

### 4. LISA age-60 access restriction

The restriction is about **drawability**, not accrual. A retired person's
LISA keeps compounding at `lisaGrowth` every year regardless of age (same as
every other account already does post-retirement); it is simply excluded
from the pool of money the engine can pull from to cover a spending gap
until `age >= 60`. Implemented as an availability flag checked at the
drawdown stage (§5 below), not as a separate accrual path — so there's no
special-cased "frozen" balance representation, just a tier that isn't
eligible yet.

### 5. Fixed drawdown priority

Replaces the current single proportional-ISA-draw step
(`index.html:1292-1299`) with four ordered tiers, each generalising that same
proportional-by-balance mechanic to however many account instances are in
that tier:

```
tier 0: every retired person's otherSavings accounts (flattened, one instance each)
tier 1: every retired person's Cash ISA
tier 2: every retired person's Stocks & Shares ISA
tier 3: every retired person's LISA, but only where age >= 60
```

```js
let gap = Math.max(0, targetExpenses - totalSP - totalPenW);
const draws = []; // { instance, amount } across all tiers, for the row output
for (const tier of tiers) {
  if (gap <= 0) break;
  const available = tier.filter(instance => instance.eligible); // LISA: age >= 60
  const tierTotal = available.reduce((s, x) => s + x.balance, 0);
  if (tierTotal <= 0) continue;
  for (const instance of available) {
    const draw = Math.min(instance.balance, gap * (instance.balance / tierTotal));
    draws.push({ instance, draw });
  }
  gap -= available.reduce(...); // total drawn this tier
}
```

This is a direct generalisation of the existing proportional-by-balance
logic, applied tier-by-tier instead of once — it keeps joint mode's existing
character (a shared household gap drawn proportionally across whoever has
money available in the current tier, whether that's one person or both)
rather than introducing a new person-vs-person ordering rule the intent
never asked for. Per-account-type ordering (other → cash → S&S → LISA) is
the only new ordering; cross-person behaviour inside a tier is unchanged
from today's ISA-draw code.

**Visible in the UI**: add a one-line explainer next to the existing "Safe
withdrawal rate (4% rule)" assumptions text (`index.html:2007`), e.g. "Any
remaining spending gap is drawn from other savings first, then Cash ISA,
then Stocks & Shares ISA, then the LISA (from age 60)." — satisfies the
intent's requirement that the order not be left implicit.

### 6. Combined ISA/LISA allowance — warning, not a hard cap

Resolves the intent's "capped/warned" wording as **warning-only**, unlike
the pension allowance (`docs/TOOL_DOCUMENTATION.md` §4.1), which *is*
hard-capped in the engine. The two cases aren't symmetric: pension employee +
employer contributions are already a single combined number feeding one
balance, so capping it has one unambiguous effect. Cash ISA, Stocks &
Shares ISA and LISA are three separately-configured contributions feeding
three independently-growing balances — capping the combined figure would
require picking, unprompted, which account absorbs the reduction, which is a
modelling judgement call the intent doesn't make. A warning leaves the
user's three numbers exactly as entered (consistent with §4.5's general
"cautious rather than clever" posture) while still surfacing the problem
loudly, which is what the intent's underlying complaint ("can't warn a user
who's inadvertently modelled contributions above the real allowances") asks
for.

Extend the existing `warnings` memo (`index.html:1496-1508`) inside its
per-person `check()` function:

```js
const isaTotal = (p.cashIsaContribution + p.ssIsaContribution + p.lisaContribution) * 12;
if (isaTotal > 20000) w.push(`${label}: ISA contributions exceed £20,000 annual allowance`);
if (p.lisaContribution * 12 > 4000) w.push(`${label}: LISA contributions exceed £4,000 annual allowance`);
```

Both figures come from `docs/TOOL_DOCUMENTATION.md` §4.7, already correct
and unchanged. Free-form `otherSavings` accounts are never included in
either check, per the intent's outcome §5.

### 7. Totals, charts and the depletion check

"ISA" everywhere the app already shows it (breakdown cards, wealth/income
chart series, `docs/TOOL_DOCUMENTATION.md` terminology) means
`cashIsaBalance + ssIsaBalance + lisaBalance`, per intent outcome §1 — no UI
label changes needed there. `otherSavings` is **not** part of that figure
(it's a household's non-ISA money, e.g. Premium Bonds), but it is real
wealth and is drawn from first (§5 above), so it must appear in every place
"can this plan run out of money" is decided:

- Wealth chart and per-person breakdown cards gain a third stacked
  value/line, "Other Savings" (summed across a person's `otherSavings`
  array), alongside the existing Pension and ISA series.
- The longevity/depletion check (`docs/TOOL_DOCUMENTATION.md` §4.6,
  `index.html:1475`) changes from `totalPension + totalIsa < 1000` to
  `totalPension + totalIsa + totalOtherSavings < 1000` — otherwise a plan
  funded mostly through Premium Bonds would be reported as depleted while
  still holding money the engine is actively drawing from.

### 8. UI layout

New module-level, memoised components (alongside `SliderWithInput` /
`PersonInputs`, per `CLAUDE.md`'s performance rule — nothing here is
declared inside `RetirementCalculator` or `PersonInputs`):

- **`IsaTypeAccount`** — renders one fixed sub-account's three
  `SliderWithInput`s (balance/contribution/growth) under a small label
  ("Cash ISA" / "Stocks & Shares ISA" / "Lifetime ISA (LISA)"). `PersonInputs`
  renders three of these, always visible (no accordion/collapse state) —
  the existing card already scrolls fine at today's field count, and adding
  state to expand/collapse would be the kind of UI complexity the intent's
  non-goals explicitly rule out ("no redesign of the input UI beyond what
  these fields need").
- **`OtherSavingsAccount`** — one free-form row: a text input for the name,
  the same three sliders, and a "×" remove button, keyed on the account's
  `id`. Takes `onChange(id, field, value)` and `onRemove(id)` as stable
  `useCallback`s from `PersonInputs`, following the existing `field`-name
  (not fresh-arrow) callback pattern that makes memoisation hold
  (`docs/TOOL_DOCUMENTATION.md` §5.3, point 5).
- Below the three fixed accounts, `PersonInputs` renders
  `person.otherSavings.map(a => <OtherSavingsAccount .../>)` followed by a
  "+ Add savings account" button that appends a new entry with a fresh `id`
  and zeroed fields.
- The card heading changes from "ISA Savings" to "Savings", covering all
  four account kinds.

### 9. `docs/TOOL_DOCUMENTATION.md` updates

- §3.3 ("What each section covers") — the "ISA savings" row becomes
  "Savings", noting it now covers Cash ISA / Stocks & Shares ISA / LISA /
  free-form other savings, still per-person.
- §4.1 (Accumulation) — note the LISA 25% contribution bonus.
- §4.2/§4.3 (At retirement / Decumulation) — replace the single "ISA tops up
  the gap" step with the four-tier order from §5 above, and the age-60 LISA
  gate.
- §4.6 (Longevity test) — depletion condition includes other savings (§7
  above).
- §4.7 (Reference figures) — add rows: LISA annual contribution limit
  (£4,000, 2026/27), LISA government bonus (25%), LISA minimum access age
  (60).
- §5.4 (Verification) — add the new checklist items from §10 below.
- §7 (Known limitations) — note the LISA first-home exception is not
  modelled (carried over from the intent's non-goals) and that "other
  savings" accounts are unlimited in number, which is intentional.

### 10. `test-engine.js` additions

New independently-labelled checks (same `✓`/`✗` pattern as the existing
checklist):

- LISA contributions receive exactly a 25% top-up before compounding, for
  an isolated single-contribution scenario computed by hand.
- A retired person's LISA balance keeps growing at `lisaGrowth` every year
  even though it isn't drawn.
- A person under 60 with an underfunded plan and a non-zero LISA balance
  never has their LISA balance reduced by a draw; the same scenario at
  age ≥ 60 does draw from it once earlier tiers are exhausted.
- Drawdown order: a scenario with money in all four tiers drains
  `otherSavings` to zero before touching Cash ISA, drains Cash ISA before
  Stocks & Shares ISA, and drains Stocks & Shares ISA before LISA.
- `migratePerson()` on an old-shape saved object produces
  `ssIsaBalance`/`ssIsaContribution`/`ssIsaGrowth` equal to the old
  `isaBalance`/`isaContribution`/`isaGrowth`, `cashIsaBalance`/`lisaBalance`
  at 0, and `otherSavings` as `[]`; on an already-new-shape object (or
  `undefined`) it's a no-op (returns the input unchanged, or `undefined`
  unchanged).
- Individual-mode regression baseline (`test-fixtures/individual-baseline.json`)
  is regenerated against the new field names/shape and re-committed —
  existing byte-for-byte comparison logic is unchanged, only the fixed input
  scenario literal in `test-engine.js` moves from `isaBalance`/
  `isaContribution`/`isaGrowth` to `ssIsaBalance`/`ssIsaContribution`/
  `ssIsaGrowth` (plus explicit zeros for `cashIsaBalance`/`lisaBalance` and
  `otherSavings: []`), per the "regenerating is a deliberate, reviewed act"
  rule intent 001 already established.

## Non-goals

Carried over unchanged from `intent/002-extra-savings-accounts.md`:

- No joint/shared account — every account belongs to one person.
- No modelling of the LISA first-home exception.
- No changes to income tax treatment — ISA-type and LISA withdrawals stay
  tax-free.
- No further UI redesign beyond what's specified in §8 above (no
  accordion/collapse state, no tabs).

Additionally out of scope for this spec:

- No limit on the number of free-form `otherSavings` accounts a person can
  add.
- No renaming/reordering UI for `otherSavings` entries beyond the name text
  field and the remove button.

## Constraints

Carried over from the intent, made concrete above:

- `SliderWithInput`, `PersonInputs`, `IsaTypeAccount` and
  `OtherSavingsAccount` all stay module-level and memoised; array
  add/remove/update uses id-keyed `useCallback`s, not fresh inline arrows,
  per §8.
- `projectJoint()` and the new `migratePerson()` both live inside the
  `// ENGINE-EXTRACT-START` / `// ENGINE-EXTRACT-END` markers so
  `test-engine.js` can exercise both without a browser DOM.
- `docs/TOOL_DOCUMENTATION.md` is updated in the same PR as the code change,
  per `CLAUDE.md` — it is the spec of record for calculation logic.
- Single-file PWA constraint holds; bump `CACHE` in `sw.js` on ship.
- Per the AI SDLC workflow, this PR also moves
  `intent/002-extra-savings-accounts.md` and this spec file into
  `intent/done/` / `spec/done/` once implemented and merged.

## Open questions

None remaining — every point intent 002 deliberately left open (data shape,
migration, allowance enforcement mechanism, drawdown algorithm across tiers
and people, other-savings' place in totals/charts/depletion, and input
layout) is resolved above.
