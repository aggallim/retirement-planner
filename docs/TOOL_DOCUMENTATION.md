# UK Retirement Planner — Tool Documentation

> Source of truth for this doc is the project's Notion page. This copy is kept in-repo for reference alongside the code.

**What this is:** a self-built UK retirement planning calculator. Single-page React app, supports individual or joint (couple) planning, packaged as an installable phone app (PWA).

**Status:** built and verified.

**Not financial advice** — illustrative planning only. Income tax in retirement is estimated (England, Wales and Northern Ireland rates); see §4.3 and §7.

---

## 1. Overview

A year-by-year retirement projection tool covering pensions, ISAs, the State Pension, mortgage runoff and inheritance, benchmarked against the Retirement Living Standards (published by Pensions UK, formerly the PLSA).

It answers three questions:

1. **How big will the pot be** at retirement, per person and combined?
2. **What sustainable income** does that produce, and what living standard does it buy?
3. **Will the money last** to the end of the plan horizon?

| Aspect | Detail |
|---|---|
| Form factor | Single-file React app; also packaged as an offline PWA |
| Planning modes | Individual, or joint with a partner (toggleable) |
| Projection span | Current age through to age 100, anchored on calendar years |
| Tax year basis | 2026/27 allowances; Retirement Living Standards 2026 (Pensions UK) |
| Income tax | Rest-of-UK bands, thresholds frozen to 2030/31 then inflation-uprated |
| Data storage | Browser localStorage on-device only. Nothing leaves the device. The optional feedback form (§3.12) is a separate Google Form that receives only what the user types. |

---

## 2. Requirements built to

### 2.1 Original brief

A sophisticated, production-grade UK retirement calculator with exceptional design quality — premium financial services aesthetic, distinctive typography (explicitly not Inter/Roboto), meaningful colour coding, smooth animations, card-based layout.

**Inputs required:**
- **Personal** — current age (18–80), retirement age (50–75, must exceed current), life expectancy (85–100)
- **ISA** — current balance, monthly contribution, growth profile Poor 2% / Average 5% / Aggressive 8%
- **Pension** — pot value, employee and employer monthly contributions, growth profile Poor 3% / Average 6% / Aggressive 9%, optional 25% tax-free lump sum
- **Living costs** — annual expenses, monthly mortgage, years remaining, optional healthcare costs
- **Other income** — State Pension age and amount, expected inheritance and age received
- **Assumptions** — inflation Low 2% / Medium 3% / High 4%, safe withdrawal rate 3–5%

**Visualisations required:** stacked-area growth projection with milestone markers; stacked-bar retirement income vs expenses; PLSA living standard gauge; longevity traffic-light indicator.

**Also required:** real-time debounced updates, sticky summary, tooltips, warning indicators, responsive design, collapsible assumptions section.

### 2.2 Requirements added during build

- [x] Better explanatory descriptions on every input section
- [x] Sticky summary banner on scroll showing pot / income / living standard, live-updating
- [x] Text-box entry alongside every slider
- [x] Clarify living costs are *current* and exclude mortgage
- [x] Full calculation accuracy review
- [x] Fix wealth chart starting from zero rather than current balances
- [x] Visible milestone reference-line labels
- [x] Joint planning for a partner — optional, no duplicate data entry
- [x] Separate ages, retirement ages and State Pension ages per person
- [x] Show pots individually **and** combined
- [x] Shared mortgage and joint living costs
- [x] Smooth, non-jerky sliders
- [x] Package as an installable phone app
- [x] "Send feedback" link to a Google Form, with private triage of responses (intent 026)

---

## 3. User guide

### 3.1 Getting started

The app opens in individual mode with illustrative defaults. Overwrite them with real figures — either drag a slider or type directly into the number box beside it. Every change recalculates immediately.

### 3.2 Adding a partner

Tap **Add a partner** in the header (or the dashed card in the left column). This reveals a second, independent input panel. Remove them again with the **×** on their card.

In joint mode the layout changes:
- A **Retirement Years** card shows both retirement years side by side
- **Per-person breakdown cards** show each person's pension, ISA and total at their own retirement
- The wealth chart stacks each person separately — blue/green for person one, teal/lime for person two
- Living standard switches to the **two-person** Retirement Living Standards bands

Both names are editable — tap the name to rename.

### 3.3 What each section covers

| Section | Per person or shared? | Notes |
|---|---|---|
| Ages and retirement timing | Per person | Shows the calendar year they retire |
| Savings | Per person | Cash ISA, Stocks & Shares ISA, LISA, and any number of free-form "other savings" accounts |
| Pension | Per person | Includes employer contributions and lump sum choice |
| Defined Benefit (DB) Pension | Per person | Optional — one DB pension each (§3.11) |
| State Pension and inheritance | Per person | Each person can have a different State Pension age |
| Living costs | Shared | Entered once for the household |
| Mortgage | Shared | Single joint liability |
| Inflation and withdrawal rate | Shared | Applied across the whole plan |

> **Annual Expenses excludes the mortgage.** The mortgage is tracked separately so it can correctly disappear from spending once it is paid off. The subtitle under the field shows the combined total as a sanity check.

### 3.4 Reading the outputs

- **"Can I retire?" headline** — the first thing shown below any warnings. A status badge gives a direct read: **On track** (green) or **Needs attention** (amber/red, split by whether the shortfall is within ten years of the plan horizon or earlier). Beneath it, a sentence names a specific age, deliberately hedged ("Under these assumptions, your plan currently supports retiring at age 60") rather than a flat yes/no, since the figure depends entirely on the assumptions in your inputs. A couple of insight lines follow (e.g. how many years your pot is projected to last past — or short of — your plan horizon), each opening with the same "Under these assumptions" hedge as the headline sentence, then a caveat noting the model's key simplifications (a fixed average return, estimated Income Tax at England, Wales and Northern Ireland rates rather than no tax, no allowance for a bad run of returns early in retirement — hover the info icon next to that phrase for what it means and why it matters) — "the Assumptions panel" in that caveat is a clickable link down to the panel described below, not plain prose. The same progress bar previously shown under "Longevity Analysis" (see below) is carried over into this headline.
- **Supportable retirement age.** Alongside the current-age sentence, the app searches for a different retirement age your plan would support — holding every other input fixed. If your plan already succeeds, it looks for the *earliest* age it could still work; if it currently fails, it looks for the smallest delay that fixes it. In joint mode this is a single shared adjustment applied equally to both people (e.g. "retire 3 years later than currently planned"), not solved independently per person. The search only considers ages within the same range the Retirement Age slider itself allows (roughly 50 to 75, per person); if nothing in that range changes the outcome, the headline says so explicitly rather than showing a number.
- **"Your projection assumes..." panel** — sits directly below the headline and lists the six assumptions behind it, in a fixed order: return (shown as each person's pension growth rate, not the full per-account breakdown), inflation, retirement age, life expectancy, spending, and State Pension (amount and start age combined into one line). A seventh **DB pension** line is added only when at least one person has entered a DB pension (§3.11), listing just the people who have one; otherwise the panel stays at its fixed six lines. Each figure is a clickable link that smooth-scrolls to the input that sets it and briefly highlights it, so the assumption behind the headline is never more than one click from where it's controlled. A footer link, "See how we calculate this ↓", expands (if needed) and scrolls to the full "How we calculate this" section (§3.10) for the complete detail this compact panel doesn't repeat.
- **Summary cards** — combined pot, household income **after tax**, and the Retirement Living Standards level, now sitting just below the headline as supporting detail. The income figure — on the Income card ("Household/Annual Income after tax"), in the sticky banner ("Income after tax") and on the gauge — is net of the estimated Income Tax on each person's pension withdrawal, State Pension and any DB pension (§4.3), which makes the comparison with the after-tax Retirement Living Standards bands fair. The Pot and Income cards each show a smaller "≈ £X in today's money" line beneath the main nominal figure, and their captions are hedged ("under these assumptions") rather than stated as plain fact. These repeat in a sticky banner once you scroll, which stays nominal-only (no today's-money line, unhedged captions) to keep it compact.
- **"Explain this" (Pot card)** — a small expandable control under the Pot card's caption. Expands to show how the headline Pot figure is made up: Starting balance, Contributions, Growth, and Withdrawals, all in nominal terms and always showing all four lines even when one is £0. This reconstruction is read from the same inputs and per-year projection data as the rest of the app, not a separate calculation of the pot itself — the four figures always sum exactly to the Pot card's headline number.
- **Wealth Projection** — stacked pension and ISA balances by calendar year, with mortgage debt shown below the zero line. Dashed reference lines mark each retirement and the mortgage-free year. Hovering any point also shows a "Total (today's money)" row, netting in mortgage debt as-is alongside the per-series nominal figures.
- **Retirement Income vs Expenses** — income split by source (pension drawdown, ISA, State Pension, and — only when someone has one — DB pension as its own pink series, never merged into the State Pension bar) against the dashed target-expenses line, with each year's estimated **Income Tax** shown as a grey bar below the zero line so the bars visibly net down. Where the bars above the line, less the tax below it, fall short of the target line, the plan is under-funded in that year. Hovering any point also shows a "Total after tax (today's money)" row: the income sources minus the tax, excluding the target-expenses reference line (it's a spending target, not income). Under the chart, one line gives the **estimated Income Tax over retirement** (first retirement to the plan horizon), its "≈ £X in today's money" equivalent — each year's tax deflated from its own year and summed, not the total deflated once — and a "2026/27 tax year" label. A neutral blue **Tax notes** panel under that line lists plain facts about the plan's tax (§3.10); it is hidden when there are none.
- **Living Standard gauge** — positions household income after tax against the Retirement Living Standards bands (Pensions UK). The big income figure above the gauge carries the same today's-money line as the summary cards, and the sub-line beneath it now reads "Pension £X · State £Y · DB £W · Tax −£Z" (the DB entry appears only when a DB pension is being paid in that year, the Tax entry only when tax is due), which adds up to the big figure. A permanent caveat line under the gauge notes that the income figure is shown in future £ while the bands themselves are today's-money figures, so the two aren't directly comparable (see limitation #6 below).

### 3.5 Warnings

The red banner appears when any of these trigger:
- Pension contributions exceed the £60,000 annual allowance
- Combined Cash ISA + Stocks & Shares ISA + LISA contributions exceed the £20,000 annual allowance
- LISA contributions exceed the £4,000 annual allowance
- A gap exists between retirement and State Pension age
- A gap exists between retirement and a person's DB pension start age (only when that person has a DB pension)
- Household income (after tax) falls below the Retirement Living Standards minimum
- Funds are projected to run out before the plan horizon

The banner has a **×** close control. Dismissing it hides the whole banner — not individual warning lines — and persists across reloads on that device. It's tied to the exact set of warnings shown at the time: if any input change alters which warnings apply (a figure changes, a warning appears or disappears), the banner reappears automatically with the new set. This is separate from the *"This file contains your personal financial figures..."* warning in §3.7, which is shown every time regardless of prior dismissal — that one is a data-handling caution aimed at whoever currently has the Data panel open, not necessarily the person who saw it last time, so a persistent dismiss wouldn't be appropriate there the way it is for this planning-condition banner.

### 3.6 Saving and resetting

Figures auto-save about half a second after each change — a brief **Saved** appears in the header. Data lives in that browser's storage on that device only, so your phone and laptop keep separate plans. The **↺ Reset** button clears the saved plan and restores defaults, including any dismissed warning banner.

### 3.7 Export and import

The **⚙ Data** button in the header opens a small panel with two controls, separate from Reset/Add-a-partner so there's room to grow. Above the controls, the panel now states plainly that everything you enter stays in this browser — no account, no upload, no bank connection, and no analytics or tracking — and that export/import (below) is the only way data moves anywhere, and only when you choose to do it. The same statement, in shorter form, appears in the page footer at the bottom of every screen.

- **Export plan** downloads your current figures as a `retirement-plan-YYYY-MM-DD.json` file. A warning line is shown every time the panel is open, not just once: *"This file contains your personal financial figures in plain text. Store or share it only somewhere you trust."* The file is a straight copy of your inputs (not the computed projection) plus a `schemaVersion` field for future compatibility — it contains no more than what already sits in your browser's storage.
- **Import plan** opens a file picker. A file is rejected outright, with an inline error and your current plan left untouched, only if it isn't valid JSON or isn't a plan-shaped object at all. Otherwise you're asked to confirm — *"This will replace your currently saved plan on this device — continue?"* — before anything changes; declining leaves your plan untouched. Importing is always a full replace, never a merge with what's currently saved. A field the file doesn't have is simply left as it was; a field the app doesn't recognise (e.g. from a future version) is ignored rather than rejected.

This is manual, one-off file transfer — moving a plan to another device, or keeping an offline backup — not automatic sync. See limitation #9 below.

### 3.8 What's new

The same **⚙ Data** panel has a **What's new (vN)** link below Import. It swaps the panel to a plain-language history of updates to the app — what changed, not how — newest first. The version number reuses the app's internal build version and isn't sequential (some builds only change things you'd never notice, like the code the app is tested with, and don't get an entry), so a gap between two version numbers is expected, not a sign anything is missing. **← Back** returns to Export/Import; closing the panel and reopening it always starts back on Export/Import, regardless of which view you were last on.

### 3.9 Dark mode

The same **⚙ Data** panel has a **System / Light / Dark** toggle below Import. **System** (the default) follows your device or browser's dark mode setting automatically, including switching live if you change it while the app is open. Picking **Light** or **Dark** explicitly overrides that and is remembered on this device — it stays set until you switch it back to System, independently of whatever the OS is doing. This choice is a display preference, not part of your plan: it's stored separately from your figures and is never included in an exported or imported plan file, so importing someone else's plan (or exporting yours to another device) never changes how the app looks.

### 3.10 Income tax and "How we calculate this"

**What is taxed.** Every year, each person's pension withdrawal plus their State Pension plus any DB pension is their taxable income, taxed against their **own** Personal Allowance and bands at England, Wales and Northern Ireland rates. Money taken from ISAs, the LISA and other savings is **not** taxed, and neither is the tax-free lump sum. Tax is taken off income, and any resulting shortfall against spending is covered from savings in the usual order (§4.3). The Safe Withdrawal Rate applies to the amount taken out of the pension **before** tax, so moving that slider changes the tax too. Tax is always on — there is no switch to turn it off.

**Tax notes.** A neutral blue panel under the lifetime-tax line states plain facts about the plan — never advice. Per person, each note appears once, for the first year it applies:

1. taxable retirement income is above the higher-rate threshold (40%);
2. it is above the additional-rate threshold (45%);
3. it is in the Personal Allowance taper range (£100,000 up to the additional-rate threshold), where income is taxed at an effective 60%;
4. the tax-free lump sum is capped at the Lump Sum Allowance, with the rest staying in the pension;
5. the State Pension alone is above the Personal Allowance, so some tax is due on it even without other income (the announced 2027/28 easement for people whose only income is the State Pension isn't modelled).

Each note links to the GOV.UK page that sets the rule. The wording is fact-only: it states what happens, when, and the threshold, and never recommends an action. The existing red warning banner (§3.5) is reserved for genuine problems.

**"How we calculate this."** The collapsible section at the bottom of the page (renamed from "Assumptions & Disclaimers") opens with "Figures last updated: 6 April 2026 (2026/27 tax year)" and explains the joint model, growth, the withdrawal rate, Income Tax, future tax thresholds, the tax-free lump sum, the Retirement Living Standards, the State Pension, the Defined Benefit (DB) pension (including that it is uprated by the household inflation rate rather than the scheme's own rules), allowances (including why the annual allowance and MPAA need no tax code here) and what is not included. Each reference figure has its source link beside it (opens in a new tab). Every figure is read from one reference object in the app, so a new tax year's update is a single edit. The footer's "Based on 2026/27 UK tax year figures and Pensions UK Retirement Living Standards (2026)" line reads from the same object.

### 3.11 Defined Benefit (DB) pension

Each person has an optional **Defined Benefit (DB) Pension** section, separate from "State Pension & Inheritance" (State Pension is universal; a DB pension isn't, so it stays out of the way for people without one). It holds one DB pension per person:

- **DB Pension (Annual)** — the yearly amount in today's money. Leave at £0 if you have none; the other two fields only appear once this is above £0.
- **Scheme Name** — free text, shown in the assumptions panel.
- **DB Pension Start Age** — 55–75, default 65.

The amount's info tooltip states the key simplification at the point of entry: the tool raises the pension each year by the single household inflation assumption, like the State Pension, whereas real schemes differ (capped, CPI- or RPI-linked, fixed, or no increases). The same point is in "How we calculate this" (§3.10) as the permanent record.

A plan saved or exported before DB support existed has none of these fields; it loads as "no DB pension" with no migration step.

### 3.12 Send feedback

A **Send feedback** item in the **⚙ Data** panel, below What's new, and a small **Send feedback** link in the page footer both open a short Google Form in a new tab. The Data panel item carries the line *"Opens a short Google form. Your plan figures aren't sent. Only what you type in the form."*

- The form asks for a type (Bug / Idea / Something confusing / Other), what happened or what you'd like, optional steps or example figures ("only share what you're comfortable with"), and an optional email for a reply. It needs no sign-in.
- The link pre-fills the app's version into a field the user doesn't see, so a report can be matched to the build it came from. Nothing else is added: **the app never sends plan figures or anything else automatically.** The form is hosted by Google and receives only what the user types, plus that version.
- The link is always shown. There is no offline check. Offline, the new tab simply fails to load.
- There is no in-app prompt asking for feedback, and no automatic reply. The owner may reply by hand if an email was given. "What's new" (§3.8) is where fixes show up.
- Both entry points are hidden while the app has no form URL configured (`FEEDBACK_FORM_URL` empty; see §5.2).

Behind the form, responses become issues in a private GitHub repo, not this public one, and the reply email is never copied into the issue. A daily Claude Code routine labels and comments on them (triage only). Setup, the daily cap and the triage rules: `tools/feedback/README.md` and `tools/feedback/TRIAGE.md`.

---

## 4. Financial technicals

### 4.1 Accumulation

Growth compounds **monthly**, with contributions added monthly in arrears. The annual growth rate is converted to a monthly equivalent rather than divided by twelve:

```javascript
monthlyRate = (1 + annualRate / 100) ^ (1/12) - 1

for each of 12 months:
    balance = balance * (1 + monthlyRate) + monthlyContribution
```

Combined employee plus employer pension contributions are capped at the **£60,000** annual allowance inside the engine, not merely warned about.

Each person's savings are modelled as up to four independent account types, each with its own balance, monthly contribution and growth rate: **Cash ISA**, **Stocks & Shares ISA**, **LISA**, and any number of free-form **other savings** accounts (e.g. Premium Bonds, general savings). LISA contributions receive an automatic **25% government bonus**, credited monthly alongside the LISA's own growth (`lisaContribution × 1.25` added each month, on top of compounding) — mirroring how the pension lump sum is already special-cased as a fixed, non-configurable top-up. Combined Cash ISA + Stocks & Shares ISA + LISA contributions are **not** hard-capped in the engine (unlike the pension allowance above); exceeding the £20,000 combined allowance or the £4,000 LISA sub-allowance is warned about (§3.5) rather than silently reduced, since unlike the single-figure pension contribution there's no unambiguous way to decide which of the three accounts should absorb an over-the-cap reduction.

### 4.2 At retirement

Applied once, in the person's retirement year, in this order:

1. **Tax-free lump sum** (if selected): min(25% of the pension, the £268,275 Lump Sum Allowance) moves into the S&S ISA; any excess over the allowance stays in the pension and is taxed as income when drawn. The allowance is per person and is not uprated in future years. There is no one-off taxable payment at retirement. Source: [GOV.UK: Lump Sum Allowance](https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance).
2. The **initial sustainable withdrawal** is fixed as `remainingPension × withdrawalRate` — taken from the larger remaining pot when the allowance caps the lump sum

### 4.3 Decumulation

The tool implements the **traditional 4% rule**: the first-year withdrawal amount is fixed at retirement and then uprated by inflation each year — *not* recalculated as a percentage of the declining balance.

```javascript
yearWithdrawal = initialWithdrawal × (1 + inflation) ^ yearsRetired
```

Spending is funded in this order each year:

1. **Guaranteed income: State Pension + DB pension** — State Pension begins at each person's State Pension age; a DB pension begins at that person's DB start age. Both are inflation-uprated from today by the household rate and pooled into one figure; there is no ordering between them (both are non-depletable, already-promised income)
2. **Pension drawdown** — the sustainable amount above, capped at the remaining pot
3. **Income tax** — each person's pension draw + State Pension + DB pension, taxed against their own allowance; tax reduces net income, and the gap is funded from savings
4. **Savings** — top up whatever gap remains, drawn in a **fixed priority order**: other savings first, then Cash ISA, then Stocks & Shares ISA, then the **LISA** — and the LISA is only drawable once the person turns **60** (no first-home exception is modelled; before 60 it is excluded from funding the gap entirely, though it keeps accruing contributions, bonus and growth). This order is shown in the app's Assumptions panel so it's never left implicit.

In joint mode, each tier is drawn **proportionally** across every retired person's balance of that account type before moving to the next tier — the same proportional mechanic the tool has always used for ISA withdrawals, now applied tier-by-tier instead of once. Balances that remain after withdrawals continue to grow at the person's chosen rate.

#### Income tax model

Rest-of-UK (England, Wales and Northern Ireland) income tax, per person, per year. Row year Y is tax year Y/Y+1 (2026 → 2026/27). All figures live in `UK_REFERENCE` in `index.html`.

```javascript
// thresholds for row year `year`: frozen through 2030 (tax year 2030/31),
// then uprated by the household inflation input from 2031
k = (1 + inflation) ^ max(0, year - 2030)
PA = 12,570 × k;  taper = 100,000 × k;  HRT = 50,270 × k;  ART = 125,140 × k

// one person's tax on taxableIncome = own pension draw + own State Pension + own DB pension
allowance  = max(0, PA - max(0, taxableIncome - taper) / 2)
taxable    = max(0, taxableIncome - allowance)
basicBand  = HRT - PA                        // £37,700 today
basic      = min(taxable, basicBand)
higher     = min(max(0, taxable - basicBand), ART - basicBand)
additional = max(0, taxable - ART)
tax        = basic × 20% + higher × 40% + additional × 45%

dbPension = age >= dbStartAge ? dbAmount × (1 + inflation) ^ years : 0   // exactly like State Pension
gap = max(0, targetExpenses - (statePension + dbPension + pensionDraw - tax))  // funded from savings tiers
```

- **Freeze, then inflation.** Thresholds are kept at today's amounts through 2030/31 (to 5 April 2031, as announced), then rise each year with the household inflation input. All four thresholds move together — including the £100,000 taper threshold and £125,140, which in law aren't indexed — so the Personal Allowance still reaches zero exactly at the additional-rate threshold every year. Thresholds and tax are not rounded inside the calculation; rows round per field.
- **No gross-up.** The pension drawdown stays at the gross 4%-rule amount (the rule is defined on the gross withdrawal). Tax reduces net income, and the larger gap is funded from the existing tax-free savings tiers in the existing order.
- **Untaxed.** ISA, LISA and other-savings withdrawals and the tax-free lump sum are not taxable income.
- **Per person.** Each person has their own Personal Allowance and bands; in joint mode two £20,000 incomes pay £1,486 each, not the £5,486 one £40,000 income would.
- Each row carries `p1StatePension`/`p2StatePension`, `p1DbPension`/`p2DbPension` plus household `dbPension`, `p1TaxableIncome`/`p2TaxableIncome`, `p1Tax`/`p2Tax`, `p1LumpSum`/`p2LumpSum`, `p1LumpSumExcess`/`p2LumpSumExcess`, plus household `incomeTax` (= `p1Tax + p2Tax`) and `netIncome` (State Pension + DB pension + pension withdrawal − tax; excludes savings draws).
- The Living Standard card's household figure applies the same helpers to the components it shows (each person's first-year pension draw plus their State Pension input plus their DB pension input if it has started by then, at `bothYear`'s thresholds), so its "Pension · State · DB · Tax" sub-line adds up to the big figure.

#### Defined Benefit (DB) pension

One DB pension per person (`dbPensionName`, `dbPensionAmount`, `dbPensionStartAge` on the person object; all optional — `dbPensionOf()` reads absent fields as amount 0, start age 65). The user enters an already-promised annual income, so the engine models it exactly like the State Pension: paid from its start age, uprated from today by the household inflation input (not the scheme's own indexation — limitation #5/#8), taxed as that person's income, and pooled with State Pension as guaranteed income ahead of the savings tiers. Deliberately **not** modelled, because there is no factual basis in the inputs to model them: commutation / a tax-free lump sum from the DB scheme (scheme-specific factors — approximate with Expected Inheritance if needed); DB accrual against the Annual Allowance (16× test) or crystallisation against the Lump Sum Allowance (20× valuation); and survivor's pensions (the tool has no death-triggered mechanic anywhere).

#### Annual allowance and MPAA

The £60,000 pension annual allowance is already a hard cap in the engine (§4.1), so over-allowance contributions are capped rather than taxed. The £10,000 Money Purchase Annual Allowance applies once someone flexibly accesses a DC pension while still contributing; in this model contributions stop in exactly the year drawdown starts and there is no phased retirement, so the MPAA can never trigger. Neither needs code — they are documented here so the absence isn't mistaken for a gap.

### 4.4 Expenses and inflation

```javascript
targetExpenses = (annualExpenses + healthcare) × (1 + inflation) ^ years
                 + mortgagePayment × 12   [while the mortgage runs]
```

Non-mortgage spending inflates; mortgage payments stay flat until the debt clears, then drop out entirely.

### 4.5 Joint-planning model

> Each person's pension and ISA grow and are drawn **independently**, using their own ages and retirement dates. Shared living costs and the mortgage are a **single joint liability**, funded from combined pots from the moment the **first** person retires.

The still-working partner's salary is **not modelled**. From the first retirement onward, full household costs are drawn from savings. This is deliberately cautious — in reality a working partner's income would offset much of that spending, so the tool understates how long funds last where retirement dates differ significantly.

The projection is anchored on **calendar years** so that differing ages align correctly across all charts.

### 4.6 Longevity test

Funds are considered depleted the first year that combined pension plus ISA plus other savings falls below £1,000, measured only from the first retirement onward. The plan horizon is the **longer** of the two life expectancies.

### 4.7 Reference figures used

Every figure below lives in one object, `UK_REFERENCE`, in `index.html` (tagged `taxYear: '2026/27'`, `lastUpdated: '6 April 2026'`); the in-app "How we calculate this" section, the footer and the tax-year label all read from it.

| Item | Value | Basis | Source |
|---|---|---|---|
| Personal Allowance | £12,570 | 2026/27 | https://www.gov.uk/income-tax-rates |
| Personal Allowance taper | −£1 for every £2 of income above £100,000; zero at £125,140 | 2026/27 | https://www.gov.uk/income-tax-rates |
| Basic rate | 20% up to £50,270 (the higher-rate threshold = £12,570 + £37,700) | 2026/27, England/Wales/NI | https://www.gov.uk/income-tax-rates |
| Higher rate | 40% above £50,270 | 2026/27, England/Wales/NI | https://www.gov.uk/income-tax-rates |
| Additional rate | 45% above £125,140 | 2026/27, England/Wales/NI | https://www.gov.uk/income-tax-rates |
| Threshold freeze | Personal Allowance and higher-rate threshold kept until 5 April 2031 (through 2030/31); modelled as all thresholds frozen, then inflation-uprated from 2031/32 | Announced policy | https://www.gov.uk/government/publications/maintaining-income-tax-and-equivalent-national-insurance-contributions-thresholds-until-5-april-2031 |
| Full new State Pension | £12,548/yr (£241.30/wk) | 2026/27 | https://www.gov.uk/new-state-pension/what-youll-get |
| State Pension taxation | Taxable income | — | https://www.gov.uk/guidance/how-your-state-pension-is-taxed |
| Lump Sum Allowance | 25% of the pot, up to £268,275 per person (not uprated) | 2026/27 | https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance |
| Pension annual allowance | £60,000 incl. employer | 2026/27 | https://www.gov.uk/tax-on-your-private-pension/annual-allowance |
| Money Purchase Annual Allowance | £10,000 (documentation only — can't trigger in this model, §4.3) | 2023/24 onwards | https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm056510 |
| ISA allowance (Cash + Stocks & Shares + LISA combined) | £20,000 | 2026/27 | https://www.gov.uk/individual-savings-accounts |
| LISA annual contribution limit | £4,000 (within the £20,000 above) | 2026/27 | https://www.gov.uk/lifetime-isa |
| LISA government bonus | 25% of contributions | 2026/27 | https://www.gov.uk/lifetime-isa |
| LISA minimum access age | 60 (no first-home exception modelled) | — | https://www.gov.uk/lifetime-isa |
| Retirement Living Standards, one-person | Min £13,900 / Mod £32,700 / Comf £45,400 | 2026 (Pensions UK, formerly the PLSA); after tax, excluding housing costs, outside London | https://www.retirementlivingstandards.org.uk/details |
| Retirement Living Standards, two-person | Min £22,500 / Mod £45,400 / Comf £62,700 | 2026 (Pensions UK, formerly the PLSA); after tax, excluding housing costs, outside London | https://www.retirementlivingstandards.org.uk/details |

No new reference figures are needed for DB pensions: the amount is a user input, and its yearly increase reuses the household inflation input rather than any published index (a deliberate simplification — see §4.3 and limitation #8).

The Retirement Living Standards are the cost of each lifestyle; meeting them needs enough **after-tax** income, which is why the app compares them with after-tax household income. State Pension age is rising from 66 to 67, phased from April 2026.

---

## 5. Technical implementation

### 5.1 Stack

- **React 18** with hooks — no state management library
- **Recharts** for all three visualisations
- **Tailwind CSS** for styling — the inlined stylesheet is a one-time, pre-generated build containing only the utility classes the app actually used at build time, not a runtime compiler. A Tailwind class name that was never used anywhere in the original source (e.g. `min-w-0`, `break-words`) has **no CSS behind it** if added to the JSX later — it silently does nothing. Adding a not-yet-present utility means hand-writing its rule (matching Tailwind's own output) into the custom rules already inlined in the component's `<style>` block, alongside `.tabular`/`.gradient-text`/etc.
- **Fraunces** (serif headings) paired with **Inter Tight** (body) via Google Fonts
- Single `.jsx` file, roughly 750 lines, precompiled and inlined into `index.html`

### 5.2 Architecture

```javascript
UK_REFERENCE            every dated UK figure + its source URL (engine span)
projectJoint()          pure function — the entire financial engine
  ├─ taxThresholdsFor() frozen-then-uprated thresholds for a row year
  ├─ incomeTaxFor()     one person's rest-of-UK income tax
  └─ returns one row per calendar year
lifetimeTaxTotals()     nominal + today's-money tax over retirement (uses deflate())
computeTaxNotes()       first-year tax facts per person (data only)
dbPensionOf()           one person's DB pension with defaults for absent fields
dbPensionGapYears()     retirement-to-DB-start gap for the warning banner

RetirementCalculator()  state, derived memos, layout
  ├─ SliderWithInput    memoised, module-level
  ├─ PersonInputs       memoised, module-level
  │   └─ DbPensionInputs memoised, module-level
  ├─ WealthChart        memoised
  ├─ IncomeChart        memoised
  └─ TaxNotesPanel      memoised, module-level (wording from taxNoteText())
```

**Feedback link (intent 026).** `APP_VERSION`, `FEEDBACK_FORM_URL`, `FEEDBACK_VERSION_FIELD` and the derived `FEEDBACK_HREF` are module-level constants just above `USER_CHANGELOG`. `FEEDBACK_HREF` is the form's pre-fill URL with `APP_VERSION` in the version field, or `''` when `FEEDBACK_FORM_URL` is empty, and both entry points render only when it is non-empty. `APP_VERSION` must equal the `sw.js` `CACHE` suffix. `tests/test-engine.js` fails if they differ.

`UK_REFERENCE`, `taxThresholdsFor`, `incomeTaxFor`, `deflate`, `lifetimeTaxTotals`, `computeTaxNotes`, `dbPensionOf` and `dbPensionGapYears` all sit inside the `ENGINE-EXTRACT` spans, so `tests/test-engine.js` exercises them directly. `taxNoteText`, `sourceLink` and `formatToday` are plain module-level display helpers outside the spans (they use `formatCurrency`/React).

The engine is a pure function with no React dependency, which is what made it straightforward to unit-test the maths independently of the UI.

### 5.3 Performance — the important part

The sliders were initially unusable. Two root causes, in order of severity:

> **Components defined inside the parent component.** `PersonInputs` and `CustomTooltip` were declared inside `RetirementCalculator`, so every render produced a *new component type*. React could not reconcile them and tore down and rebuilt all fifteen sliders on every pixel of drag. This — not the arithmetic — was the dominant cost.

Fixes applied, in order of impact:

1. **Moved every subcomponent to module level** so identities stay stable across renders (every later component follows the same rule — including `VerdictHero`, `AssumptionsPanel` and `TaxNotesPanel`, all module-level and memoised)
2. **Memoised both charts** — during a drag the projection array keeps its reference, so Recharts skips rendering entirely
3. **Disabled Recharts animations** — each data change was firing a 1.5-second animation that retriggered continuously mid-drag
4. **`useDeferredValue`** on all projection inputs, so the slider thumb tracks the finger while the recalculation happens at lower priority
5. **Stable callbacks** via `useCallback`, with sliders passing a `field` name rather than a fresh inline arrow, so memoisation actually holds
6. **Finer step values** so movement feels continuous

### 5.4 Verification

The engine was tested as a standalone module. Checks that pass:

- Opening balances appear at the current age with no phantom year of growth
- Monthly compounding matches an independent manual calculation exactly
- Lump sum leaves precisely 75% in the pension when 25% is within the Lump Sum Allowance
- Mortgage clears in exactly the specified year
- Withdrawal equals exactly 4% of the post-lump-sum pot in year one
- State Pension starts in the correct year, correctly inflated
- Joint totals reconcile against the sum of individual pots
- Depletion is detected correctly in a deliberately under-funded scenario
- LISA contributions receive exactly a 25% government top-up before compounding
- The LISA is never drawn before age 60, and becomes drawable from age 60 onward
- Fixed drawdown order is respected: other savings, then Cash ISA, then Stocks & Shares ISA, then LISA
- `migratePerson()` correctly maps an old single-ISA save onto the new sub-account shape, and is a no-op on an already-migrated save
- **Individual-mode results are identical before and after the joint-planning rewrite** — the regression guard that mattered most. The byte-for-byte baseline fixture was later regenerated deliberately for income tax (018), with the before/after figures recorded in `CHANGELOG.md`. DB pension support (025) did **not** regenerate it: the check asserts the new `dbPension`/`p1DbPension`/`p2DbPension` row keys are zero in every row, then compares every other field against the unchanged fixture
- `findSupportableDelta()` (the "Can I retire?" supportable-age search, §3.4) finds the earliest workable retirement when a plan already succeeds; finds the *smallest* delay that fixes a plan that currently fails (verified against a manual scan of every smaller delta); applies one shared delta to both people in couple mode rather than solving each independently; and returns `null` — never a delta outside the existing per-person age bounds — when nothing in range fixes a failing plan
- `computePotBreakdown()` (the Pot card's "Explain this" reconstruction, §3.4) reconciles exactly against `household.totalPot` for a range of individual- and couple-mode fixtures, including a staggered-retirement couple fixture where `withdrawals` is nonzero before `bothYear`; its `contributions` figure reflects the £60,000/year pension-contribution cap rather than the uncapped input rate; and each person's contribution-years stop at their own `retirementAge`, not at the later `bothYear`
- Band boundaries: income tax is correct at, £1 below and £1 above the Personal Allowance, the higher-rate threshold and the additional-rate threshold
- The £100k taper: an effective 60% marginal rate between £100,000 and £125,140, with the allowance reaching zero at £125,140
- Per-person allowances in joint mode: two £20k incomes are taxed as £1,486 each, not as one £40k income (£5,486)
- The freeze-then-uprate threshold path: frozen through 2030, uprated by the inflation input from 2031, and unchanged forever at 0% inflation
- The Lump Sum Allowance cap: the lump sum is min(25%, £268,275), the excess stays in the pension, and the initial withdrawal is taken from the larger remaining pot
- ISA/LISA/other-savings withdrawals are never taxed
- The extra savings draw equals the tax when spending equals the gross pension draw
- Changing the withdrawal rate changes the tax
- `lifetimeTaxTotals` today's-money figure equals the sum of each year's deflated tax (not the nominal total deflated once)
- DB pension is added to its owner's taxable income alongside drawdown and State Pension, sharing that person's own allowance and bands (basic-rate and higher-rate cases), and is never attributed to the other person in joint mode
- DB pension starts in the year its owner reaches the start age and is uprated from today by the household inflation rate, matching State Pension year for year
- State Pension and DB pension are pooled: they fund spending before the savings tiers, swapping amounts between them changes nothing, and the 4%-rule drawdown is unaffected by DB income
- A person with no DB fields at all (a pre-025 save) projects identically to one with a £0 DB pension
- `dbPensionGapYears` is non-zero only when a non-zero DB pension starts strictly after retirement
- `computeTaxNotes` reports each fact in its first year, uses strict ">" boundaries (income exactly at a threshold produces no note), only fires the taper note strictly inside the taper range, attributes notes to the right person, and ignores rows after the plan horizon

- `APP_VERSION` in `index.html` equals the `sw.js` `CACHE` suffix, so the feedback form is pre-filled with the build actually running (intent 026)

The built PWA was additionally rendered in a headless browser to confirm it boots, calculates, toggles into couple mode and persists state. For the feedback link (§3.12), a headless check confirmed neither entry point renders while `FEEDBACK_FORM_URL` is empty, and that with it set both open the pre-fill URL (`usp=pp_url` plus the version field) in a new tab, at desktop and phone widths, in light and dark mode.

### 5.5 PWA packaging

Everything is inlined into one `index.html` (~825 KB, ~222 KB zipped):

- JSX **precompiled** with Babel — no in-browser transpiler, so startup is fast on a phone
- React, ReactDOM, `react-is` and Recharts embedded as **UMD builds**
- Tailwind run through the CLI against the source to emit only the ~34 KB of CSS actually used
- Lucide icons replaced with **inline SVG components**, removing the dependency entirely
- Service worker for offline use; web manifest and SVG icon for home-screen install
- Mobile touches: larger slider thumbs on coarse pointers, 16px inputs to stop iOS zooming, safe-area padding for the notch

> `react-is` must be loaded **before** Recharts. Its UMD build expects a `ReactIs` global and fails with a `ForwardRef` error otherwise — which then cascades into confusing downstream errors, because function declarations still hoist even though the script aborted.

---

## 6. Hosting

This repo is deployed to **GitHub Pages** via a GitHub Actions workflow (`.github/workflows/pages.yml`) that publishes the static files on every push to `main`. No build step is required — the app is entirely static.

No personal data sits in the repo — figures live only in device storage.

### 6.1 Installing on a phone

- **iPhone** — open the Pages URL in **Safari** (not Chrome) → Share → Add to Home Screen
- **Android** — open in Chrome → ⋮ → Install app

### 6.2 Updating

Push changes to `main`. The service worker caches aggressively, so if you don't see an update, bump `CACHE = 'retirement-planner-v1'` in `sw.js` to `v2`, or fully close and reopen the installed app. Bump `APP_VERSION` in `index.html` to the same value at the same time (the test harness checks they match).

---

## 7. Known limitations

> These are deliberate simplifications, not defects. Worth knowing before relying on the output.

1. **Income tax is estimated, not exhaustive.** Modelled: rest-of-UK income tax on pension drawdown, State Pension and DB pension, per person, with the £100k taper, thresholds frozen to 2030/31 and then inflation-uprated. Not modelled: (a) Scottish rates (roadmap #27; [GOV.UK: Scottish Income Tax](https://www.gov.uk/scottish-income-tax)); (b) tax on non-ISA savings interest ([Personal Savings Allowance](https://www.gov.uk/apply-tax-free-interest-on-savings)); (c) [Marriage Allowance](https://www.gov.uk/marriage-allowance), [Blind Person's Allowance](https://www.gov.uk/blind-persons-allowance) and other reliefs; (d) the announced 2027/28 easement for pensioners whose only income is the State Pension ([House of Commons Library, "Taxation of state pension"](https://commonslibrary.parliament.uk/research-briefings/cbp-10250/); see also [GOV.UK: how your State Pension is taxed](https://www.gov.uk/guidance/how-your-state-pension-is-taxed)); (e) threshold paths other than freeze-then-inflation ([GOV.UK: thresholds maintained until 5 April 2031](https://www.gov.uk/government/publications/maintaining-income-tax-and-equivalent-national-insurance-contributions-thresholds-until-5-april-2031)); (f) no gross-up, so drawdown stays at the 4%-rule gross amount and tax is covered from savings ([GOV.UK: Income Tax rates](https://www.gov.uk/income-tax-rates)).
2. **Salary is not modelled at all.** Where retirement dates differ, the working partner's earnings do not offset household costs, so longevity is understated.
3. **Mortgage is a straight-line runoff** — monthly payment × 12 × years, reduced annually. There is no interest amortisation, so the outstanding balance shown is an approximation of a real redemption figure.
4. **Growth is a fixed annual rate** with no sequence-of-returns risk or volatility modelling. A poor first decade of retirement is far more damaging than the same average return implies.
5. **One inflation rate** applies to all spending categories; healthcare in particular tends to inflate faster. The same single rate also uprates State Pension and any DB pension (see #8).
6. **Retirement Living Standards bands are not inflated forward** — they are compared against nominal future income, which flatters later years.
7. **ISA/LISA contributions are not hard-capped** in the engine; the £20,000 combined and £4,000 LISA limits are warned about (§3.5), not enforced — unlike the pension allowance, which is a hard cap.
8. **Single DB pension per person, simplified.** One Defined Benefit pension per person is supported (§3.11, §4.3), uprated by the household inflation rate (#5) rather than the scheme's own indexation (capped CPI, RPI, fixed, none). Not modelled: more than one DB pension per person (roadmap #31 — combine them by hand), per-scheme indexation (roadmap #32), commutation / a tax-free lump sum from the DB scheme, interaction with the Annual Allowance or Lump Sum Allowance, and survivor's pensions.
9. **Device-local storage** — phone and laptop keep separate plans, and clearing browser data erases the saved plan. Manual export/import (§3.7) can move a plan between devices or back it up, but there's no automatic sync.
10. **No LISA first-home exception.** Real LISAs allow penalty-free access before 60 for a first home purchase; this tool has no house-purchase concept to hang that on, so the age-60 restriction is unconditional.
11. **Unlimited free-form "other savings" accounts.** A person can add any number of named non-ISA savings accounts — this is intentional, not a bug.
12. **The feedback link needs a connection and a Google-hosted form.** "Send feedback" (§3.12) is always shown, with no offline check or message. Offline, the new tab just fails to load. The form is run by Google, not the app, and at most 20 responses a day become triage issues (the rest stay in the form's responses).
