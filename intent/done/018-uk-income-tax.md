# 018 — UK income tax in retirement (with Lump Sum Allowance, centralised reference figures, and methodology section)

## Status

Resolved via the `grilling` skill, run in four rounds (22 questions). One
intent covering four Notion roadmap items delivered as a single
requirement — **#3** (UK tax and pension modelling), **#12** (Lump Sum
Allowance cap), **#26** (centralised UK reference figures with a visible
tax-year indicator) and **#19** (dated "How we calculate this"
methodology section). The user chose to take these on now, ignoring the
roadmap's wave order (#3 sits in Wave 4, behind Waves 2–3 and behind #11/
#26 within Wave 4). Unlike the Wave 1 bundle (one intent file per item),
these four were interrogated as one design tree and depend on each other
— the tax bands live in #26's reference object, the HMRC links live in
#19's section, and #12's cap feeds the tax model — so they share one
intent file (decision 22).

## Problem

Raised via the project's Notion roadmap — High priority item #3, the
reviewer's #3: "Deepen UK tax and pension modelling as the core
differentiator: income tax and personal allowance on pension drawdown in
retirement (State Pension is taxable income too), the £60,000 annual
allowance / £10,000 MPAA, and a lifetime-tax-paid view with suggestions
for reducing it." It closes `docs/TOOL_DOCUMENTATION.md` §7 known
limitation #1 — "Income tax in retirement is not modelled" — the tool's
own headline caveat.

What's actually there today:

- **No income tax anywhere in `projectJoint()`.** Each year, spending
  (`targetExpenses`) is funded by the State Pension (gross), then the
  4%-rule pension drawdown (gross — `initialWithdrawal` fixed at
  retirement and inflation-uprated), then any remaining gap from savings
  in the fixed order other savings → Cash ISA → S&S ISA → LISA (60+).
  Both State Pension and pension drawdown count toward spending at full
  gross value.
- **The spending target is effectively an after-tax figure**, and the
  PLSA Retirement Living Standards it's compared against are after-tax
  figures too.
- **The £60,000 pension annual allowance is already hard-capped** inside
  the engine (`cap = 60000`, contributions `min(employee + employer,
  cap/12)` per month), and warned about in the warning banner.
- **The MPAA (£10,000) cannot trigger in the current model.** It applies
  when someone flexibly accesses a DC pension while still contributing;
  here contributions stop in exactly the year drawdown starts, and there
  is no phased retirement.
- **The 25% lump sum is already modelled as tax-free** (moved into the
  S&S ISA at retirement), but **uncapped** — no Lump Sum Allowance
  (£268,275) limit (roadmap #12).
- **Tax is naturally per person.** Pension draws (`penDraws`) and State
  Pension are already computed per person inside the engine; each person
  has their own personal allowance.
- **Reference figures are scattered.** `PLSA` is its own constant; the
  State Pension, allowance limits and £60k cap are string literals or
  local constants in tooltips, warnings, the engine and the
  "Assumptions & Disclaimers" section; the footer hard-codes "Based on
  2026/27 UK tax year allowances...". No figure carries a source link.
- **The collapsible "Assumptions & Disclaimers" section** already holds
  reference figures (PLSA bands, State Pension, allowances), the
  joint-model explanation and the legal disclaimer, and item 012's
  `AssumptionsPanel` links down to it.
- **`VerdictHero`'s caveat** currently says the projection has "no tax on
  retirement income".
- **`tests/fixtures/`** holds a byte-for-byte individual-mode regression
  baseline that any change to engine output will break.
- Next intent number available: 018.

## Outcome

Resolved via `grilling`:

### Scope

1. **Take #3 on now, plus closely linked items; ignore the wave order.**
   Core income tax needs no new user inputs (bands and allowances are
   reference figures, tax is computed from income the app already
   knows), so #11's "don't overwhelm casual users" rationale for going
   first doesn't apply.
2. **In scope: #3's income tax + tax-paid display, #12, #26, #19.** Out
   of scope: #24 (ISA/LISA hard caps — not tax, and has its own unresolved
   "which account absorbs the cut" question), #25 (defined-benefit
   pensions — a new input domain deserving its own requirement), #11
   (Simple/Advanced mode — not needed, no new inputs).
3. **No advisory content, ever.** #3's "lifetime-tax view with
   suggestions for reducing it (withdrawal order, PCLS timing, State
   Pension timing...)" — the *suggestions* part — is **dropped, not
   deferred**: this tool is not financial advice. Facts are fine
   (decisions 15–17); recommendations are not.
4. **Annual allowance / MPAA — documentation only, no code.** The £60k
   allowance is already capped in the engine; the MPAA can't trigger
   because contributions stop exactly when drawdown starts. Both are
   explained in the docs so the absence isn't mistaken for a gap.

### Tax model

5. **Rest-of-UK bands only** (England, Wales, Northern Ireland). Scottish
   rates need a residency input and a second band table; recorded as a
   known limitation and added to the Notion roadmap as new item **#27**
   (done during grilling).
6. **Band structure**: personal allowance £12,570, tapered by £1 for every
   £2 of adjusted income above £100,000; basic rate 20%, higher rate 40%
   above £50,270, additional rate 45% above £125,140 (2026/27 figures,
   verified against HMRC/gov.uk at spec stage). Not modelled: tax on
   interest from non-ISA "other savings" (Personal Savings Allowance),
   Marriage Allowance, Blind Person's Allowance, or any other reliefs —
   each becomes a known-limitation entry referencing the relevant
   HMRC/gov.uk page.
7. **Per person.** Each person's taxable income is their own pension
   drawdown plus their own State Pension, taxed against their own
   personal allowance. Savings/ISA withdrawals (and the tax-free lump sum)
   are not taxable income.
8. **Tax reduces net income; the 4%-rule draw stays gross.** The pension
   drawdown remains the fixed gross 4%-rule amount (the rule is defined
   on the gross pot withdrawal); income tax is deducted from gross State
   Pension + drawdown to give net income, and the larger resulting gap
   against the (after-tax) spending target is funded from the existing
   tax-free savings tiers in the existing order. Not a gross-up.
9. **Recomputed live from every input, including the withdrawal-rate
   slider.** Tax is computed inside `projectJoint()` from each year's
   actual draws, so changing the Safe Withdrawal Rate (or any other
   input) changes the draws and therefore the tax — no cached or static
   tax figure anywhere. Everything built on `projectJoint()` (verdict,
   supportable-age search, charts, breakdown) picks it up automatically.
10. **Thresholds frozen through 2030/31, then inflation-uprated.** Matches
    announced policy (the income tax threshold freeze end date to be
    verified against gov.uk at spec stage). From the first tax year after
    the freeze, allowance and band thresholds rise with the household
    inflation input `d.infl`. The announced easement for pensioners whose
    only income is the State Pension (once it exceeds a frozen personal
    allowance) is **not modelled** — known limitation, flagged factually by
    decision 16's fifth note type.
11. **Always on, no toggle.** Tax is a correctness fix to the tool's
    biggest documented caveat; an "ignore tax" switch would reintroduce
    it. Every projection changes (pots deplete sooner; some plans'
    verdict flips). The individual-mode regression baseline in
    `tests/fixtures/` is regenerated deliberately, with the before/after
    change and the reason recorded in `CHANGELOG.md`.

### Lump Sum Allowance (#12)

12. **Tax-free cash = min(25% of the pot, £268,275).** When 25% exceeds
    the Lump Sum Allowance, the excess **stays in the pension** and is
    taxed as income when later drawn — no one-off taxable payment at
    retirement. Per person (each has their own allowance). Documented
    explicitly in `docs/TOOL_DOCUMENTATION.md` §4.2 and the in-app
    methodology section, with the HMRC/gov.uk reference.

### What the user sees

13. **Income figures become after-tax.** The single income figure feeding
    the Household/Annual Income card, the Living Standard card, the
    sticky mobile bar and the PLSA gauge becomes net of income tax,
    labelled as after-tax. The Living Standard card's sub-line becomes
    "Pension £X · State £Y · Tax −£Z". (Makes the PLSA comparison fairer,
    since the bands are after-tax.)
14. **Income chart — a negative "Income tax" bar per year.** Stacked
    below the axis in `IncomeChart`, so each year's bars visibly net
    down. No second axis.
15. **Lifetime tax total — one factual line** under the income chart:
    "Estimated income tax over retirement: £X (≈ £Y in today's money)",
    with a "2026/27 tax year" label (decision 20). No commentary on
    reducing it (decision 3).
16. **"Tax notes" — facts highlighted, not advice.** Five note types, per
    person, shown for the first year each applies:
    1. taxable retirement income exceeds the **higher-rate threshold**
       (40%);
    2. it exceeds the **additional-rate threshold** (45%);
    3. it falls in the **personal allowance taper** zone (£100,000 to the
       additional-rate threshold), where the effective marginal rate is
       60%;
    4. the tax-free lump sum is **capped at the Lump Sum Allowance**;
    5. the **State Pension alone exceeds the personal allowance**, so some
       tax is due on it even with no other income.
    (The user explicitly overruled a recommendation of "no new warnings":
    these are facts, and highlighting facts isn't advice.)
17. **Neutral "Tax notes" panel, not the red warning banner.** Styled as
    informational (neutral/blue), placed next to the lifetime tax line.
    The existing red banner stays reserved for genuine problems
    (over-allowance contributions, funds running out) — being a
    higher-rate taxpayer isn't an error.
18. **Fact-only wording rule, written into the spec.** Each note states
    what happens and when, with a link to the relevant HMRC/gov.uk page —
    e.g. "From 2041, Alex's taxable retirement income (£54,200) is above
    the higher-rate threshold (£50,270); income above that threshold is
    taxed at 40%." Never "consider", "you should", "to reduce this", or
    any other recommendation. The existing "not financial advice" footer
    remains the overarching disclaimer.
19. **Safe Withdrawal Rate tooltip** gains one factual line: the rate is
    applied before tax.

### Reference figures and methodology (#26, #19)

20. **One tax-year-tagged reference object (#26).** Every UK reference
    figure — income tax bands and allowances, the freeze end year, State
    Pension, pension annual allowance, ISA/LISA limits, LISA bonus, Lump
    Sum Allowance, PLSA bands — moves into a single object tagged with
    its tax year, each figure carrying its source URL. The footer's
    "Based on 2026/27..." line, the methodology section, and the tax
    figures' "2026/27 tax year" label all read from it, so next year's
    update is one block. No tax-year label is added elsewhere (e.g. the
    Assumptions panel).
21. **"Assumptions & Disclaimers" becomes "How we calculate this" (#19).**
    The existing collapsible section is extended rather than duplicated:
    a "Figures last updated: 6 April 2026 (2026/27 tax year)" line, a new
    tax section (bands, freeze assumption, per-person treatment, Lump Sum
    Allowance handling, AA/MPAA explanation), and HMRC/gov.uk links beside
    each figure. Existing links into the section (item 012's panel) keep
    working.
22. **HMRC/gov.uk links in both places.** A source link beside each figure
    in `docs/TOOL_DOCUMENTATION.md` §4.7 and in the in-app methodology
    section. Every URL is verified to load at spec stage — none written
    from memory.

## Non-goals

- No advice of any kind: no tax-reduction suggestions, no "consider"
  prompts, no optimisation of withdrawal order, PCLS timing or State
  Pension timing (decision 3).
- No Scottish income tax (decision 5; roadmap #27).
- No tax on non-ISA savings interest, no Marriage Allowance or other
  reliefs (decision 6).
- No gross-up of pension drawdown to hit a net income target (decision 8).
- No modelling of the State-Pension-only easement (decision 10).
- No on/off switch for tax (decision 11).
- No MPAA or annual-allowance code changes (decision 4).
- No #24, #25 or #11 (decision 2).
- No new red warnings — tax facts go in the neutral "Tax notes" panel
  (decision 17).

## Constraints

- **High-stakes calculation change.** `projectJoint()` changes. Per
  `CLAUDE.md`, validate against `docs/TOOL_DOCUMENTATION.md` §5.4 and add
  new §5.4 checklist items: band boundaries (at, just below, just above
  each threshold), the £100k taper, per-person allowances in joint mode,
  the freeze-then-uprate threshold path, the Lump Sum Allowance cap and
  excess-stays-in-pot behaviour, and that ISA/savings withdrawals are
  untaxed. `tests/test-engine.js` gains matching cases; the individual
  baseline fixture is regenerated deliberately (decision 11).
- **Docs in the same PR** (`CLAUDE.md`): §3 user guide (after-tax
  figures, income chart tax bar, lifetime total, Tax notes, methodology
  section), §4.2 (Lump Sum Allowance), §4.3 (tax in decumulation), §4.7
  (reference figures with source links, tax bands, freeze), §5.4 (new
  checklist items), §7 (replace limitation #1 with the remaining gaps:
  Scotland, savings interest, reliefs, the State-Pension-only easement).
- `CHANGELOG.md` entry (including the baseline regeneration and why) and
  a `USER_CHANGELOG` entry — this is user-facing.
- Single-file PWA; one `sw.js` `CACHE` bump.
- `SliderWithInput`, `PersonInputs`, `ChartTooltip`, `WealthChart`,
  `IncomeChart`, `VerdictHero` and any new components stay module-level
  and memoised (`CLAUDE.md` §5.3). The tax calculation lives inside the
  `ENGINE-EXTRACT` span so `tests/test-engine.js` can exercise it.
- Interacts with already-shipped Wave 1 features: `VerdictHero`'s caveat
  wording ("no tax on retirement income") must change; the today's-money
  dual display (`deflate`/`formatToday`) applies to the lifetime tax
  total; the Pot "Explain this" breakdown is unaffected in structure
  (tax is paid out of draws, not from the pot) but its withdrawals line
  will reflect the larger savings draws.
- This session continues on the harness-assigned branch
  `claude/pensive-newton-rymumn`, restarted from `main` after PR #16
  merged.
