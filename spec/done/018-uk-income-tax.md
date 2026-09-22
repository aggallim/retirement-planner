# 018 — UK income tax in retirement (with Lump Sum Allowance, centralised reference figures, and methodology section)

## Status

Ready for implementation. This spec is built from `intent/018-uk-income-tax.md`,
whose four grilling rounds (22 decisions) cover roadmap items #3, #12, #26
and #19 as one requirement. The spec does not re-decide anything the intent
settled. It turns those decisions into code-level mechanics. Where the
intent left something open (an exact signature, a rounding or boundary
rule, exact copy, a placement), this spec resolves it inline, marked
**Resolution**, and lists every resolution in "Open questions /
resolutions" at the end.

This is a **high-stakes calculation change** to `projectJoint()`.
`docs/TOOL_DOCUMENTATION.md` §4, §5.4 and §7 were read in full before
this design was written. Every formula below was prototyped against a copy
of the current engine, extracted the same way `tests/test-engine.js`
extracts it. With the prototype in place, the 20 existing checks all pass
unchanged. The only failure is the individual-mode baseline, which fails
as expected (§15). The expected figures quoted in §14 and §15 come from
that prototype.

## Fact verification (gov.uk)

**Direct fetches failed.** Every `WebFetch`/`curl` to `www.gov.uk` and
`www.retirementlivingstandards.org.uk` from this session was refused by the
environment's egress proxy (`403 connect_rejected`, organisation policy).
No page below was loaded directly. The fallback was `WebSearch` restricted
to `gov.uk`. Every URL in this spec is one that search returned from its
index, and every figure was confirmed against the text of the indexed page
as the search tool returned it. **No URL was written from memory.**
Search-index confirmation is weaker than loading the page yourself, so
§15's PR checklist adds a required step: before the PR is marked ready,
open every URL in `UK_REFERENCE` in a browser and confirm the figure.

| # | Fact | Figure confirmed | URL (from search index) | Notes |
|---|---|---|---|---|
| 1 | Personal Allowance, taper, rates, current tax year | £12,570; PA falls by £1 for every £2 of adjusted net income above £100,000 and is zero at £125,140 or above; basic/higher/additional rates are 20%/40%/45%; current tax year is 6 April 2026 to 5 April 2027 | https://www.gov.uk/income-tax-rates | Confirms the intent. |
| 2 | Basic rate limit / higher-rate threshold and the **freeze end date** | PA £12,570 and basic rate limit £37,700 are kept "until 5 April 2031"; the higher-rate threshold is £50,270 until 5 April 2031 | https://www.gov.uk/government/publications/maintaining-income-tax-and-equivalent-national-insurance-contributions-thresholds-until-5-april-2031 | **Confirms the intent's assumption.** The freeze covers every tax year up to and including **2030/31**, so the first uprated tax year is **2031/32**. £12,570 + £37,700 = £50,270. |
| 3 | Additional-rate threshold £125,140 | Confirmed as the income at which the PA reaches zero (row 1). The same page gives 45% as the additional rate. | https://www.gov.uk/income-tax-rates | The search snippet did not include the band table row itself, so confirm it when checking the PR. |
| 4 | Lump Sum Allowance | "You can usually take up to 25% of the amount built up in any pension as a tax-free lump sum. The most you can take is £268,275." | https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance | Confirms that the 25% is capped by the LSA. |
| 5 | Full new State Pension 2026/27 | £241.30 a week (2026 to 2027); £12,547.60 a year | https://www.gov.uk/new-state-pension/what-youll-get | The app's £12,548 is the annual figure rounded to the nearest pound. That is correct. |
| 6 | Pension annual allowance | £60,000 "this tax year"; lower if you flexibly access your pension | https://www.gov.uk/tax-on-your-private-pension/annual-allowance | |
| 7 | MPAA | "For 2023-24 onwards the money purchase annual allowance is £10,000" | https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm056510 | This is an HMRC manual page. Row 6 is the user-facing page. |
| 8 | ISA allowance | £20,000 in 2026 to 2027 | https://www.gov.uk/individual-savings-accounts | |
| 9 | LISA limit and bonus | £4,000, counting toward the £20,000; 25% government bonus, up to £1,000 a year | https://www.gov.uk/lifetime-isa | |
| 10 | State-Pension-only easement | Announced at Budget 2025: pensioners whose **only** income is the basic or new State Pension (without increments) will not have to pay small amounts of tax through Simple Assessment from **2027/28**; detail to follow | **No gov.uk page surfaced.** Search only found it on parliament.uk: https://commonslibrary.parliament.uk/research-briefings/cbp-10250/ (House of Commons Library, "Taxation of state pension"). The related gov.uk page is https://www.gov.uk/guidance/how-your-state-pension-is-taxed | See Open question Q1. The in-app note links the gov.uk page. The Commons Library link is used only in the docs. |
| 11 | Personal Savings Allowance | £1,000 basic / £500 higher / £0 additional; starting rate for savings up to £5,000 | https://www.gov.uk/apply-tax-free-interest-on-savings | Known-limitation link. |
| 12 | Marriage Allowance | £1,260 of PA transferable | https://www.gov.uk/marriage-allowance | Known-limitation link. |
| 13 | Blind Person's Allowance | Added to the PA | https://www.gov.uk/blind-persons-allowance | Known-limitation link (intent decision 6). |
| 14 | Scottish income tax | Separate rates apply to Scottish taxpayers | https://www.gov.uk/scottish-income-tax | Known-limitation link (roadmap #27). |
| 15 | PLSA Retirement Living Standards | Two-person £21,600 / £43,900 / £60,600 and one-person Minimum £13,400 were confirmed by search. **One-person Moderate £31,700 / Comfortable £43,900 were not confirmed** (search did not return them). | https://www.retirementlivingstandards.org.uk/ (direct fetch also blocked) | Not gov.uk, as expected. Search also showed that the standards are now published under the **Pensions UK** name, and a third-party article mentions a **2026/27** update. See Open question Q2. |

Other facts that came up during verification and are **out of scope**
(listed in "Open questions / resolutions" so they aren't lost):

- From 6 April 2027 the cash ISA limit falls to £12,000 for people under 65,
  inside the unchanged £20,000 overall limit:
  https://www.gov.uk/government/publications/reduction-in-the-cash-individual-savings-account-isa-limit
- LISA contributions and the bonus stop at age 50 (https://www.gov.uk/lifetime-isa).
  The app currently lets LISA contributions continue until retirement.

## Problem

See `intent/018-uk-income-tax.md` for the full "what's there today". Below
are the concrete code sites this spec edits, described by the elements
around them, since line numbers go stale:

- **Engine-extract spans.** There are two `// ENGINE-EXTRACT-START`/`END`
  pairs in `index.html`. The first wraps only `const CURRENT_YEAR = 2026;`,
  just after the `Recharts` destructure. The second runs from `migratePerson`
  through `drawFromTier`, `projectJoint`, `planSucceeds`,
  `findSupportableDelta` and `computePotBreakdown`, under the
  `/* ---- Projection engine ---- */` banner. `tests/test-engine.js`
  concatenates both spans and evaluates them in a `vm` sandbox exposing only
  `Math`. Top-level `function` declarations become sandbox properties.
  Top-level `const` values do not, so the harness appends
  `var __CURRENT_YEAR = CURRENT_YEAR;` to read that one.
- **Scattered reference figures.** These sit outside the spans: `PLSA`
  (right after `formatCurrencyK`); `makePerson`'s `statePensionAmount: 12548`;
  the `IsaTypeAccount` tooltips/subtitles in `PersonInputs` (Cash ISA,
  Stocks & Shares ISA, LISA) ("£20,000", "£4,000", "25%", "age 60"); the
  employer-contribution slider tooltip ("£60,000"); the lump-sum checkbox
  label ("Take 25% tax-free lump sum at retirement"); the State Pension
  slider tooltip ("£12,548/year (2026/27)"); the `warnings` memo (`60000`,
  `20000`, `4000` literals and strings); the "Assumptions & Disclaimers"
  body (PLSA / State Pension / Allowances / Important paragraphs); and the
  footer's "Based on 2026/27 UK tax year allowances...". Inside the span
  there are more: `projectJoint`'s `const cap = 60000`, the lump sum's
  `p.pension * 0.25`, the LISA's `* 1.25` and `x.age >= 60`, and
  `computePotBreakdown`'s `const cap = 60000` and `* 1.25`.
- **Row consumers.** `summaryOf` / `p1Summary` / `p2Summary`: its `lumpSum` is
  `pension / 3`, which is wrong once the LSA can cap it. Also `household`,
  `livingStandard`, `potBreakdown`, `longevity`, `verdict`, `warnings`,
  `incomeData`, `WealthChart` (explicit `dataKey`s only) and `IncomeChart`.
- `household` is **not** read from rows. It takes each person's own
  first-year draw (`pension at own retirement × wr`, from `summaryOf`) plus
  each person's **un-inflated** State Pension input if they have reached
  State Pension age at `bothYear`. This mixed nominal/today basis already
  exists and this spec keeps it (see §5.2 and Resolution R9).
- `ChartTooltip` already has `excludeFromTotal`. `IncomeChart` passes
  `['Target Expenses']`.
- `VerdictHero`'s caveat `<p>` begins "Based on a fixed average return, no
  tax on retirement income, and no allowance for a bad run of returns
  early in retirement".
- The "Assumptions & Disclaimers" collapsible is a `<div
  id="assumptions-disclaimers">` whose `<button>` toggles `showAssumptions`.
  `AssumptionsPanel`'s footer button calls `onShowFullAssumptions`, which runs
  `setShowAssumptions(true)` and then `scrollAndHighlight('assumptions-disclaimers')`.
- **Tailwind constraint** (`docs/TOOL_DOCUMENTATION.md` §5.1). Only classes
  already in the inlined build do anything. Every class used in the new JSX
  below was checked against the build (and against `.dark` overrides for
  colour classes). Several classes already in the page were found to be
  **absent** from the build and are silent no-ops today: `underline`,
  `mt-4`, `pt-2`, `space-y-1`, `space-y-2`, `gap-1`, `hover:text-blue-700`,
  `hover:text-slate-700`. The new JSX avoids them. Fixing the existing uses
  is out of scope (Open question Q5).
- `sw.js`: `CACHE = 'retirement-planner-v12'`. `USER_CHANGELOG` newest is `v12`.

## Outcome

### 1. `UK_REFERENCE` — the single tax-year-tagged reference object (intent decision 20)

#### 1.1 Placement

Put it **inside the first `ENGINE-EXTRACT` span**, directly after
`const CURRENT_YEAR = 2026;`, so both `projectJoint()` (browser) and the
`vm` sandbox (tests) can read it. It is pure data (strings and numbers, no
`Intl`, no DOM), so it evaluates in the `Math`-only sandbox.

#### 1.2 Shape

```js
// Every dated UK reference figure the app uses (intent/018 decision 20).
// Next tax year's update is this one block. Each figure carries the
// gov.uk page it was checked against (spec/018 "Fact verification").
// Row year Y in projectJoint() is treated as tax year Y/Y+1 (2026 ->
// 2026/27).
const UK_REFERENCE = {
  taxYear: '2026/27',
  lastUpdated: '6 April 2026',
  incomeTax: {
    region: 'England, Wales and Northern Ireland',
    personalAllowance: 12570,
    taperThreshold: 100000,       // PA reduced by £1 for every £2 above this
    higherRateThreshold: 50270,   // = PA + £37,700 basic rate limit
    additionalRateThreshold: 125140,
    basicRate: 0.20,
    higherRate: 0.40,
    additionalRate: 0.45,
    freezeLastYear: 2030,         // frozen through tax year 2030/31 (to 5 April 2031)
    freezeLastTaxYear: '2030/31',
    source: 'https://www.gov.uk/income-tax-rates',
    sourceLabel: 'GOV.UK: Income Tax rates',
    freezeSource: 'https://www.gov.uk/government/publications/maintaining-income-tax-and-equivalent-national-insurance-contributions-thresholds-until-5-april-2031',
    freezeSourceLabel: 'GOV.UK: thresholds maintained until 5 April 2031'
  },
  statePension: {
    fullNewAnnual: 12548,         // £241.30/wk x 52 = £12,547.60, rounded
    fullNewWeekly: 241.30,
    source: 'https://www.gov.uk/new-state-pension/what-youll-get',
    sourceLabel: 'GOV.UK: new State Pension',
    taxSource: 'https://www.gov.uk/guidance/how-your-state-pension-is-taxed',
    taxSourceLabel: 'GOV.UK: how your State Pension is taxed'
  },
  lumpSumAllowance: {
    amount: 268275,
    fraction: 0.25,
    source: 'https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance',
    sourceLabel: 'GOV.UK: Lump Sum Allowance'
  },
  pensionAnnualAllowance: {
    amount: 60000,
    source: 'https://www.gov.uk/tax-on-your-private-pension/annual-allowance',
    sourceLabel: 'GOV.UK: annual allowance'
  },
  moneyPurchaseAnnualAllowance: {
    amount: 10000,
    source: 'https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm056510',
    sourceLabel: 'HMRC: money purchase annual allowance'
  },
  isa: {
    allowance: 20000,
    source: 'https://www.gov.uk/individual-savings-accounts',
    sourceLabel: 'GOV.UK: ISAs'
  },
  lisa: {
    annualLimit: 4000,
    bonusRate: 0.25,
    accessAge: 60,
    source: 'https://www.gov.uk/lifetime-isa',
    sourceLabel: 'GOV.UK: Lifetime ISA'
  },
  plsa: {
    year: '2025/26',
    basis: 'after tax, excluding housing costs, outside London',
    single: { minimum: 13400, moderate: 31700, comfortable: 43900 },
    couple: { minimum: 21600, moderate: 43900, comfortable: 60600 },
    source: 'https://www.retirementlivingstandards.org.uk/',
    sourceLabel: 'Retirement Living Standards'
  },
  // Known-limitation references only — not modelled (intent decisions 5, 6, 10).
  notModelled: {
    scottishIncomeTax: 'https://www.gov.uk/scottish-income-tax',
    personalSavingsAllowance: 'https://www.gov.uk/apply-tax-free-interest-on-savings',
    marriageAllowance: 'https://www.gov.uk/marriage-allowance',
    blindPersonsAllowance: 'https://www.gov.uk/blind-persons-allowance'
  }
};
```

**Resolution R1 (freeze year mapping).** The engine counts in calendar
years, and row `year` Y stands for tax year Y/Y+1, the same convention
`CURRENT_YEAR = 2026` ↔ "2026/27" already implies. `freezeLastYear: 2030`
therefore means tax year 2030/31. Thresholds are frozen for every row with
`year <= 2030` and uprated from row 2031 (tax year 2031/32).

#### 1.3 `PLSA` becomes an alias

Replace the `const PLSA = {...}` literal (outside the span) with:

```js
const PLSA = UK_REFERENCE.plsa; // .single/.couple keep their shape — livingStandardFor, warnings and the gauge are unchanged
```

#### 1.4 Every hard-coded figure/string rewired to `UK_REFERENCE`

| Site (by surrounding element) | Today | After |
|---|---|---|
| `makePerson` default | `statePensionAmount: 12548` | `statePensionAmount: UK_REFERENCE.statePension.fullNewAnnual` |
| `PersonInputs` → Cash ISA and Stocks & Shares ISA `IsaTypeAccount` `tooltip` | `"£20,000 annual allowance shared across..."` | `` `${formatCurrency(UK_REFERENCE.isa.allowance)} annual allowance shared across Cash ISA, Stocks & Shares ISA and LISA. Tax-free growth and withdrawals.` `` |
| same, `contributionSubtitle` | `"Shares the £20,000/yr ISA allowance"` | `` `Shares the ${formatCurrency(UK_REFERENCE.isa.allowance)}/yr ISA allowance` `` |
| LISA `IsaTypeAccount` `tooltip` | `"25% government bonus on contributions, up to £4,000/yr. Not accessible before age 60..."` | `` `${UK_REFERENCE.lisa.bonusRate * 100}% government bonus on contributions, up to ${formatCurrency(UK_REFERENCE.lisa.annualLimit)}/yr. Not accessible before age ${UK_REFERENCE.lisa.accessAge} in this tool (no first-home exception modelled).` `` |
| LISA `contributionSubtitle` | `"25% government bonus applied automatically. Max £4,000/yr."` | same template substitution |
| Employer-contribution slider `tooltip` | `"Combined annual allowance is £60,000 including employer contributions."` | `` `Combined annual allowance is ${formatCurrency(UK_REFERENCE.pensionAnnualAllowance.amount)} including employer contributions.` `` |
| Lump-sum checkbox label | `"Take 25% tax-free lump sum at retirement"` | `` `Take ${UK_REFERENCE.lumpSumAllowance.fraction * 100}% tax-free lump sum at retirement (up to ${formatCurrency(UK_REFERENCE.lumpSumAllowance.amount)})` `` (**Resolution R2**) |
| State Pension slider `tooltip` | `"Full new State Pension is £12,548/year (2026/27). Needs ~35 qualifying NI years."` | `` `Full new State Pension is ${formatCurrency(UK_REFERENCE.statePension.fullNewAnnual)}/year (${UK_REFERENCE.taxYear}). Needs ~35 qualifying NI years.` `` (this tax-year label already exists; it is rewired, not added) |
| `projectJoint` | `const cap = 60000;` | `const cap = UK_REFERENCE.pensionAnnualAllowance.amount;` |
| `projectJoint` LISA monthly credit | `x.p.cfg.lisaContribution * 1.25` | `x.p.cfg.lisaContribution * (1 + UK_REFERENCE.lisa.bonusRate)` (1 + 0.25 === 1.25 exactly, so no numeric change) |
| `projectJoint` LISA tier | `x.age >= 60` | `x.age >= UK_REFERENCE.lisa.accessAge` |
| `projectJoint` lump sum | `p.pension * 0.25` | see §3.1 |
| `computePotBreakdown` | `const cap = 60000;` and `* 1.25` | `UK_REFERENCE.pensionAnnualAllowance.amount` and `(1 + UK_REFERENCE.lisa.bonusRate)` |
| `warnings` memo | `> 60000` / `"£60,000"`, `> 20000` / `"£20,000"`, `> 4000` / `"£4,000"` | compare against `UK_REFERENCE.pensionAnnualAllowance.amount`, `.isa.allowance`, `.lisa.annualLimit`; strings use `formatCurrency(...)` of the same |
| "How we calculate this" body | literal PLSA / State Pension / allowance figures | built from `UK_REFERENCE` (§11) |
| Footer | `"Based on 2026/27 UK tax year allowances and PLSA Retirement Living Standards"` | `` `Based on ${UK_REFERENCE.taxYear} UK tax year figures and PLSA Retirement Living Standards (${UK_REFERENCE.plsa.year})` `` |

Deliberately **not** rewired:

- `USER_CHANGELOG`'s historical entries (the `v3` entry's "25%"). They
  record what shipped, not current figures.
- Plan defaults that are not reference figures (partner `ssIsaBalance: 20000`,
  `pensionPot: 60000`; slider `max` values; the gauge's `gMin`/`gMax`).
- The £1,000 depletion floor. It is a modelling rule, not a UK figure.

No new tax-year label is added anywhere else, including `AssumptionsPanel`
(intent decision 20).

### 2. Tax helpers (new, inside the second `ENGINE-EXTRACT` span)

Place both directly after `drawFromTier` and before `projectJoint`:

```js
// Income tax thresholds for row year `year` (tax year year/year+1):
// frozen at the UK_REFERENCE figures through freezeLastYear, then uprated
// by the household inflation input each year after (intent/018 decision 10).
// All four thresholds move together, so the taper still ends exactly
// at the additional-rate threshold (taper + 2 x PA) in every year.
function taxThresholdsFor(year, inflationRate) {
  const t = UK_REFERENCE.incomeTax;
  const k = Math.pow(1 + inflationRate / 100, Math.max(0, year - t.freezeLastYear));
  return {
    personalAllowance: t.personalAllowance * k,
    taperThreshold: t.taperThreshold * k,
    higherRateThreshold: t.higherRateThreshold * k,
    additionalRateThreshold: t.additionalRateThreshold * k
  };
}
// Rest-of-UK income tax on one person's non-savings income for one year
// (intent/018 decisions 5-7). The basic-rate band has a fixed width
// (higherRateThreshold - personalAllowance = £37,700 today) above
// whatever allowance remains after the £100k taper, and the additional
// rate applies above additionalRateThreshold of taxable income. This is
// HMRC's own structure, which gives the 60% effective marginal rate in
// the taper zone.
function incomeTaxFor(taxableIncome, th) {
  const t = UK_REFERENCE.incomeTax;
  if (!(taxableIncome > 0)) return 0;
  const allowance = Math.max(0, th.personalAllowance - Math.max(0, taxableIncome - th.taperThreshold) / 2);
  const taxable = Math.max(0, taxableIncome - allowance);
  const basicBand = th.higherRateThreshold - th.personalAllowance;
  const basic = Math.min(taxable, basicBand);
  const higher = Math.min(Math.max(0, taxable - basicBand), th.additionalRateThreshold - basicBand);
  const additional = Math.max(0, taxable - th.additionalRateThreshold);
  return basic * t.basicRate + higher * t.higherRate + additional * t.additionalRate;
}
```

Prototype check at 2026 thresholds (these become test cases, §14):

| Taxable income | Tax |
|---|---|
| 0 / 12,570 | 0 |
| 12,571 | 0.20 |
| 50,269 / 50,270 / 50,271 | 7,539.80 / 7,540.00 / 7,540.40 |
| 100,000 | 27,432.00 |
| 100,002 | 27,433.20 (+£1.20 for +£2 = 60%) |
| 110,000 | 33,432.00 |
| 125,139 / 125,140 / 125,141 | 42,515.40 / 42,516.00 / 42,516.45 |
| 150,000 | 53,703.00 |

`taxThresholdsFor(2030, 3).personalAllowance === 12570`;
`taxThresholdsFor(2031, 3).personalAllowance ≈ 12947.1`;
`taxThresholdsFor(2035, 2).personalAllowance === 12570 * 1.02 ** 5`;
at 0% inflation the thresholds never move.

**Resolution R3 (which thresholds uprate).** Decision 10 says "allowance
and band thresholds". This spec uprates all four, including the £100,000
taper threshold and £125,140. In law those two are not indexed, but
uprating them together is the only way to keep the taper internally
consistent (PA reaches zero exactly at the additional-rate threshold). The
in-app methodology copy says this plainly (§11).

**Resolution R4 (rounding).** Thresholds and tax are not rounded inside the
calculation. Rows round per field (§3.3), as all other row money fields
already do. HMRC's own rounding of future indexed thresholds is not
modelled.

### 3. `projectJoint()` changes

#### 3.1 Lump Sum Allowance cap (intent decision 12)

Inside the per-person `pp = people.map(p => {...})` block, replace the
lump-sum lines:

```js
let lumpSum = 0;
let lumpSumExcess = 0;
if (retired && !p.appliedLump) {
  if (p.cfg.takeLumpSum) {
    // Tax-free cash = min(25% of pot, Lump Sum Allowance), per person.
    // Any excess simply stays in the pension and is taxed as income when
    // drawn (intent/018 decision 12). There is no one-off taxable payment.
    const lsa = UK_REFERENCE.lumpSumAllowance;
    const uncapped = p.pension * lsa.fraction;
    lumpSum = Math.min(uncapped, lsa.amount);
    lumpSumExcess = uncapped - lumpSum;
    p.pension -= lumpSum;
    p.ssIsa += lumpSum;
  }
  p.initialWithdrawal = p.pension * (withdrawalRate / 100);
  p.appliedLump = true;
}
```

and add `lumpSum, lumpSumExcess` to that block's returned object (alongside
`p, age, retired, statePension`).

When uncapped, `p.pension * 0.25` is exactly what was subtracted before, so
existing lump-sum behaviour is identical to the bit. The existing "precisely
75%" test still passes. The initial 4%-rule withdrawal is taken from the
larger remaining pot when the cap binds, as decision 12 implies.

**Resolution R5 (LSA not uprated).** £268,275 stays fixed in nominal terms
in every future year. Decision 10's uprating covers income tax thresholds
only, and the LSA is a fixed statutory amount. This is stated in the
methodology copy (§11) and in §4.2 of the docs.

#### 3.2 Income tax and the funding gap (intent decisions 7–9)

Replace

```js
let gap = Math.max(0, targetExpenses - totalSP - totalPenW);
```

with

```js
// Per-person taxable income = own pension draw + own State Pension
// (intent/018 decision 7). ISA/LISA/other-savings draws and the tax-free
// lump sum are not taxable. The 4%-rule draw stays gross (decision 8).
// Tax reduces net income, and the larger gap is funded from the existing
// tax-free savings tiers in the existing order. There is no gross-up.
const th = taxThresholdsFor(year, inflationRate);
const taxableIncomes = pp.map((x, i) => penDraws[i] + x.statePension);
const taxes = taxableIncomes.map(t => incomeTaxFor(t, th));
const totalTax = taxes.reduce((s, t) => s + t, 0);
let gap = Math.max(0, targetExpenses - (totalSP + totalPenW - totalTax));
```

Nothing else in the tier-draw logic changes. Because the tax is computed
from `penDraws` (already capped at the remaining pot), a depleted pension
correctly produces less tax. Before the first retirement,
`targetExpenses === 0`, so `gap` stays 0 even when State Pension is being
taxed. Surplus net income is still discarded rather than reinvested,
exactly as today.

#### 3.3 New per-year row fields

Append these to the `row` literal, after `p2OtherSavings` and following the
existing `pp[1] ? ... : 0` pattern:

```js
p1StatePension: Math.round(pp[0].statePension),
p2StatePension: pp[1] ? Math.round(pp[1].statePension) : 0,
p1TaxableIncome: Math.round(taxableIncomes[0]),
p2TaxableIncome: pp[1] ? Math.round(taxableIncomes[1]) : 0,
p1Tax: Math.round(taxes[0]),
p2Tax: pp[1] ? Math.round(taxes[1]) : 0,
p1LumpSum: Math.round(pp[0].lumpSum),           // non-zero only in that person's retirement year
p2LumpSum: pp[1] ? Math.round(pp[1].lumpSum) : 0,
p1LumpSumExcess: Math.round(pp[0].lumpSumExcess),
p2LumpSumExcess: pp[1] ? Math.round(pp[1].lumpSumExcess) : 0
```

and, next to the existing derived totals (`row.totalPension = ...`):

```js
row.incomeTax = row.p1Tax + row.p2Tax;          // household, from rounded parts (same pattern as totalPension)
row.netIncome = row.statePension + row.pensionWithdrawal - row.incomeTax; // taxable income after tax; excludes savings draws
```

Row consumers and what happens to each:

| Consumer | Effect |
|---|---|
| `WealthChart` | Uses explicit `dataKey`s, so the extra fields are ignored. Balances reflect larger savings draws and the LSA split. |
| `IncomeChart` / `incomeData` | Gains the tax bar (§7). |
| `computePotBreakdown()` | Code unchanged apart from the §1.4 constant rewire. `withdrawals` still sums `pensionWithdrawal + isaWithdrawal + otherSavingsWithdrawal` (gross), so the pot identity still reconciles. Tax is paid from draws, not from the pot (intent Constraints). |
| `planSucceeds` / `longevity` / `findSupportableDelta` / `verdict` | Code unchanged. They pick up tax automatically through `projectJoint()` (decision 9). |
| `summaryOf` | `lumpSum` must read the row (§5.1). |
| `household` | Gains tax (§5.2). |

### 4. New engine-span helpers for display data

Both go inside the second span, directly after `computePotBreakdown` and
before `// ENGINE-EXTRACT-END`. Both are pure and harness-testable.

#### 4.1 `deflate` moves into the span

Move the existing `deflate` (currently just after `nameValue`, outside the
span) verbatim to sit directly before `lifetimeTaxTotals`. It only uses
`Math` and `CURRENT_YEAR`, so it evaluates in the sandbox. `formatToday`
stays outside because it calls `formatCurrency` (`Intl`). No call sites
change, since both are module-level either way.

#### 4.2 `lifetimeTaxTotals`

```js
// "Estimated income tax over retirement" (intent/018 decision 15). The
// today's-money figure deflates EACH YEAR's tax from its own year and
// sums the results. Deflating the nominal total once, from any single
// year, would be wrong: tax paid in 2060 and 2090 is discounted by
// different amounts.
function lifetimeTaxTotals(projections, firstRet, planEnd, inflationRate) {
  let nominal = 0;
  let today = 0;
  for (const r of projections) {
    if (r.year < firstRet || r.year > planEnd) continue;
    nominal += r.incomeTax;
    today += deflate(r.incomeTax, r.year, inflationRate);
  }
  return { nominal, today };
}
```

**Resolution R6 (the window for "over retirement").** Sum from `firstRet`
(first retirement year) to `planEnd` (the longer life expectancy)
inclusive. These are the same bounds as `longevity`/the verdict. Years
after `planEnd` (the engine runs to age 100) are excluded. With the
default plan, the prototype gives £370,489 nominal and ≈ £92,769 in
today's money. Deflating the total once from `planEnd` would wrongly give
≈ £62,884.

#### 4.3 `computeTaxNotes`

```js
// Facts for the "Tax notes" panel (intent/018 decisions 16-18). Per
// person, the FIRST row (year <= planEnd) where each condition holds.
// Returns data only; the wording lives in taxNoteText() (display layer).
const TAX_NOTE_ORDER = ['higherRate', 'additionalRate', 'taper', 'lumpSumCapped', 'statePensionOverAllowance'];
function computeTaxNotes(projections, people, inflationRate, planEnd) {
  const notes = [];
  people.forEach((_, i) => {
    const k = `p${i + 1}`;
    const rows = projections.filter(r => r.year <= planEnd);
    const find = test => {
      for (const r of rows) {
        const th = taxThresholdsFor(r.year, inflationRate);
        if (test(r, th)) return { r, th };
      }
      return null;
    };
    const add = (type, hit, fields) => {
      if (hit) notes.push({ type, personIndex: i, year: hit.r.year, ...fields(hit.r, hit.th) });
    };
    const income = r => r[`${k}TaxableIncome`];
    add('higherRate', find((r, th) => income(r) > th.higherRateThreshold),
      (r, th) => ({ amount: income(r), threshold: th.higherRateThreshold }));
    add('additionalRate', find((r, th) => income(r) > th.additionalRateThreshold),
      (r, th) => ({ amount: income(r), threshold: th.additionalRateThreshold }));
    add('taper', find((r, th) => income(r) > th.taperThreshold && income(r) < th.additionalRateThreshold),
      (r, th) => ({ amount: income(r), threshold: th.taperThreshold, upper: th.additionalRateThreshold }));
    add('lumpSumCapped', find(r => r[`${k}LumpSumExcess`] > 0),
      r => ({ amount: r[`${k}LumpSum`], excess: r[`${k}LumpSumExcess`] }));
    add('statePensionOverAllowance', find((r, th) => r[`${k}StatePension`] > th.personalAllowance),
      (r, th) => ({ amount: r[`${k}StatePension`], threshold: th.personalAllowance }));
  });
  return notes.sort((a, b) => a.year - b.year || a.personIndex - b.personIndex
    || TAX_NOTE_ORDER.indexOf(a.type) - TAX_NOTE_ORDER.indexOf(b.type));
}
```

**Resolution R7 (boundaries and order).**
- "Exceeds" means strictly greater than, so income exactly at a threshold
  produces no note.
- The taper note fires only when income is strictly between the taper
  threshold and the additional-rate threshold.
- A person who jumps straight above the additional-rate threshold gets
  the higher-rate and additional-rate notes but no taper note.
- Rows after `planEnd` are ignored.
- Notes are sorted by year, then person, then the type order above.

Heads-up for implementation, not a bug: the State Pension is uprated from
2026 but the Personal Allowance is frozen until 2030/31. So under this
model a **full** State Pension exceeds the allowance from 2027 (at 3%
inflation, £12,924 > £12,570) and stays above it in every later year. The
fifth note will therefore appear for most users with a full State Pension.
That is the fact decision 16 asks to surface.

### 5. `RetirementCalculator` consumers

#### 5.1 `summaryOf`

```js
lumpSum: row[`p${key}LumpSum`],  // was: person.takeLumpSum ? pension / 3 : 0
```

(The fallback object keeps `lumpSum: 0`.) The per-person grid's "Incl. £X
tax-free lump sum" line is otherwise unchanged.

#### 5.2 `household` — after-tax income (intent decision 13)

```js
const household = useMemo(() => {
  const bothYear = /* unchanged */;
  const row = /* unchanged */;
  const y = bothYear - CURRENT_YEAR;
  const sp1 = d.p1.currentAge + y >= d.p1.statePensionAge ? d.p1.statePensionAmount : 0;
  const sp2 = isCouple && d.p2.currentAge + y >= d.p2.statePensionAge ? d.p2.statePensionAmount : 0;
  const pensionIncome = p1Summary.pensionIncome + (p2Summary ? p2Summary.pensionIncome : 0);
  // Same per-person helper and same year thresholds as projectJoint()
  // (intent/018 decisions 7, 13), applied to the components this card
  // already shows, so "Pension £X · State £Y · Tax −£Z" adds up exactly
  // to the after-tax figure above it.
  const th = taxThresholdsFor(bothYear, d.infl);
  const incomeTax = incomeTaxFor(p1Summary.pensionIncome + sp1, th)
    + (p2Summary ? incomeTaxFor(p2Summary.pensionIncome + sp2, th) : 0);
  const grossIncome = pensionIncome + sp1 + sp2;
  return {
    totalPot: row.totalPension + row.totalIsa + row.totalOtherSavings,
    pensionIncome,
    statePension: sp1 + sp2,
    grossIncome,
    incomeTax,
    annualIncome: grossIncome - incomeTax,   // now AFTER tax — every existing reader picks this up
    year: bothYear
  };
}, [projections, d.p1, d.p2, d.infl, isCouple, p1Summary, p2Summary]);
```

**Resolution R9 (household tax basis).** The household figure applies the
same helper to the components it already displays rather than reading
`row.incomeTax`. `household` has never been row-based (it adds nominal
first-year pension draws to un-inflated State Pension inputs), so reading
a row's tax would produce a sub-line that doesn't add up. The existing
mixed nominal/today's-money basis is unchanged and out of scope; it is
worth a roadmap note.

Because `household.annualIncome` is now after tax, these follow
automatically with no code change: `livingStandard` (PLSA bands are
after-tax, so the comparison is fairer, per decision 13), the PLSA gauge
marker `gPos(household.annualIncome)`, the warnings line "Household income
below minimum living standard", the Income card's today's-money line, and
the sticky bar.

#### 5.3 New memos

Declared next to `potBreakdown`/`verdict`:

```js
const lifetimeTax = useMemo(
  () => lifetimeTaxTotals(projections, longevity.firstRet, longevity.planEnd, d.infl),
  [projections, longevity.firstRet, longevity.planEnd, d.infl]);
const taxNotes = useMemo(
  () => computeTaxNotes(projections, isCouple ? [d.p1, d.p2] : [d.p1], d.infl, longevity.planEnd),
  [projections, isCouple, d.p1, d.p2, d.infl, longevity.planEnd]);
```

`incomeData` gains one key (§7).

### 6. After-tax labels (intent decision 13)

| Site | Today | After |
|---|---|---|
| Full-size Income card header (`h3` beside the `Wallet` icon) | `isCouple ? 'Household Income' : 'Annual Income'` | `isCouple ? 'Household Income after tax' : 'Annual Income after tax'` |
| Income card caption | `"Under these assumptions, sustainable in year one."` | unchanged |
| Sticky bar, middle cell label | `isCouple ? 'Household Income' : 'Annual Income'` | `'Income after tax'` in both modes (**Resolution R10**: shortest label that fits the `text-[10px]` three-column mobile bar spec 003 fixed) |
| Living Standard detail card caption (under the big figure) | `"Under these assumptions, sustainable annual income, first year ", isCouple ? 'both' : '', " retired"` | `"Under these assumptions, sustainable annual income after tax, first year ", isCouple ? 'both' : '', " retired"` |
| Living Standard detail card sub-line (the flex row with the blue "Pension" dot and violet "State" dot) | "Pension £X · State £Y" | adds a third `span`, shown when `household.incomeTax > 0` (same conditional pattern as State; **Resolution R11**) |

The new sub-line span goes directly after the State span:

```js
household.incomeTax > 0 && React.createElement("span", {
  className: "flex items-center gap-1.5"
}, React.createElement("span", {
  className: "w-2.5 h-2.5 rounded-full bg-slate-400"
}), "Tax −", formatCurrency(household.incomeTax))
```

`bg-slate-400` is in the inlined build (checked; a mid-grey dot needs no
dark override). The Pension and State figures stay gross, so X + Y − Z =
the big figure.

### 7. `IncomeChart` — negative "Income Tax" bar (intent decision 14) and tooltip

- `incomeData` map: add `'Income Tax': -r.incomeTax`.
- `ComposedChart` gains `stackOffset: "sign"`, so positive bars stack up
  from 0 and the negative tax bar stacks down from 0. Recharts' default
  `none` offset would start the positive bars at −tax. The vendored
  Recharts build includes the `sign` offset (checked).
- New `Bar`, placed after the `State Pension` bar and before the `Line`:

  ```js
  React.createElement(Bar, {
    isAnimationActive: false,
    dataKey: "Income Tax",
    stackId: "a",
    fill: "#64748b",
    radius: [0, 0, 3, 3]
  })
  ```

  Neutral slate is used because tax isn't an error and red is already the
  Target Expenses line. Series colours stay theme-invariant (spec 010
  decision 4).
- Add `React.createElement(ReferenceLine, { y: 0, stroke: isDark ? CHART_AXIS_COLOR.dark : CHART_AXIS_COLOR.light })`
  after `CartesianGrid` so the zero line is visible.
- `formatCurrencyK` (Y-axis ticks) now receives negatives, and today it
  renders "£-5k". Change it to
  ``v => `${v < 0 ? '−' : ''}£${Math.abs(Math.round((v || 0) / 1000))}k` ``.
  This also tidies `WealthChart`'s mortgage-debt ticks (**Resolution R12**).
- Card subtitle, `Your`/`Combined household` + `" income by source against
  target spending (inflation-adjusted)."`, becomes `... " income by source
  against target spending (inflation-adjusted). Income Tax is shown below
  the line."`

**`ChartTooltip` and the negative series (Resolution R13).** The tax
series is **not** added to `excludeFromTotal`. Netting it in makes the
existing total row mean "after-tax income (including savings draws), in
today's money". That is the same treatment `WealthChart` gives
`Mortgage Debt`. To make that explicit, `ChartTooltip` gains one optional
prop, `totalLabel = "Total (today's money)"`, rendered in place of the
literal. `IncomeChart` passes
`{ inflationRate, excludeFromTotal: ['Target Expenses'], totalLabel: "Total after tax (today's money)" }`.
`WealthChart` passes nothing new. Per-series rows keep today's
`Math.abs` display ("Income Tax £X"), consistent with "Mortgage Debt £X".

### 8. Lifetime tax total line (intent decision 15)

Inside the "Retirement Income vs Expenses" card, directly after the
`IncomeChart` element:

```js
React.createElement("div", {
  className: "mt-3 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap"
},
  React.createElement("p", { className: "text-sm text-slate-700" },
    "Estimated income tax over retirement: ",
    React.createElement("span", { className: "font-bold text-slate-900 tabular" }, formatCurrency(lifetimeTax.nominal)),
    " (", formatToday(lifetimeTax.today), " in today's money)"),
  React.createElement("span", {
    className: "text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-1"
  }, UK_REFERENCE.taxYear, " tax year")
)
```

The copy is exactly decision 15's. There is no commentary about reducing
it (decision 3). `formatToday` already adds "≈".

### 9. "Tax notes" panel (intent decisions 16–18)

#### 9.1 Fact-only wording rule (binding, verbatim)

> **Every Tax note states only what happens, when, and the relevant
> threshold, followed by a link to the HMRC/gov.uk page that sets it.
> A note never recommends, suggests or implies an action. The words and
> phrases "consider", "you should", "you could", "you may want",
> "to reduce", "to avoid", "instead", "better", "recommend", "optimise",
> "plan to" and any other imperative or advisory construction are
> forbidden in note text. The existing "not financial advice" footer
> remains the overarching disclaimer; notes do not repeat it.**

PR review must check each template below against this rule. No automated
check exists because the templates live outside the engine span.

#### 9.2 Templates (`taxNoteText`, module-level, outside the span)

`whose` = `isCouple ? `${name}'s` : 'your'`. `£` values go through
`formatCurrency`.

| `type` | Text | Link |
|---|---|---|
| `higherRate` | `From {year}, {whose} taxable retirement income ({amount}) is above the higher-rate threshold ({threshold}); income above that threshold is taxed at 40%.` | `incomeTax.source` / `sourceLabel` |
| `additionalRate` | `From {year}, {whose} taxable retirement income ({amount}) is above the additional-rate threshold ({threshold}); income above that threshold is taxed at 45%.` | `incomeTax.source` |
| `taper` | `From {year}, {whose} taxable retirement income ({amount}) is between {threshold} and the additional-rate threshold ({upper}). In this range the tax-free Personal Allowance goes down by £1 for every £2 of income above {threshold}, so income in this range is taxed at an effective rate of 60%.` | `incomeTax.source` |
| `lumpSumCapped` | `In {year}, {whose} tax-free lump sum is capped at the Lump Sum Allowance ({amount}). The remaining {excess} of the 25% stays in {whoseShort} pension and is taxed as income when it's drawn.` | `lumpSumAllowance.source` |
| `statePensionOverAllowance` | `From {year}, {whose} State Pension alone ({amount}) is above the Personal Allowance ({threshold}), so some Income Tax is due on it even without other income. The government has announced that, from 2027/28, people whose only income is the basic or new State Pension won't have to pay small amounts of tax on it through Simple Assessment. This projection doesn't include that change.` | `statePension.taxSource` |

`{whoseShort}` is `your` for an individual and `${name}'s` in a couple. Rates
(40%/45%/60%) and "25%" are read from `UK_REFERENCE` (`higherRate * 100`,
etc.; 60% = `(higherRate * 1.5) * 100`), not typed as literals. Example
(individual, default plan): "From 2058, your State Pension alone (£32,312)
is above the Personal Allowance (£28,759), ..."

#### 9.3 `TaxNotesPanel` — new module-level memoised component

This keeps to `CLAUDE.md` §5.3. It sits alongside `VerdictHero`/`AssumptionsPanel`.

```js
const TaxNotesPanel = memo(function TaxNotesPanel({ notes, isCouple, p1Name, p2Name }) {
  if (!notes.length) return null;
  const nameOf = i => (i === 0 ? p1Name : p2Name);
  return React.createElement("div", { className: "mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4" },
    React.createElement("div", { className: "flex items-center gap-2 mb-2" },
      React.createElement(Info, { className: "h-4 w-4 text-blue-600 flex-shrink-0" }),
      React.createElement("h3", { className: "text-sm font-bold text-slate-900" }, "Tax notes")),
    React.createElement("div", { className: "space-y-1.5" },
      notes.map(n => {
        const { text, href, label } = taxNoteText(n, nameOf(n.personIndex), isCouple);
        return React.createElement("p", { key: `${n.type}-${n.personIndex}`, className: "text-sm text-slate-700" },
          text, " ",
          React.createElement("a", { href, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 font-semibold" },
            label, " ↗"));
      })));
});
```

Render it directly after the lifetime-tax `div` (§8), inside the same card:
`React.createElement(TaxNotesPanel, { notes: taxNotes, isCouple, p1Name: d.p1.name, p2Name: d.p2.name })`.
It is neutral blue/info, never the red banner (decision 17). When there are
no notes, the panel does not render (**Resolution R14**). All colour
classes used have `.dark` overrides (checked). `text-blue-900`/`800` were
avoided because they don't.

### 10. Safe Withdrawal Rate tooltip and `VerdictHero` caveat

- **SWR slider `tooltip`** (decision 19): `"The 4% rule: withdraw 4% of the
  pot in year one, then increase with inflation each year."` becomes
  `"The 4% rule: withdraw 4% of the pot in year one, then increase with inflation each year. The rate applies to the amount taken out before Income Tax."`
- **`VerdictHero` caveat.** Replace the opening string
  `"Based on a fixed average return, no tax on retirement income, and no allowance for a bad run of returns early in retirement"`
  with
  `"Based on a fixed average return, estimated Income Tax at England, Wales and Northern Ireland rates, and no allowance for a bad run of returns early in retirement"`.
  The rest is unchanged: the `Info` tooltip, " — see Known limitations in
  the ", and the "Assumptions panel" button. The new wording was checked
  against the Wave 1 plain-language standard (`spec/done/013-wave-1-bundle.md`
  §4): everyday words, no "tax-band"/"marginal"/"nominal" jargon, and no
  tax-year label (decision 20).

### 11. "Assumptions & Disclaimers" → "How we calculate this" (intent decisions 21–22)

- Keep `id: "assumptions-disclaimers"`, the `showAssumptions` toggle and
  the `onShowFullAssumptions` handler exactly as they are, so the link from
  item 012 and `scrollAndHighlight` still work.
- `h2` text: `"Assumptions & Disclaimers"` → `"How we calculate this"`.
- `AssumptionsPanel` footer button: `"See full assumptions & disclaimers ↓"`
  → `"See how we calculate this ↓"` (**Resolution R15**, so the link names
  its target).
- A small module-level helper (a plain function, not a component):
  `const sourceLink = (href, label) => React.createElement("a", { href, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 font-semibold" }, label, " ↗");`

Expanded body, in order. Existing blocks are kept, new ones marked NEW,
and every figure is interpolated from `UK_REFERENCE` (`R` below):

1. NEW, first child: `React.createElement("p", { className: "text-xs text-slate-500" }, "Figures last updated: ", R.lastUpdated, " (", R.taxYear, " tax year)")`.
2. **Joint planning model**: unchanged.
3. **Investment growth**: unchanged.
4. **Safe withdrawal rate (4% rule)**: append " The rate applies to the
   amount taken out of the pension before Income Tax."
5. NEW **Income Tax**: "Income Tax is worked out for each person
   separately, every year, on their pension withdrawals plus their State
   Pension, using {region} rates for {taxYear}: a tax-free Personal
   Allowance of {PA}, 20% on income up to {HRT}, 40% above that, and 45%
   above {ART}. The Personal Allowance goes down by £1 for every £2 of
   income above {taper}. Money taken from ISAs, the LISA and other savings,
   and the tax-free lump sum, is not taxed. Tax is taken off your income,
   and any shortfall against your spending is covered from your savings in
   the usual order. Each person uses their own Personal Allowance."
   followed by `sourceLink(R.incomeTax.source, R.incomeTax.sourceLabel)`.
6. NEW **Tax thresholds in future years**: "The government has kept the
   Personal Allowance and the higher-rate threshold at today's amounts
   until 5 April 2031 (the end of the {freezeLastTaxYear} tax year). This
   projection keeps all the thresholds above, including {taper} and {ART},
   at today's amounts until then, and from the following tax year raises
   them each year by your inflation assumption. Future government policy
   may be different." followed by `sourceLink(R.incomeTax.freezeSource, R.incomeTax.freezeSourceLabel)`.
7. NEW **Tax-free lump sum**: "If you choose to take it, the tax-free lump
   sum is {25%} of your pension pot at retirement, up to the Lump Sum
   Allowance of {LSA} per person. If {25%} would be more than that, the rest
   stays in your pension and is taxed as income when you draw it. The
   allowance is kept at {LSA} in every future year." followed by `sourceLink(R.lumpSumAllowance.source, ...)`.
8. **PLSA Retirement Living Standards ({plsa.year})**: same sentence built
   from `R.plsa.single`/`couple` and `R.plsa.basis`, followed by
   `sourceLink(R.plsa.source, R.plsa.sourceLabel)`.
9. **State Pension**: "Full new State Pension is {fullNewAnnual}/year
   ({weekly}/week, {taxYear}), beginning at each person's State Pension
   age (rising 66→67). Actual amounts depend on NI record. The State
   Pension is taxable income. If it is more than the Personal Allowance on
   its own, some tax is due on it. The government has announced that from
   2027/28 people whose only income is the basic or new State Pension won't
   have to pay small amounts of tax on it through Simple Assessment; this
   projection doesn't include that." followed by
   `sourceLink(R.statePension.source, ...)` and `sourceLink(R.statePension.taxSource, ...)`.
10. **Allowances**: the existing sentence, templated from `R`, followed by
    NEW: "Pension contributions above the {AA} annual allowance (including
    employer contributions) are capped in this projection rather than
    taxed. The lower {MPAA} Money Purchase Annual Allowance, which applies
    once someone starts taking money flexibly from a pension while still
    paying in, can't arise here, because contributions stop in the same
    year withdrawals start." followed by links to annual allowance, MPAA, ISAs and Lifetime ISA.
11. NEW **Not included**: "Scottish Income Tax rates, tax on interest from
    savings outside ISAs (the Personal Savings Allowance), Marriage
    Allowance, Blind Person's Allowance and other reliefs are not included."
    followed by the four `R.notModelled` links (labels "GOV.UK: Scottish
    Income Tax", "GOV.UK: tax on savings interest", "GOV.UK: Marriage
    Allowance", "GOV.UK: Blind Person's Allowance").
12. **Important** (amber box): "For planning and illustration only — not
    financial advice. Retirement income tax is not modelled. Consult..."
    becomes "For planning and illustration only — not financial advice.
    Income Tax is an estimate using {region} rates and doesn't include every
    allowance or relief. Consult a qualified financial adviser for personal
    recommendations."

Link sentences are joined with `" · "` when a block has more than one link.

### 12. Footer

See the §1.4 table. Only the second `<p>` changes. The privacy line from
Wave 1 is untouched.

### 13. `docs/TOOL_DOCUMENTATION.md` updates (same PR)

- **Header block**: "Retirement income tax is not modelled." → "Income tax
  in retirement is estimated (England, Wales and Northern Ireland rates);
  see §4.3 and §7."
- **§1 table**: add "Income tax: rest-of-UK bands, thresholds frozen to
  2030/31 then inflation-uprated" beside "Tax year basis".
- **§3.4 Reading the outputs**:
  - Summary cards bullet: the income figure (cards, sticky bar, gauge) is
    now **after tax**.
  - Living Standard gauge bullet: the sub-line now shows Pension · State ·
    Tax.
  - Retirement Income vs Expenses bullet: add the "Income Tax" bar below
    the line, the tooltip total that is now after tax ("Total after tax
    (today's money)"), the lifetime-tax line with its today's-money
    equivalent (the sum of each year's deflated tax) and tax-year label,
    and the Tax notes panel.
  - "Can I retire?" bullet: the caveat now mentions estimated Income Tax
    rather than "no tax modelled".
  - "Your projection assumes..." bullet: the footer link now reads "See how
    we calculate this ↓".
- **New §3.10 "Income tax and 'How we calculate this'"**: a user-level
  explanation of what is taxed, per person, what isn't, the five Tax-note
  types (facts only, each linked to gov.uk), the collapsible "How we
  calculate this" section (renamed from "Assumptions & Disclaimers") with
  its "Figures last updated" line and source links.
- **§3.5 Warnings**: "Household income falls below the PLSA minimum" → "...
  (after tax) ...".
- **§4.2 At retirement**: step 1 becomes "**Tax-free lump sum** (if
  selected): min(25% of the pension, the £268,275 Lump Sum Allowance) moves
  into the S&S ISA; any excess over the allowance stays in the pension and
  is taxed as income when drawn. The allowance is per person and is not
  uprated in future years." Add a gov.uk link.
- **§4.3 Decumulation**: insert a new step between "Pension drawdown" and
  "Savings": "**Income tax**: each person's pension draw + State Pension,
  taxed against their own allowance; tax reduces net income, and the gap is
  funded from savings." Add a new sub-block, "Income tax model", with the
  `taxThresholdsFor`/`incomeTaxFor` formulas (as pseudo-code, like §4.1),
  the freeze-then-uprate rule (R1, R3), no gross-up (decision 8), the fact
  that savings/ISA draws and the lump sum are untaxed, and the per-person
  treatment. Also add **"Annual allowance and MPAA"**: the £60k cap is in
  the engine (§4.1); the MPAA cannot trigger because contributions stop in
  the drawdown year; so no code is needed (decision 4).
- **§4.7 Reference figures**: add a **Source** column holding the exact
  URLs from `UK_REFERENCE` (the verification table above). Add rows for
  Personal Allowance, taper, basic/higher/additional thresholds and rates,
  threshold freeze (to 5 April 2031, i.e. through 2030/31), Lump Sum
  Allowance, and MPAA (documentation only). Note that every figure lives in
  `UK_REFERENCE` in `index.html`.
- **§5.2 Architecture**: add `TaxNotesPanel` (memoised) and the new
  engine-span helpers (`taxThresholdsFor`, `incomeTaxFor`,
  `lifetimeTaxTotals`, `computeTaxNotes`, `deflate`) plus `UK_REFERENCE`.
- **§5.3**: add `TaxNotesPanel` to the list of module-level, memoised
  components.
- **§5.4 Verification**: amend "Lump sum leaves precisely 75% in the
  pension" to "...when 25% is within the Lump Sum Allowance". Add these
  items:
  - Band boundaries: tax is correct at, £1 below and £1 above the
    Personal Allowance, the higher-rate threshold and the additional-rate
    threshold.
  - The £100k taper: an effective 60% marginal rate between £100,000 and
    £125,140, with the allowance reaching zero at £125,140.
  - Per-person allowances in joint mode: two £20k incomes are taxed as
    £1,486 each, not as one £40k income (£5,486).
  - The freeze-then-uprate threshold path: frozen through 2030, uprated by
    the inflation input from 2031, and unchanged forever at 0% inflation.
  - The Lump Sum Allowance cap: the lump sum is min(25%, £268,275), the
    excess stays in the pension, and the initial withdrawal is taken from
    the larger remaining pot.
  - ISA/LISA/other-savings withdrawals are never taxed.
  - The extra savings draw equals the tax when spending equals the gross
    pension draw.
  - Changing the withdrawal rate changes the tax.
  - `lifetimeTaxTotals` today's-money figure equals the sum of each year's
    deflated tax.
  - `computeTaxNotes` first-year and strict-boundary behaviour.
  - Remove the line "Individual-mode results are identical before and
    after the joint-planning rewrite" only if it's reworded. Keep it, but
    note that the baseline was deliberately regenerated for 018.
- **§7 Known limitations**: replace #1 **in place** (keeping the numbering
  of #2–#11, which other text refers to as "#6"/"#9") with: "**Income tax
  is estimated, not exhaustive.** Modelled: rest-of-UK income tax on
  pension drawdown and State Pension, per person, with the £100k taper,
  thresholds frozen to 2030/31 and then inflation-uprated. Not modelled:
  (a) Scottish rates (roadmap #27); (b) tax on non-ISA savings interest
  (Personal Savings Allowance); (c) Marriage Allowance, Blind Person's
  Allowance and other reliefs; (d) the announced 2027/28 easement for
  pensioners whose only income is the State Pension; (e) threshold paths
  other than freeze-then-inflation; (f) no gross-up, so drawdown stays at
  the 4%-rule gross amount and tax is covered from savings." Each item has
  its gov.uk link. (d) cites the Commons Library briefing (Q1).

### 14. Tests (`tests/test-engine.js`)

**Harness plumbing.**

- `loadEngine` appends `var __UK_REFERENCE = UK_REFERENCE;` beside
  `__CURRENT_YEAR`.
- Add sanity checks that `taxThresholdsFor`, `incomeTaxFor`,
  `lifetimeTaxTotals`, `computeTaxNotes` and `deflate` are functions after
  the eval.
- Wrap object-returning ones (`taxThresholdsFor`, `lifetimeTaxTotals`,
  `computeTaxNotes`, `UK_REFERENCE`) in the existing
  `JSON.parse(JSON.stringify(...))` cross-realm round trip.
- Update the header comment to mention the new names.

A shared fixture helper follows the existing `person()` style, as a
retired-from-y=0, no-growth, zero-inflation individual:
`currentAge: 66, retirementAge: 66, statePensionAge: 99,
statePensionAmount: 0`, every growth/contribution 0, `takeLumpSum: false`,
`inheritanceAge: 999`.

New `check(...)` cases. Expected values come from the prototype and are
exact after rounding:

1. **Band boundaries.** Run `incomeTaxFor(x, taxThresholdsFor(2026, 3))`
   over every row of the §2 table.
2. **Taper.** 100,002 − 100,000 → +1.20. The allowance is zero at 125,140.
   150,000 → 53,703.
3. **Freeze-then-uprate.** The PA is 12,570 for 2026–2030 at 3%. 2031 →
   12,570 × 1.03. 2035 at 2% → 12,570 × 1.02⁵. 2060 at 0% → 12,570. The
   taper/ART identity (`taper + 2·PA === ART`) holds in 2040 at 3%.
4. **Per-person allowances in joint mode.** A couple, each with a £500,000
   pot at `withdrawalRate: 4` (a £20,000 draw each) → `p1Tax === 1486`,
   `p2Tax === 1486`, `incomeTax === 2972`. The same household as one person
   with £1,000,000 → `incomeTax === 5486`.
5. **LSA cap.**
   - A £2,000,000 pot with `takeLumpSum: true` → `p1LumpSum === 268275`,
     `p1LumpSumExcess === 231725`, `p1Pension === 1731725`,
     `p1SsIsa === 268275`, `pensionWithdrawal === 69269`,
     `p1Tax === 15140`.
   - Exactly at the cap (£1,073,100) → lump 268,275, excess 0.
   - Below (£1,000,000) → lump 250,000, `p1Pension === 750000`, excess 0.
   - A couple where only one person is over the cap → only that person has
     an excess.
6. **ISA/savings untaxed.** Pension 0, SP 0, ssIsa 500,000, cash 20,000,
   other 30,000, expenses 50,000 → `incomeTax === 0` every row, while
   `isaWithdrawal + otherSavingsWithdrawal === 50000`. Also assert
   `incomeTax === 0` on every row of the existing `SCENARIO_DRAW_ORDER`.
7. **Tax widens the savings draw.** A £1,000,000 pot, expenses 40,000,
   ssIsa 100,000 → `pensionWithdrawal === 40000`, `incomeTax === 5486`,
   `isaWithdrawal === 5486`, `netIncome === 34514`.
8. **Withdrawal rate changes tax.** The same with `withdrawalRate: 5` →
   `pensionWithdrawal === 50000`, `incomeTax === 7486`,
   `isaWithdrawal === 0`.
9. **State Pension is taxable, freeze interaction.** Age 62 retired, SP
   12,548 from 67, 3% inflation: 2031 row → `p1StatePension === 14547`,
   `p1Tax === 320`; the 2030 row → tax 0.
10. **`lifetimeTaxTotals`.** On `BASELINE_INPUT`, `today` equals the sum of
    `deflate(r.incomeTax, r.year, 3)` over 2056–2086. Negative check: it is
    ≠ `deflate(nominal, 2086, 3)`.
11. **`computeTaxNotes`.**
    - The LSA fixture yields `lumpSumCapped` and `higherRate` notes for
      person 0 in 2026, and no `additionalRate`/`taper` notes.
    - A £2,750,000 pot (a £110k draw) yields a `taper` note (amount 110000)
      and no `additionalRate` note.
    - A £3,750,000 pot (£150k) yields `higherRate` + `additionalRate` and
      no `taper`.
    - A person with income exactly 50,270 yields no `higherRate` note.
    - Fixture 9 yields `statePensionOverAllowance` in 2031.
    - In a couple, notes carry the right `personIndex`.
    - Rows after `planEnd` are ignored.
12. **Existing checks.** The prototype confirms that all 20 current checks
    pass unchanged. Don't edit them, apart from the baseline (§15).

Scenario names follow the file's convention (`SCENARIO_TAX_...`), each with
a "Covers:" comment.

### 15. Individual-mode baseline regeneration (intent decision 11)

This is deliberate and reviewed:

1. **Before** any engine edit, on the implementation branch, run
   `node tests/test-engine.js` (green) and keep a copy of the current
   `tests/fixtures/individual-baseline.json`.
2. Implement §1–§4, then run `node tests/test-engine.js`. Every check
   except the byte-for-byte baseline should pass.
3. Run `node tests/test-engine.js --update-baseline`, then
   `node tests/test-engine.js` (green). Diff the old and new fixtures.
   Expected (from the prototype, default plan):
   - Every row gains the 10 new `p1*/p2*` fields plus `incomeTax` and
     `netIncome`.
   - Existing fields differ only from 2056 (the retirement year) onward.
   - The LSA **binds** on the default plan: the 25% would be £285,410, so
     the lump is £268,275 and £17,135 stays in the pension.
   - In 2056, pension draw 34,249 → 34,935 and ISA draw 55,560 → 56,439.
     Tax is £1,565.
   - In 2058, when the State Pension starts, tax is £8,123 and the ISA draw
     26,631 → 34,027.
   - Final row (2091): `totalIsa` 525,244 → 0 and `totalPension` 684,991 →
     698,699.
   - No depletion before or after, so the verdict stays "On track".
   - Lifetime tax 2056–2086 is £370,489 (≈ £92,769 in today's money).
4. Re-confirm these figures against the real implementation. Record the
   confirmed before/after and the reason in `CHANGELOG.md` (§17).

**PR checklist** (added to the PR description):

- [ ] every `UK_REFERENCE` URL opened in a browser and its figure confirmed;
- [ ] the fact-only wording rule (§9.1) checked against every template;
- [ ] baseline diff reviewed.

### 16. `sw.js` and `USER_CHANGELOG`

`CACHE`: `'retirement-planner-v12'` → **`'retirement-planner-v13'`**.

This change is user-facing (calculation, new UI and a renamed section).
New first entry:

```js
{
  version: 'v13',
  date: '2026-MM-DD', // set to the actual merge date
  title: 'Income Tax is now included in your projection',
  items: [
    'Your projection now works out Income Tax on each person\'s pension withdrawals and State Pension every year, using England, Wales and Northern Ireland rates. Your income figures, Living Standard and "Can I retire?" verdict are now after tax, so savings may run down sooner than before.',
    'The Retirement Income chart shows each year\'s tax as a bar below the line, with an estimate of the total tax over your retirement underneath. A short "Tax notes" list points out facts that apply to your plan — for example, reaching the higher-rate threshold — each with a link to the official GOV.UK page.',
    'The tax-free lump sum is now limited to £268,275 per person (the Lump Sum Allowance). Anything above that stays in your pension.',
    '"Assumptions & Disclaimers" is now called "How we calculate this", with a new Income Tax section, the date the figures were last updated, and GOV.UK links beside each figure.'
  ]
}
```

### 17. `CHANGELOG.md` entry

Under `## YYYY-MM-DD — UK income tax in retirement, Lump Sum Allowance, reference figures, methodology (018)`:

- It implements `intent/018-uk-income-tax.md` / `spec/018-uk-income-tax.md`,
  covering roadmap #3, #12, #26 and #19 in one requirement (decision 22),
  with `sw.js` going `v12` → `v13`.
- **Why**: this closes the tool's headline caveat (known limitation #1).
- **What**:
  - `UK_REFERENCE` and the full rewire list.
  - `taxThresholdsFor`/`incomeTaxFor`, per-person tax inside
    `projectJoint()`, with the gap funded from savings and no gross-up.
  - The LSA cap, with the excess staying in the pension.
  - New row fields.
  - After-tax income figures, the tax bar, the lifetime total, Tax notes,
    the SWR tooltip, the `VerdictHero` caveat, and "How we calculate this".
  - AA/MPAA explained in the docs only.
- **Baseline regenerated deliberately**: the confirmed before/after figures
  from §15 step 3 and the reason (tax is always on per decision 11, and the
  LSA binds on the default plan).
- The resolutions R1–R15.

### 18. Manual verification

Check in individual and couple mode, light and dark, desktop and a narrow
phone:

- **After-tax labels.** The cards read "…Income after tax". The sticky bar
  reads "Income after tax" without wrapping badly.
- **Living Standard sub-line.** Pension + State − Tax equals the big figure.
- **Tax bar.** The Income chart shows the grey tax bar below zero, the Y
  axis shows "−£5k"-style ticks, and the tooltip lists "Income Tax" and
  "Total after tax (today's money)".
- **Lifetime tax line.** It shows a nominal figure, "≈ … in today's money"
  and a "2026/27 tax year" pill.
- **Tax notes.**
  - The panel is blue/neutral, lists the notes in year order with names in
    couple mode, has working gov.uk links (new tab), and reads well in dark
    mode.
  - Moving the Safe Withdrawal Rate slider changes the tax figures and
    notes live.
  - A £1.5m+ pension pot shows the Lump Sum Allowance note and the
    per-person "Incl. £268,275 tax-free lump sum".
- **Methodology section.** "How we calculate this" opens from the
  Assumptions panel link (scroll + highlight still work), shows "Figures
  last updated: 6 April 2026 (2026/27 tax year)", and every link opens.
- **Footer and caveat.** The footer reads "Based on 2026/27 UK tax year
  figures…". The `VerdictHero` caveat no longer says "no tax".
- **Tests.** `node tests/test-engine.js` passes.

## Non-goals

Carried over from the intent: no advice or tax-reduction suggestions; no
Scottish rates; no savings-interest tax, Marriage Allowance or other
reliefs; no gross-up; no modelling of the State-Pension-only easement; no
tax on/off switch; no AA/MPAA code; no #24/#25/#11; no new red warnings.
Also: no change to `household`'s existing mixed nominal/today's-money
basis (R9); no fix for the pre-existing no-op Tailwind classes (Q5); no
PLSA figure update (Q2); no cash-ISA-limit or LISA-age-50 modelling (Q3).

## Constraints

- Single-file PWA. One `CACHE` bump (`v13`).
- `SliderWithInput`, `PersonInputs`, `ChartTooltip`, `WealthChart`,
  `IncomeChart`, `VerdictHero`, `AssumptionsPanel` and the new
  `TaxNotesPanel` are module-level and memoised. `taxNoteText`,
  `sourceLink` and `formatToday` are plain module-level functions.
- `UK_REFERENCE` and every tax helper live inside `ENGINE-EXTRACT` spans.
- Docs (§13), `CHANGELOG.md` (§17) and `USER_CHANGELOG` (§16) go in the
  same PR. The PR also moves `intent/018-uk-income-tax.md` and this spec to
  `done/` and removes `plan.md`.
- Branch: `claude/pensive-newton-rymumn` (harness-assigned). Draft PR into
  `main` after this spec's commit. `main` is branch-protected.

## Open questions / resolutions

Resolutions made in this spec, where the intent left the point open:

- **R1.** Row year Y ≙ tax year Y/Y+1; frozen through row 2030 (2030/31),
  uprated from 2031. The **freeze end date was verified**: thresholds kept
  "until 5 April 2031". This matches the intent's assumption.
- **R2.** The lump-sum checkbox label now shows "(up to £268,275)", built
  from `UK_REFERENCE`.
- **R3.** All four thresholds, including £100k and £125,140, freeze and
  uprate together, which keeps the taper consistent.
- **R4.** There is no rounding inside the calculation. Rows round per
  field, and `incomeTax = p1Tax + p2Tax`.
- **R5.** The LSA is fixed nominally and never uprated.
- **R6.** The lifetime tax window runs from `firstRet` to `planEnd`
  inclusive. Today's money is Σ of each year's deflated tax.
- **R7.** Notes use strict ">" comparisons. The taper zone is strictly
  between the taper threshold and the ART. Only rows up to `planEnd` count.
  Notes are sorted by year, then person, then type.
- **R8.** `deflate` moves inside the engine span so it can be tested.
- **R9.** The household tax uses the same helper on the card's own
  components (so the sub-line adds up), not `row.incomeTax`. The existing
  mixed basis is kept.
- **R10.** The sticky bar label is "Income after tax". The full cards read
  "Household/Annual Income after tax".
- **R11.** "Tax −£Z" in the sub-line shows only when tax > 0.
- **R12.** `formatCurrencyK` renders negatives as "−£Xk" (this also affects
  `WealthChart` ticks).
- **R13.** Tax is netted into the IncomeChart tooltip total, relabelled
  "Total after tax (today's money)" via a new `totalLabel` prop. Per-series
  rows keep `Math.abs`.
- **R14.** The Tax notes panel is hidden when there are no notes.
- **R15.** The `AssumptionsPanel` link text becomes "See how we calculate
  this ↓".

Open questions for the user:

- **Q1.** No gov.uk page for the Budget 2025 State-Pension-only easement
  turned up (only the Commons Library briefing CBP-10250). The in-app note
  links the gov.uk "How your State Pension is taxed" page. The docs cite
  the Commons Library. Is a parliament.uk link acceptable in the docs, or
  should someone find the Budget 2025 document on gov.uk by hand?
- **Q2.** The PLSA site couldn't be fetched. One-person Moderate/Comfortable
  (£31,700 / £43,900) weren't confirmed by search. The standards are now
  branded "Pensions UK", and a 2026/27 update may exist. This spec keeps
  the 2025/26 figures (the intent didn't ask to update them). Should a
  refresh be a follow-up item?
- **Q3.** From April 2027 the cash ISA limit falls to £12,000 for under-65s,
  and LISA contributions stop at age 50. Neither is modelled today. Should
  both become roadmap items?
- **Q4.** `CLAUDE.md` still says "Retirement income tax is not modelled."
  Should the implementing PR update that line too? It's the project's
  agent-instruction file, so this is flagged rather than mandated.
- **Q5.** These classes already in the page are absent from the inlined
  Tailwind build and do nothing: `underline`, `mt-4`, `pt-2`, `space-y-1`,
  `space-y-2`, `gap-1`, `hover:text-blue-700`, `hover:text-slate-700`.
  Some were added by the Wave 1 bundle (the tooltip's `pt-2`, the
  `VerdictHero` link's `underline`). This spec avoids them. Should fixing
  them be a separate chore?
- **Q6.** Every URL was confirmed from the search index, not loaded
  directly, because the egress proxy blocked gov.uk. The PR checklist
  requires a manual click-through before the PR is marked ready.

## User decisions on the open questions (2026-09-22)

These supersede anything above that conflicts with them.

- **Q1 — accepted.** The docs may cite the House of Commons Library
  briefing (CBP-10250) for the State-Pension-only easement. The in-app note
  keeps the gov.uk "How your State Pension is taxed" link.
- **Q2 — refresh the PLSA figures now, in this PR.** Replace the 2025/26
  figures with the **2026 Retirement Living Standards** (published by
  Pensions UK, May 2026; calculated by the Centre for Research in Social
  Policy, Loughborough University). Annual, after tax, excluding housing:

  | | Minimum | Moderate | Comfortable |
  |---|---|---|---|
  | One-person | £13,900 | £32,700 | £45,400 |
  | Two-person | £22,500 | £45,400 | £62,700 |

  Put them in `UK_REFERENCE`. The label becomes "Retirement Living
  Standards 2026 (Pensions UK, formerly the PLSA)", and wherever the UI
  names the source, say "Pensions UK". The `PLSA` alias and the
  `livingStandardFor()` logic are unchanged. The source URL is
  `https://www.retirementlivingstandards.org.uk/news/2026-rls-update`.
  It was confirmed via search across several independent sources (Pensions
  UK, Loughborough University, others), not loaded directly, because this
  environment's egress proxy blocks the site. It joins the manual
  click-through list. Check that the gauge range (`gMin`/`gMax`) still
  contains every band: the new two-person Comfortable figure is £62,700,
  inside the current £70,000 maximum. Every user-facing string, doc
  (§4.7) and test fixture that hard-codes the old figures or "PLSA
  2025/26" is updated. The `CHANGELOG.md`/`USER_CHANGELOG` entries note
  the refresh.
- **Q3 — add to the roadmap (done separately, not in this PR).** The
  April 2027 Cash ISA limit for under-65s, and LISA contributions ending at
  age 50.
- **Q4 — update `CLAUDE.md` in this PR.** Its "Retirement income tax is not
  modelled" line is replaced with an accurate one-line summary (rest-of-UK
  income tax on pension drawdown and State Pension is modelled; see
  `docs/TOOL_DOCUMENTATION.md` §4 and §7 for scope and limits). The
  "Reference figures" convention line is updated to point at
  `UK_REFERENCE` and to name the 2026 Retirement Living Standards.
- **Q5 — not now.** No styling or Tailwind-class fixes in this PR or as an
  immediate follow-up. Keep avoiding those classes in new markup.
- **Q6 — unchanged.** The user clicks through every source link by hand
  before the PR is marked ready.
