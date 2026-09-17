# UK Retirement Planner — Tool Documentation

> Source of truth for this doc is the project's Notion page. This copy is kept in-repo for reference alongside the code.

**What this is:** a self-built UK retirement planning calculator. Single-page React app, supports individual or joint (couple) planning, packaged as an installable phone app (PWA).

**Status:** built and verified.

**Not financial advice** — illustrative planning only. Retirement income tax is not modelled.

---

## 1. Overview

A year-by-year retirement projection tool covering pensions, ISAs, the State Pension, mortgage runoff and inheritance, benchmarked against the PLSA Retirement Living Standards.

It answers three questions:

1. **How big will the pot be** at retirement, per person and combined?
2. **What sustainable income** does that produce, and what living standard does it buy?
3. **Will the money last** to the end of the plan horizon?

| Aspect | Detail |
|---|---|
| Form factor | Single-file React app; also packaged as an offline PWA |
| Planning modes | Individual, or joint with a partner (toggleable) |
| Projection span | Current age through to age 100, anchored on calendar years |
| Tax year basis | 2026/27 allowances; PLSA standards 2025/26 |
| Data storage | Browser localStorage on-device only. Nothing leaves the device. |

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
- Living standard switches to the **two-person** PLSA bands

Both names are editable — tap the name to rename.

### 3.3 What each section covers

| Section | Per person or shared? | Notes |
|---|---|---|
| Ages and retirement timing | Per person | Shows the calendar year they retire |
| Savings | Per person | Cash ISA, Stocks & Shares ISA, LISA, and any number of free-form "other savings" accounts |
| Pension | Per person | Includes employer contributions and lump sum choice |
| State Pension and inheritance | Per person | Each person can have a different State Pension age |
| Living costs | Shared | Entered once for the household |
| Mortgage | Shared | Single joint liability |
| Inflation and withdrawal rate | Shared | Applied across the whole plan |

> **Annual Expenses excludes the mortgage.** The mortgage is tracked separately so it can correctly disappear from spending once it is paid off. The subtitle under the field shows the combined total as a sanity check.

### 3.4 Reading the outputs

- **Summary cards** — combined pot, household income, and PLSA living standard. These repeat in a sticky banner once you scroll.
- **Longevity Analysis** — traffic light showing whether funds last to the plan horizon. Green means funded beyond the horizon; amber means a shortfall within ten years of it; red means an earlier shortfall.
- **Wealth Projection** — stacked pension and ISA balances by calendar year, with mortgage debt shown below the zero line. Dashed reference lines mark each retirement and the mortgage-free year.
- **Retirement Income vs Expenses** — income split by source (pension drawdown, ISA, State Pension) against the dashed target-expenses line. Where the bars fall short of the line, the plan is under-funded in that year.
- **Living Standard gauge** — positions household income against the PLSA bands.

### 3.5 Warnings

The red banner appears when any of these trigger:
- Pension contributions exceed the £60,000 annual allowance
- Combined Cash ISA + Stocks & Shares ISA + LISA contributions exceed the £20,000 annual allowance
- LISA contributions exceed the £4,000 annual allowance
- A gap exists between retirement and State Pension age
- Household income falls below the PLSA minimum
- Funds are projected to run out before the plan horizon

### 3.6 Saving and resetting

Figures auto-save about half a second after each change — a brief **Saved** appears in the header. Data lives in that browser's storage on that device only, so your phone and laptop keep separate plans. The **↺ Reset** button clears the saved plan and restores defaults.

### 3.7 Export and import

The **⚙ Data** button in the header opens a small panel with two controls, separate from Reset/Add-a-partner so there's room to grow:

- **Export plan** downloads your current figures as a `retirement-plan-YYYY-MM-DD.json` file. A warning line is shown every time the panel is open, not just once: *"This file contains your personal financial figures in plain text. Store or share it only somewhere you trust."* The file is a straight copy of your inputs (not the computed projection) plus a `schemaVersion` field for future compatibility — it contains no more than what already sits in your browser's storage.
- **Import plan** opens a file picker. A file is rejected outright, with an inline error and your current plan left untouched, only if it isn't valid JSON or isn't a plan-shaped object at all. Otherwise you're asked to confirm — *"This will replace your currently saved plan on this device — continue?"* — before anything changes; declining leaves your plan untouched. Importing is always a full replace, never a merge with what's currently saved. A field the file doesn't have is simply left as it was; a field the app doesn't recognise (e.g. from a future version) is ignored rather than rejected.

This is manual, one-off file transfer — moving a plan to another device, or keeping an offline backup — not automatic sync. See limitation #9 below.

### 3.8 What's new

The same **⚙ Data** panel has a **What's new (vN)** link below Import. It swaps the panel to a plain-language history of updates to the app — what changed, not how — newest first. The version number reuses the app's internal build version and isn't sequential (some builds only change things you'd never notice, like the code the app is tested with, and don't get an entry), so a gap between two version numbers is expected, not a sign anything is missing. **← Back** returns to Export/Import; closing the panel and reopening it always starts back on Export/Import, regardless of which view you were last on.

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

1. **25% tax-free lump sum** (if selected) is moved out of the pension and into the Stocks & Shares ISA — modelling it as retained tax-free capital rather than spent
2. The **initial sustainable withdrawal** is fixed as `remainingPension × withdrawalRate`

### 4.3 Decumulation

The tool implements the **traditional 4% rule**: the first-year withdrawal amount is fixed at retirement and then uprated by inflation each year — *not* recalculated as a percentage of the declining balance.

```javascript
yearWithdrawal = initialWithdrawal × (1 + inflation) ^ yearsRetired
```

Spending is funded in this order each year:

1. **State Pension** — begins at each person's State Pension age, inflation-uprated from today
2. **Pension drawdown** — the sustainable amount above, capped at the remaining pot
3. **Savings** — top up whatever gap remains, drawn in a **fixed priority order**: other savings first, then Cash ISA, then Stocks & Shares ISA, then the **LISA** — and the LISA is only drawable once the person turns **60** (no first-home exception is modelled; before 60 it is excluded from funding the gap entirely, though it keeps accruing contributions, bonus and growth). This order is shown in the app's Assumptions panel so it's never left implicit.

In joint mode, each tier is drawn **proportionally** across every retired person's balance of that account type before moving to the next tier — the same proportional mechanic the tool has always used for ISA withdrawals, now applied tier-by-tier instead of once. Balances that remain after withdrawals continue to grow at the person's chosen rate.

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

| Item | Value | Basis |
|---|---|---|
| Full new State Pension | £12,548/yr (£241.30/wk) | 2026/27 |
| Pension annual allowance | £60,000 incl. employer | 2026/27 |
| ISA allowance (Cash + Stocks & Shares + LISA combined) | £20,000 | 2026/27 |
| LISA annual contribution limit | £4,000 (within the £20,000 above) | 2026/27 |
| LISA government bonus | 25% of contributions | 2026/27 |
| LISA minimum access age | 60 (no first-home exception modelled) | — |
| PLSA one-person | Min £13,400 / Mod £31,700 / Comf £43,900 | 2025/26, outside London |
| PLSA two-person | Min £21,600 / Mod £43,900 / Comf £60,600 | 2025/26, outside London |

State Pension age is rising from 66 to 67, phased from April 2026.

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
projectJoint()          pure function — the entire financial engine
  └─ returns one row per calendar year

RetirementCalculator()  state, derived memos, layout
  ├─ SliderWithInput    memoised, module-level
  ├─ PersonInputs       memoised, module-level
  ├─ WealthChart        memoised
  └─ IncomeChart        memoised
```

The engine is a pure function with no React dependency, which is what made it straightforward to unit-test the maths independently of the UI.

### 5.3 Performance — the important part

The sliders were initially unusable. Two root causes, in order of severity:

> **Components defined inside the parent component.** `PersonInputs` and `CustomTooltip` were declared inside `RetirementCalculator`, so every render produced a *new component type*. React could not reconcile them and tore down and rebuilt all fifteen sliders on every pixel of drag. This — not the arithmetic — was the dominant cost.

Fixes applied, in order of impact:

1. **Moved every subcomponent to module level** so identities stay stable across renders
2. **Memoised both charts** — during a drag the projection array keeps its reference, so Recharts skips rendering entirely
3. **Disabled Recharts animations** — each data change was firing a 1.5-second animation that retriggered continuously mid-drag
4. **`useDeferredValue`** on all projection inputs, so the slider thumb tracks the finger while the recalculation happens at lower priority
5. **Stable callbacks** via `useCallback`, with sliders passing a `field` name rather than a fresh inline arrow, so memoisation actually holds
6. **Finer step values** so movement feels continuous

### 5.4 Verification

The engine was tested as a standalone module. Checks that pass:

- Opening balances appear at the current age with no phantom year of growth
- Monthly compounding matches an independent manual calculation exactly
- Lump sum leaves precisely 75% in the pension
- Mortgage clears in exactly the specified year
- Withdrawal equals exactly 4% of the post-lump-sum pot in year one
- State Pension starts in the correct year, correctly inflated
- Joint totals reconcile against the sum of individual pots
- Depletion is detected correctly in a deliberately under-funded scenario
- LISA contributions receive exactly a 25% government top-up before compounding
- The LISA is never drawn before age 60, and becomes drawable from age 60 onward
- Fixed drawdown order is respected: other savings, then Cash ISA, then Stocks & Shares ISA, then LISA
- `migratePerson()` correctly maps an old single-ISA save onto the new sub-account shape, and is a no-op on an already-migrated save
- **Individual-mode results are identical before and after the joint-planning rewrite** — the regression guard that mattered most

The built PWA was additionally rendered in a headless browser to confirm it boots, calculates, toggles into couple mode and persists state.

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

Push changes to `main`. The service worker caches aggressively, so if you don't see an update, bump `CACHE = 'retirement-planner-v1'` in `sw.js` to `v2`, or fully close and reopen the installed app.

---

## 7. Known limitations

> These are deliberate simplifications, not defects. Worth knowing before relying on the output.

1. **Income tax in retirement is not modelled.** Pension drawdown above the personal allowance is taxable; ISA withdrawals are not. Real spendable income will be lower than shown, particularly for larger pension incomes. This matters *more* for couples, since two personal allowances are more tax-efficient than one large income.
2. **Salary is not modelled at all.** Where retirement dates differ, the working partner's earnings do not offset household costs, so longevity is understated.
3. **Mortgage is a straight-line runoff** — monthly payment × 12 × years, reduced annually. There is no interest amortisation, so the outstanding balance shown is an approximation of a real redemption figure.
4. **Growth is a fixed annual rate** with no sequence-of-returns risk or volatility modelling. A poor first decade of retirement is far more damaging than the same average return implies.
5. **One inflation rate** applies to all spending categories; healthcare in particular tends to inflate faster.
6. **PLSA bands are not inflated forward** — they are compared against nominal future income, which flatters later years.
7. **ISA/LISA contributions are not hard-capped** in the engine; the £20,000 combined and £4,000 LISA limits are warned about (§3.5), not enforced — unlike the pension allowance, which is a hard cap.
8. **Defined benefit pensions are not supported** — only defined contribution pots.
9. **Device-local storage** — phone and laptop keep separate plans, and clearing browser data erases the saved plan. Manual export/import (§3.7) can move a plan between devices or back it up, but there's no automatic sync.
10. **No LISA first-home exception.** Real LISAs allow penalty-free access before 60 for a first home purchase; this tool has no house-purchase concept to hang that on, so the age-60 restriction is unconditional.
11. **Unlimited free-form "other savings" accounts.** A person can add any number of named non-ISA savings accounts — this is intentional, not a bug.

### Possible future additions

- [ ] Model income tax and personal allowances in retirement
- [ ] Model the working partner's salary before their retirement
- [ ] Proper mortgage amortisation with an interest rate input
- [ ] Monte Carlo / sequence-of-returns stress testing
- [ ] Uprate PLSA bands with inflation for like-for-like comparison

---

## 8. Build history

<details>
<summary><strong>Accuracy fixes made during the calculation review</strong></summary>

1. **25% lump sum was never applied** to the projections — calculated for display only, leaving pension balances 25% overstated
2. **4% rule was implemented incorrectly** as 4% of the declining balance each year, rather than a fixed initial amount uprated by inflation
3. **Expenses were inconsistent** between the projection and the income chart — one assumed the mortgage was included, the other that it was excluded
4. **Chart started one year late**, showing balances after a year of growth instead of today's figures
5. **Retirement balances were frozen** — remaining pots did not grow after withdrawals, understating longevity
6. **Income chart read an always-zero field**, so pension withdrawal bars were empty
7. **Income chart used `BarChart` with a `Line` child**, so the expenses line silently never rendered — needed `ComposedChart`
8. **Gauge thresholds were evenly spaced** but plotted on a linear scale, so the labels did not line up with the colour bands
9. **PLSA and State Pension figures were out of date** and were refreshed to current values

</details>

<details>
<summary><strong>Design decisions worth remembering</strong></summary>

- **Calendar-year anchoring** rather than age, so two different ages align on one axis
- **Lump sum moves to the ISA** rather than being treated as spent, on the basis that it remains invested capital
- **Joint expenses start at the first retirement**, chosen deliberately as the cautious option
- **Mortgage kept as a single shared liability** rather than split between partners
- **Growth profile persists into retirement** rather than assuming a de-risking glidepath

</details>

<details>
<summary><strong>Extra savings accounts (Cash ISA / S&S ISA / LISA / other savings) — spec/002-extra-savings-accounts.md</strong></summary>

- **Split the single "ISA" field into Cash ISA, Stocks & Shares ISA and LISA**, each with its own balance/contribution/growth rate, plus a free-form "other savings" list for non-ISA money (Premium Bonds, general savings) — replacing a field that `docs/TOOL_DOCUMENTATION.md` §4 had documented as "Cash and Stocks & Shares combined" ever since the original build.
- **LISA bonus is a fixed engine-side top-up** (`contribution × 1.25`), not a configurable input — the same treatment already given to the pension lump sum.
- **ISA/LISA allowance enforcement is warning-only**, deliberately asymmetric with the pension allowance's hard cap: a single combined pension contribution has one unambiguous number to cap, but three independently-growing ISA-type accounts have no unambiguous way to attribute a proportional reduction across them.
- **Fixed drawdown order (other savings → Cash ISA → S&S ISA → LISA)** replaces the old single proportional ISA draw, generalising the same proportional-by-balance mechanic to four tiers instead of one — cross-person behaviour within a tier is unchanged from before.
- **Old saves are migrated on load** (`migratePerson()`), mapping a pre-existing ISA balance onto the opening Stocks & Shares ISA balance — never silently dropped or reset to zero.
- **Other savings count as real wealth** for the depletion check and wealth/income charts, but are not part of the "ISA" total shown elsewhere in the app — they're household money, just not an ISA.

</details>

<details>
<summary><strong>Mobile sticky summary bar — spec/003-mobile-sticky-summary-bar.md</strong></summary>

- **Only the three summary boxes (Pot/Income/Living Standard) stay pinned on scroll now**, not the whole header — the title and Reset/Partner buttons were sharing one `sticky` wrapper with the summary boxes for no reason tied to their content, permanently eating mobile screen space needed for sliders. The header (title/buttons) and the summary bar are now two independent siblings; only the summary bar is `sticky`. This applies at every viewport width, not just mobile — desktop's unscrolled appearance is unchanged, but scrolling there now also leaves the title/buttons behind.
- **Mobile summary values were clipped, not wrapped**, inside a hard `max-h-24` (96px) cap with no ability for long text to wrap onto a second line. Fixed by giving each box `min-w-0` (so a CSS grid item can actually shrink below its content's intrinsic width instead of overflowing) and `break-words` on the value text, and raising the cap to `max-h-40` (160px) so a wrapped line isn't cut off.
- **Value text is `text-xs` on mobile, not `text-base`** (unchanged `text-xl` at `md:` and up). `text-sm` was tried first but still forced an ugly mid-word split (e.g. "Minimu"/"m") for the longest Living Standard label at the narrowest supported width (320px); `text-xs` wraps those cases cleanly at word boundaries instead. Extremely large pot values (8+ figures) or "Comfortable" can still wrap mid-word at 320px — accepted, since the fix's guarantee is that nothing is ever clipped or squashed, not that everything fits on one line, and the 3-column mobile grid itself was deliberately kept unchanged.
- **The inlined Tailwind stylesheet doesn't include every utility class name** — see §5.1. `min-w-0`, `break-words` and `max-h-40` were never used in the original build, so their CSS had to be hand-added to the component's inline `<style>` block; using the class names in JSX alone would have silently done nothing.
- **A pre-existing ~78px horizontal page overflow at narrow mobile widths (independent of this fix) was found during verification** — reproduces identically on `main` before this change, with no relation to the summary bar's content. Left alone as out of scope for this requirement; worth its own bug report.

</details>

<details>
<summary><strong>JSON import/export — spec/004-json-import-export.md</strong></summary>

- **`schemaVersion` is written but not yet read for anything.** It exists now so a future breaking change to the saved-state shape (in the style of intent 002's old-ISA migration) has something to branch on — there is currently only one shape (`v1`), so there's no migration logic to write yet.
- **Export is inputs-only, not inputs + computed projection.** The projection is fully reproducible from the inputs, so the file stays a backup/transfer artifact rather than also trying to double as a point-in-time report. Confirmed explicitly rather than assumed — a genuine fork in the requirement, not the only reasonable choice.
- **The pre-export warning shows every time, not once.** A one-time notice has a real failure mode here: the person who mishandles the file later is unlikely to be the same person who read a warning months earlier on their first export. Deliberately not gated behind a `localStorage` "seen it" flag.
- **`PERSISTED_FIELDS` is a single shared array** — the auto-save effect, `exportPlan()` and `importPlanFields()` all read the same list, rather than three independently-maintained field lists that could silently drift apart.
- **Import is per-field tolerant in both directions.** A field missing from the imported file leaves the *current* value untouched (not reset to an app default) — the file is trusted as far as it goes, not treated as all-or-nothing. A field the file doesn't recognise (e.g. from a newer app version) is simply never read.
- **Import is full-overwrite-on-confirm only, no merge.** Confirmed explicitly with the user as a real trade-off (someone maintaining two devices' plans separately can't combine them via import) rather than an oversight.
- **`migratePerson()` runs on import, not just on initial `localStorage` load** — an imported file can be exactly as stale as an old saved plan, so it goes through the same migration path rather than a separate copy of it.

</details>

<details>
<summary><strong>User-facing changelog ("What's new") — spec/005-user-facing-changelog.md</strong></summary>

- **In-app, not GitHub Releases.** The original plan for this requirement was a GitHub Release per user-facing change. Reconsidered mid-flight: this app is deliberately self-contained and works offline, and a Release lives entirely outside that boundary. Building it into the app itself keeps the whole feature inside the PWA, and also removes a real constraint the Releases version had — a Release can only be created after a PR merges (a tag needs a commit to point at), where an in-app entry is just part of `index.html` and lands in the PR like everything else.
- **A swappable view inside the existing Data menu, not a third stacked section.** Chosen specifically to avoid the same class of mobile-cramping problem intent 003 already had to fix once for the header — a list that only grows over time, stacked next to Export/Import, would make the popover's height unbounded. The "What's new" view replaces the panel's content entirely (its own scrollable region, capped height) rather than appending to it; a `view` state (`'menu' | 'whatsnew'`) resets to `'menu'` on every close path via one `useEffect` keyed on the panel's open state, rather than threading a reset through each individual close action.
- **The version label reuses the `sw.js` `CACHE` value**, gaps and all — a merge that isn't user-facing (like the engine test harness) never gets an entry, so the sequence skips numbers. That's intentional, not a bug: see §3.8.
- **Two more Tailwind utilities turned out to have no CSS behind them**, found while verifying this feature in a real browser rather than assumed working from the class names alone: `w-72` and `right-0` — both already present in the `SettingsMenu` popover's className since intent 004, silently doing nothing. The popover was never actually 288px wide or right-aligned; it was previously narrow enough, by coincidence of its Export/Import content's shrink-to-fit sizing, to still land inside the viewport. Adding this requirement's content changed that sizing enough to make the popover visibly overflow off-screen — which is what surfaced both bugs. Fixed the same way intent 003 fixed `min-w-0`/`break-words`/`max-h-40`: the missing rules hand-added to the inline `<style>` block. Also simplified the new markup to avoid needing several more (`list-disc`, `pl-4`, `hover:underline`, `pr-1`) by using plain bullet-prefixed paragraphs and existing spacing utilities instead — fewer hand-authored CSS rules to keep in sync by hand next time.

</details>
