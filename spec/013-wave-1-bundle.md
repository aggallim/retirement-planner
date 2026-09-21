# 013 — Wave 1 bundle: today's-money, confidence language, Explain-this,
# plain-language pass, privacy messaging

## Status

Resolved — ready for implementation. Fleshed out from five already-grilled
intent files, per the bundling decision recorded in
`intent/013-today-vs-nominal-money.md`'s Status section: one shared
spec/plan/branch/PR/build version covering roadmap items 9, 20, 17, 18 and
10. This spec turns each intent's `Outcome` decisions into concrete,
code-level mechanics — it does not re-derive or second-guess any decision
already made in:

1. `intent/013-today-vs-nominal-money.md` — today's-money dual-display,
   PLSA gauge caveat, chart tooltip total.
2. `intent/014-confidence-language.md` — hedged summary-card captions and
   `VerdictHero` insight lines.
3. `intent/015-explain-this-breakdown.md` — Pot-figure "Explain this"
   breakdown.
4. `intent/016-plain-language-pass.md` — `VerdictHero`'s
   sequence-of-returns-risk rewording, plus a plain-language check on
   013/014/015's own new copy.
5. `intent/017-privacy-feature-messaging.md` — footer + Data-menu privacy
   statement, new `Lock` icon.

Where an intent left an implementation detail open (an exact helper
signature, an exact insertion point, exact copy), this spec resolves it and
flags the resolution — see "Open questions" at the end, and the inline
"resolves an open point" notes in each section below.

## Problem

See the five intent files for the full "what's there today" fact-finding;
not repeated here. The concrete code locations this spec edits, as they
exist on `main` today (post `spec/done/012-assumptions-panel.md`):

- `formatCurrency`/`formatCurrencyK` (`index.html:672-678`), `PLSA`
  (`index.html:679-689`).
- `household` `useMemo` (`index.html:2383-2398`) — `totalPot`,
  `pensionIncome`, `statePension`, `annualIncome`, `year` (i.e. `bothYear`).
- `livingStandard`/`bands`/`gPos` (`index.html:2399`, `2479-2482`).
- `ChartTooltip` (`index.html:1310-1329`), `WealthChart`
  (`index.html:1347-1556`), `IncomeChart` (`index.html:1557-1624`) — all
  module-level, memoised; both charts currently invoke
  `React.createElement(ChartTooltip, null)` with no extra props.
- `VerdictHero` (`index.html:1630-1712`) — headline hero; its insight lines
  are built at `index.html:1675-1678`, its caveat sentence at
  `index.html:1705-1711`.
- The full-size 3-card row: Retirement Years (couple-only) / Pot / Income /
  Living Standard, `index.html:2698-2750`. The Pot card is
  `index.html:2714-2726`; the Income card is `index.html:2727-2738`.
- The sticky mobile recap bar, `index.html:2630-2652` — **out of scope**,
  stays nominal-only per intent 013 decision 1.
- The per-person breakdown grid (couple mode),
  `index.html:2750-2797` — **out of scope**, stays nominal-only per intent
  013 decision 1.
- The "Living Standard" detail card, `index.html:2974-3047` — the big
  income figure and "Pension £X · State £Y" sub-line at
  `index.html:2982-2996`; the PLSA gauge and band labels at
  `index.html:2996-3041`; the categorical verdict box at
  `index.html:3041-3047`.
- `projectJoint()` (`index.html:1807-1979`) — per-year rows carry ending
  balances and that year's withdrawal only; a row for year `y` reflects
  balances *before* that year's growth/contribution/withdrawal are applied
  (`data.push(row)` at `index.html:1943`, mutations follow after). Monthly
  contributions only apply `if (!x.retired)` (`index.html:1956-1965`), and
  pension contributions are capped at `cap/12` where `cap = 60000`
  (`index.html:1964`).
- `planSucceeds`/`findSupportableDelta` (`index.html:1980-2029`) — the last
  functions inside the second `ENGINE-EXTRACT-START`/`END` span
  (`index.html:1768`/`2030`), which `tests/test-engine.js` pulls into a
  sandboxed `vm` context.
- `scrollAndHighlight`/`nameAtAge`/`nameValue`
  (`index.html:2037-2051`) — module-level, DOM-layer helpers *outside* the
  engine-extraction span (they touch `document`).
- `showAssumptions`/`isScrolled` state (`index.html:2204-2205`) — the
  existing collapse/expand precedent this spec's item 3 reuses.
- The icon set (`index.html:364-646`) — hand-copied inline SVG components,
  e.g. `AlertTriangle`/`CheckCircle` (`index.html:420-447`); no
  `Lock`/`Shield` icon exists.
- `SettingsMenu` (`index.html:2055-2180`) — the ⚙ Data menu; its `menu`
  view starts at `index.html:2117`.
- The footer (`index.html:3079-3085`).
- `USER_CHANGELOG` (`index.html:853-898`, currently `v11` newest) and
  `sw.js`'s `CACHE` (currently `'retirement-planner-v11'`).
- `docs/TOOL_DOCUMENTATION.md` — current section numbers: §3.4 "Reading the
  outputs" (`:101-108`), §3.7 "Export and import" (`:127-135`), §4.7
  "Reference figures used" (`:207-222`), §5.4 "Verification" (`:264-284`),
  §7 "Known limitations" (`:317+`).

## Outcome

### 1. Item 013 — today's-money vs. nominal money

#### 1.1 `deflate()` and `formatToday()` — new module-level helpers

Two small, pure, display-layer functions, placed alongside the other
module-level display helpers introduced by `spec/done/012-assumptions-panel.md`
(`scrollAndHighlight`/`nameAtAge`/`nameValue`, `index.html:2037-2051`) —
**outside** the `ENGINE-EXTRACT` span, since neither touches the engine and
neither needs `tests/test-engine.js` coverage (this is arithmetic on
already-computed values, not calculation logic):

```js
// Discounts a nominal figure from its target calendar year back to
// CURRENT_YEAR ("today's money"), at whatever single inflation rate is
// passed in (the household's d.infl — the only inflation figure the model
// has; intent/013 decision 5). Pure and display-layer only — projectJoint()
// and its output shape are untouched (intent/013 decision 7). Takes
// inflationRate explicitly rather than closing over d.infl so it stays a
// plain module-level function, matching every other helper here.
const deflate = (nominalValue, targetYear, inflationRate) =>
  nominalValue / Math.pow(1 + inflationRate / 100, Math.max(0, targetYear - CURRENT_YEAR));

// Rounds to the nearest £100 and prefixes "≈" (intent/013 decision 6) — a
// deflated figure carries one more assumption (the inflation rate) than
// the exact nominal figure it's derived from, so it shouldn't be shown
// with formatCurrency's same whole-pound precision.
const formatToday = v => `≈ ${formatCurrency(Math.round((v || 0) / 100) * 100)}`;
```

> **Resolves an open point:** the intent's own illustrative signature was
> `deflate(nominalValue, targetYear)`. A third parameter (`inflationRate`)
> is added here because a pure, module-level function per intent decision 7
> can't close over `d.infl` — it has to be passed in. Every call site below
> passes `d.infl` explicitly.

#### 1.2 Full 3-card row — Pot and Income cards get a today's-money line

Both cards' primary `<p>` figure (`index.html:2722-2724` for Pot,
`index.html:2734-2736` for Income) is followed by a **new** `<p>` — the
today's-money line — inserted directly above the card's existing caption
`<p>` (which item 2 below also edits). See §6 "Pot card final layout" for
the Pot card's full, final structure with all three bundled additions in
place; the Income card gets only this line (item 013) and its caption edit
(item 014):

```jsx
React.createElement("p", {
  className: "text-sm font-semibold text-slate-500 tabular mt-0.5"
}, formatToday(deflate(household.totalPot, household.year, d.infl)), " in today's money")
```

(Income card: same shape, `household.annualIncome` in place of
`household.totalPot`.)

The Living Standard card in this same row is unchanged — it shows a
categorical label (`livingStandard.level`), not a currency figure, so
there's nothing to deflate.

#### 1.3 Living Standard detail card — income figure gets the same treatment

`index.html:2982-2986`, inside the card's `text-center` block. This is
"site 4" from the intent's Problem section — identified there by its
neighbouring "Pension £X · State £Y" sub-line, but the figure that actually
gets dual-displayed is the big income figure that sub-line sits under
(`household.annualIncome`), for the same reason site 1's Pot/Income cards
do: it's the headline number, not the sub-breakdown. The Pension/State
sub-line itself stays nominal-only — it already mirrors a total that's now
getting dual-display just above it, the same reasoning the intent uses to
exclude the per-person grid (decision 1).

```jsx
React.createElement("p", {
  className: "text-5xl font-bold gradient-text mb-1 tabular"
}, formatCurrency(household.annualIncome)),
React.createElement("p", {
  className: "text-sm font-semibold text-slate-500 tabular mb-1"
}, formatToday(deflate(household.annualIncome, household.year, d.infl)), " in today's money"),
React.createElement("p", {
  className: "text-slate-500 text-sm"
}, /* item 014's hedged caption — see §2.2 */),
/* existing Pension £X · State £Y sub-line, unchanged */
```

#### 1.4 PLSA gauge — permanent caveat line

Added as a new sibling at the end of the Living Standard detail card's
`space-y-6` container (`index.html:2979`), after the existing categorical
verdict box (`index.html:3041-3047` — "`{level} Living Standard` /
`PLSA {one|two}-person household...`") closes:

```jsx
React.createElement("p", {
  className: "text-xs text-slate-400 text-center mt-2"
}, "The income above is shown in future £, before adjusting for inflation. The PLSA bands are today's-money figures, so the two aren't directly comparable.")
```

Plain wording, not "nominal"/"deflated" — reviewed against item 016's
plain-language standard (§4.2). No calculation change: this is
`docs/TOOL_DOCUMENTATION.md` §7 known-limitation #6 ("PLSA bands are not
inflated forward") stated visibly in the UI for the first time, not fixed
(intent/013 decision 4; roadmap item #23 is the actual fix, explicitly out
of this bundle).

#### 1.5 Chart tooltip — one "Total (today's money)" row per hover

`ChartTooltip` (`index.html:1310-1329`) gains two new props and one new
row, appended after the existing per-series rows:

```jsx
const ChartTooltip = ({
  active,
  payload,
  label,
  inflationRate,
  excludeFromTotal = []
}) => {
  if (!active || !payload || !payload.length) return null;
  const visible = payload.filter(e => e.value !== 0);
  const total = payload.reduce(
    (s, e) => excludeFromTotal.includes(e.name) ? s : s + e.value,
    0
  );
  return React.createElement("div", {
    className: "bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl border border-slate-700"
  },
    React.createElement("p", { className: "font-bold mb-2 text-slate-200" }, label),
    visible.map((e, i) => React.createElement("p", {
      key: i,
      className: "text-sm flex items-center justify-between gap-4",
      style: { color: e.color }
    }, React.createElement("span", null, e.name),
       React.createElement("span", { className: "font-semibold tabular" }, formatCurrency(Math.abs(e.value))))),
    React.createElement("p", {
      className: "text-sm flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-700 font-bold text-white"
    }, React.createElement("span", null, "Total (today's money)"),
       React.createElement("span", { className: "tabular" }, formatToday(deflate(total, label, inflationRate))))
  );
};
```

> **Resolves an open point:** the intent says the total is "the sum of that
> year's payload values" without addressing `IncomeChart`'s `Expenses`
> series, which is a *target* reference line, not part of income. Summing
> it in would produce a "total" that adds two different things (income +
> spending target) and would actively confuse rather than clarify — against
> the item's own purpose. `excludeFromTotal` is added so `IncomeChart` can
> exclude `'Target Expenses'` from the sum while `WealthChart` (whose
> `Mortgage Debt` series is legitimately part of net wealth, already stored
> as a negative value) passes nothing and nets it in as-is.

`label` is the hovered `year` (Recharts passes the `XAxis`'s `dataKey`
value for the point under the cursor — both charts use `dataKey: "year"`),
so it's already the correct `targetYear` for `deflate` with no lookup
needed.

**Call-site changes** — both `WealthChart` and `IncomeChart` gain a new
`inflationRate` prop, threaded through to their `Tooltip`'s `content`:

- `WealthChart` (`index.html:1347-1356` signature, `index.html:1449-1450`
  Tooltip): add `inflationRate` to the destructured props; change
  `content: React.createElement(ChartTooltip, null)` to
  `content: React.createElement(ChartTooltip, { inflationRate })`.
- `IncomeChart` (`index.html:1557-1560` signature, `index.html:1584-1585`
  Tooltip): add `inflationRate` to the destructured props; change to
  `content: React.createElement(ChartTooltip, { inflationRate, excludeFromTotal: ['Target Expenses'] })`.
- Both call sites in `RetirementCalculator` (`index.html:2956-2964` for
  `WealthChart`, `index.html:2971-2973` for `IncomeChart`) gain
  `inflationRate: d.infl`.

The chart axes, series and legends are otherwise completely unchanged —
this is tooltip-only, per intent 013 decision 3.

### 2. Item 014 — confidence/hedge language

Pure string-literal edits; no new state, no new props beyond what item 013
already threads.

#### 2.1 Pot and Income summary-card captions

- **Pot card** (`index.html:2725-2726`): the existing caption
  `"When ", isCouple ? 'both retired' : 'retired', " (", household.year, ")"`
  becomes:
  ```jsx
  "Under these assumptions — when ", isCouple ? 'both retired' : 'retired', " (", household.year, ")"
  ```
- **Income card** (`index.html:2737-2738`): `"Sustainable, year one"`
  becomes `"Under these assumptions, sustainable in year one."`

#### 2.2 Living Standard detail card caption

`index.html:2985-2986`: `"Sustainable annual income, first year ", isCouple ? 'both' : '', " retired"`
becomes:
```jsx
"Under these assumptions, sustainable annual income, first year ", isCouple ? 'both' : '', " retired"
```

(This is the caption placeholder left open in §1.3 above.)

#### 2.3 `VerdictHero` insight lines

`index.html:1675-1678`, the `insights` array construction:

```js
const insights = [
  succeeds
    ? 'Under these assumptions, your pot is projected to last beyond your plan horizon.'
    : `Under these assumptions, your pot is projected to run out in ${fundedTo} — ${planEnd - fundedTo} year${planEnd - fundedTo === 1 ? '' : 's'} before your plan horizon of ${planEnd}.`
];
if (supportableDelta !== null && supportableDelta < 0) {
  insights.push(`Under these assumptions, you have a ${-supportableDelta}-year buffer past your target retirement age${isCouple ? 's' : ''}.`);
}
```

Each line now opens with the exact "Under these assumptions" phrase item
011 already established for the headline sentence (intent 014 decision 2
— reuse, don't invent parallel wording). The headline sentence itself
(`index.html:1665-1674`) already uses this phrasing and is untouched. The
status badge (`index.html:1683-1689`, "On track"/"Needs attention") is
untouched — decision 3, badge stays plain and confident. The warning
banner (`index.html:2654-2668`) is untouched — decision 1, deliberately
stays blunt.

### 3. Item 015 — "Explain this" breakdown on the Pot figure

#### 3.1 `computePotBreakdown()` — new module-level reconstruction helper

Placed **inside** the existing second `ENGINE-EXTRACT-START`/`END` span
(`index.html:1768`/`2030`), directly after `findSupportableDelta`
(`index.html:2029`) and before the `ENGINE-EXTRACT-END` marker — unlike
`deflate`/`formatToday` (§1.1), this one needs `tests/test-engine.js`
coverage (see §11), so it has to live where that harness's `vm` extraction
already picks up `CURRENT_YEAR`, `projectJoint`, `planSucceeds` and
`findSupportableDelta`.

```js
// Post-hoc reconstruction of the Pot figure's accumulation history for the
// "Explain this" breakdown (intent/015). Walks known INPUT figures (not
// projectJoint()'s internal per-account state) plus the already-computed
// per-year data array — projectJoint() itself and its output shape are
// completely untouched (intent/015 decision 3; same constraint as 013/014).
// A separate function from deflate() — no today's-money treatment here
// (intent/015 decision 6). people is [person1] or [person1, person2].
function computePotBreakdown(people, projections, bothYear) {
  const cap = 60000; // pension annual allowance, same cap projectJoint() applies
  let startingBalance = 0;
  let contributions = 0;
  people.forEach(p => {
    startingBalance += p.pensionPot + p.cashIsaBalance + p.ssIsaBalance + p.lisaBalance
      + (p.otherSavings || []).reduce((s, a) => s + a.balance, 0);
    // A person only contributes up to their own retirement — bothYear is
    // defined as the LATER of the two retirement years, so every person's
    // own retirement always falls at or before bothYear; no min() needed.
    const years = Math.max(0, p.retirementAge - p.currentAge);
    const pensionMonthly = Math.min(p.pensionContribution + p.employerContribution, cap / 12);
    contributions += pensionMonthly * 12 * years;
    contributions += p.cashIsaContribution * 12 * years;
    contributions += p.ssIsaContribution * 12 * years;
    contributions += p.lisaContribution * 1.25 * 12 * years; // 25% government bonus, same as projectJoint()
    contributions += (p.otherSavings || []).reduce((s, a) => s + a.contribution * 12 * years, 0);
  });
  let withdrawals = 0;
  for (const r of projections) {
    if (r.year >= bothYear) break; // bothYear's own row is pre-that-year's-drawdown
    withdrawals += r.pensionWithdrawal + r.isaWithdrawal + r.otherSavingsWithdrawal;
  }
  const endRow = projections.find(r => r.year === bothYear) || projections[projections.length - 1];
  const totalPot = endRow.totalPension + endRow.totalIsa + endRow.totalOtherSavings;
  const growth = totalPot - startingBalance - contributions + withdrawals;
  return { startingBalance, contributions, growth, withdrawals, totalPot };
}
```

`endRow`/`totalPot` deliberately mirror the `household` `useMemo`'s own row
lookup (`index.html:2384-2385`) exactly, so `potBreakdown.totalPot` and
`household.totalPot` are guaranteed identical rather than two
independently-written lookups that could drift.

`growth` is a residual by construction, so the reconciliation identity
(`startingBalance + contributions + growth − withdrawals === totalPot`)
holds algebraically for *any* `contributions`/`withdrawals` values — the
useful thing the checklist item in §11 verifies is that this
implementation's `startingBalance`/`contributions`/`withdrawals` are each
computed correctly against known fixtures (matching `pensionMonthly`'s cap
and the LISA bonus, matching the actual per-person years-of-contribution),
not the tautological identity itself.

#### 3.2 `showPotBreakdown` state, button and panel

New `useState` boolean, declared alongside `showAssumptions`/`isScrolled`
(`index.html:2204-2205`):

```js
const [showPotBreakdown, setShowPotBreakdown] = useState(false);
```

New `useMemo`, declared alongside `household`/`livingStandard`
(`index.html:2383-2399`), depending on it:

```js
const potBreakdown = useMemo(
  () => computePotBreakdown(isCouple ? [d.p1, d.p2] : [d.p1], projections, household.year),
  [d.p1, d.p2, isCouple, projections, household.year]
);
```

JSX — see §6 for the exact position within the Pot card. The trigger
button reuses the existing `ChevronUp`/`ChevronDown` collapse/expand
convention (`showAssumptions`'s own pattern, `index.html:3050-3058`), scaled
to card size rather than a full section header (intent 015 decision 2 — no
new disclosure pattern):

```jsx
React.createElement("button", {
  type: "button",
  onClick: () => setShowPotBreakdown(v => !v),
  className: "mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
}, "Explain this ", showPotBreakdown
    ? React.createElement(ChevronUp, { className: "h-3.5 w-3.5" })
    : React.createElement(ChevronDown, { className: "h-3.5 w-3.5" }))
```

The panel — four aggregate lines, always all four rendered when expanded
(intent 015 decision 5, zero-value lines stay visible), nominal only
(decision 6):

```jsx
showPotBreakdown && React.createElement("div", {
  className: "mt-2 pt-2 border-t border-slate-100 space-y-1 text-xs"
}, [
  ['Starting balance', potBreakdown.startingBalance],
  ['Contributions', potBreakdown.contributions],
  ['Growth', potBreakdown.growth],
  ['Withdrawals', potBreakdown.withdrawals]
].map(([label, value]) => React.createElement("div", {
  key: label,
  className: "flex items-center justify-between"
}, React.createElement("span", { className: "text-slate-500" }, label),
   React.createElement("span", { className: "font-semibold text-slate-900 tabular" }, formatCurrency(value)))))
```

No breakdown for Income, Living Standard, or the per-person grid (intent
015 decision 1) — this button/panel exists only on the Pot card.

### 4. Item 016 — plain-language terminology pass

#### 4.1 `VerdictHero`'s caveat sentence — reword, move the jargon into a tooltip

`index.html:1705-1711`. The visible sentence drops "sequence-of-returns
risk"; the term and its explanation move into an `Info`-icon tooltip using
the exact `tooltip-trigger`/`tooltip-content` markup `SliderWithInput`
already uses (`index.html:936-941`) — reusing the existing hover-tooltip
convention verbatim, not a new disclosure pattern (intent 016 decision 2):

```jsx
React.createElement("p", {
  className: "text-xs text-slate-500 mt-3"
},
  "Based on a fixed average return, no tax on retirement income, and no allowance for a bad run of returns early in retirement",
  " ",
  React.createElement("span", { className: "tooltip-trigger relative inline-flex align-text-top" },
    React.createElement(Info, { className: "h-3 w-3 text-slate-400 cursor-help" }),
    React.createElement("span", {
      className: "tooltip-content absolute left-0 bottom-full mb-2 w-56 bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-xl z-20 font-normal"
    }, "Sometimes called \"sequence-of-returns risk\" — a poor run of returns in your first few retirement years does more damage than the same average return spread evenly, because you're drawing down your pot at the same time.")
  ),
  " — see Known limitations in the ",
  React.createElement("button", {
    type: "button",
    onClick: () => scrollAndHighlight('assumptions-panel'),
    className: "underline hover:text-slate-700"
  }, "Assumptions panel"),
  "."
)
```

The existing "Assumptions panel" scroll-link is unchanged.
`docs/TOOL_DOCUMENTATION.md`'s own use of "sequence-of-returns risk" (§7,
known limitation #4) is untouched — decision 3, developer documentation is
a different audience.

#### 4.2 Review of 013/014/015's own new copy

Per intent 016 decision 1's third bullet, this bundle's other new
user-facing strings are checked against the same plain-language-plus-tooltip
standard before implementation, not just after:

- **013's "in today's money" / "Total (today's money)" lines** — already
  plain; "nominal"/"deflated" never appear in user-facing copy (only as
  internal function/variable names).
- **013's PLSA gauge caveat (§1.4)** — drafted without "nominal": "shown in
  future £, before adjusting for inflation" in place of a more technical
  phrasing.
- **014's hedge captions and insight lines (§2)** — reuse item 011's
  existing "Under these assumptions" phrase verbatim; no new terms
  introduced.
- **015's "Starting balance / Contributions / Growth / Withdrawals"
  labels** — already plain, everyday personal-finance vocabulary; no
  tooltip needed (unlike "sequence-of-returns risk", none of the four is a
  technical term that obscures its own meaning).

No changes were needed as a result of this pass beyond what §1.4 already
reflects — flagged here as the explicit "final pass" intent 016 decision 1
calls for, not skipped.

### 5. Item 017 — privacy as a visible product feature

#### 5.1 New `Lock` icon

Added to the inline icon set (`index.html:364-646`), following the exact
convention every existing icon uses (e.g. `AlertTriangle`,
`index.html:420-433`) — a hand-copied lucide `lock` path, module-level,
placed alongside the other icons (e.g. directly after `Settings`,
`index.html:588-602`):

```jsx
const Lock = ({ className }) => React.createElement("svg", {
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  dangerouslySetInnerHTML: {
    __html: "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /><path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />"
  }
});
```

#### 5.2 Footer line

`index.html:3079-3085`. A third `<p>` is added after the existing two:

```jsx
React.createElement("footer", {
  className: "bg-slate-900 text-white mt-16 py-8 text-center"
},
  React.createElement("p", { className: "text-slate-400" },
    "UK Retirement Planner • For illustrative purposes only • Not financial advice"),
  React.createElement("p", { className: "text-slate-500 text-sm mt-2" },
    "Based on 2026/27 UK tax year allowances and PLSA Retirement Living Standards"),
  React.createElement("p", { className: "text-slate-500 text-sm mt-2 flex items-center justify-center gap-1.5" },
    React.createElement(Lock, { className: "h-3.5 w-3.5 flex-shrink-0" }),
    "Your data stays on this device — no account, no upload, no bank connection, no analytics.")
)
```

#### 5.3 Data-menu fuller explanation

`SettingsMenu`'s `menu` view (`index.html:2117+`). A new block is inserted
as the first child of that view's `React.Fragment`, directly before the
existing `"This file contains your personal financial figures..."` warning
`<div>` (`index.html:2117-2121`) — placed first since it explains *why*
export/import is safe to use, before the controls themselves:

```jsx
React.createElement("div", {
  className: "flex items-start gap-2 pb-2 border-b border-slate-100"
},
  React.createElement(Lock, { className: "h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" }),
  React.createElement("p", { className: "text-xs text-slate-500" },
    "Everything you enter stays in this browser. No account, no upload, no bank connection, and no analytics or tracking — nothing is sent anywhere unless you choose to export a file yourself.")
)
```

Message scope includes "no analytics" in both placements, beyond the
roadmap's own literal wording (intent 017 decision 3) — true today (fact-
checked in the intent: no `fetch`/`XMLHttpRequest`/analytics calls exist
anywhere in the app), and directly reinforces the differentiator. Neither
placement claims zero network activity — Google Fonts loading is
unaffected and unmentioned, per the intent's own non-goal.

No new prominent UI element near the top of the input form (intent 017
decision 1, non-goal) — flagged there as a possible future follow-up, not
built here.

### 6. Pot card final layout (013 + 014 + 015 combined)

The Pot card (`index.html:2714-2726` today) accumulates one addition from
each of three items. In final source order, top to bottom:

1. **Header row** — unchanged: label ("Combined Pot"/"Total Pot") +
   `PiggyBank` icon.
2. **Primary nominal figure** — unchanged: `formatCurrency(household.totalPot)`,
   `text-2xl font-bold`.
3. **013 — today's-money line** (§1.2): `≈ £X in today's money`,
   `text-sm font-semibold text-slate-500`. Placed immediately under the
   primary figure because it answers the same question the eye is already
   on ("what is this number worth") — the closest possible pairing.
4. **014 — hedged caption** (§2.1): `Under these assumptions — when both
   retired (2058)`, `text-xs text-slate-500 mt-1` (the card's existing
   caption style, edited in place — not a new line).
5. **015 — "Explain this" button** (§3.2): small chevron-button,
   `text-xs`, `mt-3` — visually separated from the two figures above it by
   its own top margin, reads as "more detail available" rather than
   another data point competing with the headline number.
6. **015 — breakdown panel**, conditional on `showPotBreakdown`: four
   `Starting balance`/`Contributions`/`Growth`/`Withdrawals` rows,
   `text-xs`, with a `border-t` separating it from the button above.

Full assembled shape:

```jsx
React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-5 border border-slate-200" },
  React.createElement("div", { className: "flex items-center justify-between mb-2" },
    React.createElement("h3", { className: "text-xs font-semibold text-slate-600 uppercase tracking-wide" },
      isCouple ? 'Combined Pot' : 'Total Pot'),
    React.createElement(PiggyBank, { className: "h-5 w-5 text-emerald-600" })
  ),
  React.createElement("p", { className: "text-2xl font-bold text-slate-900 tabular" },
    formatCurrency(household.totalPot)),
  React.createElement("p", { className: "text-sm font-semibold text-slate-500 tabular mt-0.5" },
    formatToday(deflate(household.totalPot, household.year, d.infl)), " in today's money"),
  React.createElement("p", { className: "text-xs text-slate-500 mt-1" },
    "Under these assumptions — when ", isCouple ? 'both retired' : 'retired', " (", household.year, ")"),
  React.createElement("button", {
    type: "button",
    onClick: () => setShowPotBreakdown(v => !v),
    className: "mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
  }, "Explain this ", showPotBreakdown
      ? React.createElement(ChevronUp, { className: "h-3.5 w-3.5" })
      : React.createElement(ChevronDown, { className: "h-3.5 w-3.5" })),
  showPotBreakdown && React.createElement("div", {
    className: "mt-2 pt-2 border-t border-slate-100 space-y-1 text-xs"
  }, [
    ['Starting balance', potBreakdown.startingBalance],
    ['Contributions', potBreakdown.contributions],
    ['Growth', potBreakdown.growth],
    ['Withdrawals', potBreakdown.withdrawals]
  ].map(([label, value]) => React.createElement("div", {
    key: label,
    className: "flex items-center justify-between"
  }, React.createElement("span", { className: "text-slate-500" }, label),
     React.createElement("span", { className: "font-semibold text-slate-900 tabular" }, formatCurrency(value)))))
)
```

Five lines of content plus a conditional panel is more than any other card
on the page carries, but three of the five are single-line, small-type
additions (the today's-money line, the caption, the button) rather than
new blocks — the card grows taller, not busier. Nothing here is
per-item-conditional-vs-others: all three bundle additions render together
every time (no toggle hides 013's or 014's lines).

### 7. `docs/TOOL_DOCUMENTATION.md` updates

- **§3.4 "Reading the outputs"** (`:101-108`):
  - The "Summary cards" bullet gains a sentence: combined pot and household
    income are now shown with a smaller today's-money equivalent beneath
    the nominal figure ("≈ £X in today's money"), and their captions are
    hedged ("under these assumptions") rather than stated as plain fact.
  - The "Living Standard gauge" bullet gains a sentence noting the
    permanent caveat line under the gauge (income shown in future £,
    bands in today's-money terms — not directly comparable) and that the
    big income figure above the gauge carries the same today's-money line
    as the summary cards.
  - The "Wealth Projection" and "Retirement Income vs Expenses" bullets
    each gain a clause: hovering any point now also shows a "Total
    (today's money)" line alongside the per-series figures.
  - A new bullet (after "Summary cards", before "Wealth Projection")
    describing the Pot card's "Explain this" control: expands to show
    Starting balance / Contributions / Growth / Withdrawals, all in
    nominal terms, always showing all four lines including any that are
    £0.
  - The "'Can I retire?' headline" bullet gains a clause noting its
    insight lines are now hedged with "under these assumptions," matching
    the existing headline-sentence convention already documented there.
- **§3.7 "Export and import"** (`:127-135`): one sentence added noting the
  Data menu now states explicitly, above the Export/Import controls, that
  figures never leave the browser (no account, no upload, no bank
  connection, no analytics) — export/import (as already documented) is the
  only way data moves anywhere, and only when the user chooses to do it.
  A cross-reference to the same statement now in the footer.
- **§4.7 "Reference figures used"**: unchanged — no reference figure
  changes in this bundle.
- **§5.4 "Verification"** (`:264-284`): one new bullet —
  `computePotBreakdown()`'s four categories
  (`startingBalance`/`contributions`/`growth`/`withdrawals`) reconcile
  exactly against `household.totalPot` for a range of individual- and
  couple-mode fixtures, including a staggered-retirement couple fixture
  where `withdrawals` is nonzero before `bothYear`. No other new checklist
  items — nothing else in this bundle changes calculation logic (013's
  `deflate()`, 014's copy, 016's copy and 017's copy are all
  presentation-only, and `computePotBreakdown()` itself reads
  `projectJoint()`'s output rather than changing it).
- **§7 "Known limitations"**: unchanged. Nothing in this bundle removes,
  narrows, or adds a deliberate simplification — 013's PLSA caveat (§1.4)
  makes existing limitation #6 visible in the UI for the first time, it
  doesn't change what the limitation is.

### 8. `sw.js` cache bump

One bump for the whole bundle (`intent/013`'s Constraints, echoed by
014/015/016/017): `CACHE` moves from `'retirement-planner-v11'` to
**`'retirement-planner-v12'`**.

### 9. `USER_CHANGELOG` entry

One entry, `version: 'v12'`, matching §8. Covers the three user-facing
sub-items (013, 015, 017); 014 and 016 are copy-only wording changes with
no new visible affordance, so per `CLAUDE.md`'s "would a user experience
this as a new/changed feature, calculation, behaviour, or bug fix" test,
they don't warrant their own bullets — the hedged wording they introduce is
folded implicitly into how 013/015's bullets are phrased (e.g. "with a
line explaining..." rather than claiming a wholly separate change):

```js
{
  version: 'v12',
  date: '2026-09-21', // set to the actual merge date
  title: "Today's-money figures, an \"Explain this\" breakdown, and a privacy note added",
  items: [
    'Your Combined/Total Pot and Household/Annual Income figures now show a smaller "in today\'s money" line underneath the main number, so it\'s clear what that figure is actually worth after inflation. The Living Standard gauge also now notes that its bands are today\'s-money figures while your income is shown in future pounds. Hovering any point on the two charts now also shows a "Total (today\'s money)" line.',
    'Click "Explain this" under your Pot figure to see how it\'s made up — starting balance, contributions, investment growth, and any withdrawals already taken.',
    'The footer and the ⚙ Data menu now state plainly that your figures stay on this device — no account, no upload, no bank connection, and no analytics.'
  ]
}
```

### 10. `CHANGELOG.md` entry

Under the date this merges, naming all five intent files
(`intent/013-today-vs-nominal-money.md` through
`intent/017-privacy-feature-messaging.md`), covering: the bundling decision
itself (five roadmap items, one shared spec/PR/build); the `deflate()`/
`formatToday()` helpers and every dual-display site (013); the hedge-
language pass across summary captions and `VerdictHero` (014); the
`computePotBreakdown()` helper and the Pot card's new "Explain this"
control (015); the sequence-of-returns-risk rewording (016); and the new
`Lock` icon plus footer/Data-menu privacy statement (017) — noting for each
that no calculation logic changed except the new, purely additive
`computePotBreakdown()` reconstruction (`projectJoint()` itself untouched
throughout).

### 11. Verification

**`tests/test-engine.js`** — the one calculation-adjacent addition in this
bundle. New cases, alongside the existing `findSupportableDelta` cases:

- For an individual-mode fixture and a couple-mode fixture (reuse
  `tests/fixtures/individual-baseline.json`'s inputs plus a new
  couple-mode case with staggered retirement ages so `withdrawals` is
  provably nonzero before `bothYear`): run `projectJoint()`, then
  `computePotBreakdown()` with the same inputs, and assert
  `startingBalance + contributions + growth - withdrawals === totalPot`
  and that `totalPot` matches the `household.totalPot` value the app would
  compute (same row-lookup rule).
- Assert `contributions` reflects the pension-contribution cap (a fixture
  with combined pension + employer contributions above `£60,000/year`
  should show `contributions`'s pension component capped, not the
  uncapped input rate × years).
- Assert a person's contribution years stop at their own `retirementAge`,
  not at `bothYear`, in a staggered-couple fixture (the earlier retiree's
  contribution total should be smaller per-year-of-eligibility than a
  same-rate later retiree's).

`computePotBreakdown` is added inside the existing
`ENGINE-EXTRACT-START`/`END` span specifically so the harness's existing
extraction mechanism picks it up with no changes to
`tests/test-engine.js`'s `extractEngineSource`/`loadEngine` plumbing — only
new `describe`/assertion blocks are added.

**Manual verification** (`CLAUDE.md`'s "No build step" convention), in both
individual and couple mode, light and dark theme, desktop and mobile
viewport:

- The Pot and Income cards in the full-size row show a correctly-rounded,
  "≈"-prefixed today's-money line under the nominal figure; the sticky bar
  and per-person grid remain nominal-only, unchanged.
- The Living Standard detail card's big income figure shows the same
  today's-money line; the gauge's new caveat line is visible and legible
  under both themes.
- Hovering any point on both charts shows a "Total (today's money)" row;
  `IncomeChart`'s total excludes the `Target Expenses` line, `WealthChart`'s
  nets in `Mortgage Debt`.
- The Pot/Income captions and `VerdictHero`'s insight lines read with
  "Under these assumptions..."; the status badge and warning banner text
  are unchanged.
- Clicking "Explain this" expands four lines (including any that are £0)
  that visibly sum to the Pot figure above; clicking again collapses it;
  the state doesn't leak into any other card.
- `VerdictHero`'s caveat sentence no longer says "sequence-of-returns risk"
  in visible text; hovering the new info icon shows the term and
  explanation in a tooltip, matching the slider-tooltip's look exactly.
- The footer shows the new privacy line with the `Lock` icon; the Data
  menu shows the fuller privacy paragraph above Export/Import, also with
  the `Lock` icon; neither claims zero network activity.
- `node tests/test-engine.js` passes, including the new
  `computePotBreakdown` cases.

## Non-goals

Carried over unchanged from all five intents (not repeated per-item — see
each intent's own Non-goals section for the full list); the ones most
relevant to implementation:

- No "show in today's money" toggle — dual-display is always on.
- No fix to the PLSA gauge's actual nominal-vs-today's-money mismatch —
  caveat only (roadmap item #23's job).
- No per-series today's-money figures in chart tooltips — one total line
  only.
- No dual-display on the sticky bar or per-person grid.
- No change to `projectJoint()` or any calculation logic anywhere in this
  bundle — `computePotBreakdown()` reads its output, never changes it.
- No softening of the warning banner or the Living Standard badge text.
- No breakdown for any figure other than Pot.
- No modal/dialog/new disclosure pattern — both new disclosures (015, 016)
  reuse an existing pattern (click-to-expand, hover-tooltip respectively).
- No 🔒 emoji or other emoji anywhere in the UI — the new `Lock` icon
  follows the existing hand-copied-SVG convention.
- No new prominent UI element near the top of the input form for privacy
  messaging.
- No new fields added to `PERSISTED_FIELDS` — nothing in this bundle is
  part of "what's in a plan."

## Constraints

- Single-file PWA constraint holds; `sw.js`'s `CACHE` bumps to `v12` once,
  for the whole bundle (§8).
- `SliderWithInput`, `PersonInputs`, `ChartTooltip`, `WealthChart`,
  `IncomeChart`, `VerdictHero` and `AssumptionsPanel` all stay module-level
  and memoised (`CLAUDE.md` §5.3); `computePotBreakdown`, `deflate` and
  `formatToday` join `planSucceeds`/`findSupportableDelta`/
  `scrollAndHighlight`/`nameAtAge`/`nameValue` as plain module-level
  functions (not components, no memoisation needed).
- `docs/TOOL_DOCUMENTATION.md` (§3.4, §3.7, §5.4 — §4.7 and §7 explicitly
  unchanged per §7 above), `CHANGELOG.md` (§10), and one `USER_CHANGELOG`
  entry (§9) all land in the same PR, per `CLAUDE.md`.
- Per the lifecycle, this PR also moves all five intent files
  (`intent/013-today-vs-nominal-money.md` through
  `intent/017-privacy-feature-messaging.md`) and this spec file into
  `intent/done/` / `spec/done/` once implemented and merged, and removes
  `plan.md`.
- This session continues on the harness-assigned branch
  `claude/pensive-newton-rymumn` (no fresh `feature/013-...` branch), per
  each intent's own Constraints section. The draft PR is opened against
  `main` from this branch once implementation begins.
- `main`'s branch protection (PR + green `test-engine` check) applies as
  usual — no direct push to `main`.

## Open questions

None blocking implementation — the five grilling interviews left nothing
open at the decision level. This spec resolved the mechanics each intent
explicitly deferred to "the shared spec":

- The Pot card's final five-part layout (intent 015 decision 6) — §6.
- `deflate()`'s exact signature, including the `inflationRate` parameter
  the intent's own illustrative signature omitted — §1.1.
- `ChartTooltip`'s total-line exclusion of `IncomeChart`'s `Target
  Expenses` series, which the intent's "sum of that year's payload values"
  phrasing didn't address — §1.5.
- `computePotBreakdown()`'s exact per-person contribution-years rule
  (stops at each person's own retirement age, not at `bothYear`) and its
  replication of `projectJoint()`'s pension-contribution cap and LISA
  bonus, needed for the breakdown to be *meaningful* (not just
  arithmetically self-consistent, which the residual `growth` term
  guarantees regardless) — §3.1.
- Exact copy throughout (today's-money line wording, hedge captions, PLSA
  caveat, privacy statements, `USER_CHANGELOG` entry) — reviewed against
  item 016's plain-language standard as part of this spec (§4.2), not left
  to implementation as ordinary polish, since 016 explicitly makes that
  review part of this bundle's own scope.

Pixel-level styling (exact spacing, hover colours, animation timing) is
ordinary UI polish left to implementation, the same latitude
`spec/done/011`/`spec/done/012` left for their own components.
