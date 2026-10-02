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
| Projection span | Current age through to age 100 (or the life expectancy, if that is higher), anchored on calendar years |
| Tax year basis | 2026/27 allowances; Retirement Living Standards 2026 (Pensions UK) |
| Income tax | Rest-of-UK bands, thresholds frozen to 2030/31 then inflation-uprated |
| Modes | **Simple** (default, the core model) and **Advanced** (beta: scenarios, Monte Carlo, phased spending, downsizing, multiple DB pensions, comparisons, a printable report) — §3.15 |
| Data storage | Browser localStorage on-device only. Plan figures never leave the device. The optional feedback page (§3.12) sends only what the user types into it, and only when they press Send. The optional account (§3.16), off until configured, holds an email address, a consent choice and an access flag, never plan figures. |

---

## 2. Requirements built to

### 2.1 Original brief

A sophisticated, production-grade UK retirement calculator with exceptional design quality — premium financial services aesthetic, distinctive typography (explicitly not Inter/Roboto), meaningful colour coding, smooth animations, card-based layout.

**Inputs required:**
- **Personal** — current age (18–80), retirement age (50–75, must exceed current), life expectancy (75–110; the minimum is also at least one year after retirement age, and new plans default to the UK average, 81)
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
- [x] "Send feedback" page that files private GitHub issues, with daily triage (intent 026)
- [x] Roadmap batch, decided autonomously at the owner's request (intents 034–056): Living Standard compared in today's money, mortgage interest, a still-working partner's pay, "What if?" sliders, "What matters most", share with your AI assistant, AI/search discoverability, Simple/Advanced modes, magic-link accounts with marketing consent, scenarios, pension vs ISA vs cash, bridge to State Pension, phased and one-off spending, printable report, Monte Carlo, property and downsizing, multiple DB pensions with indexation, a Simple-mode cap on extra savings accounts, an MCP server and a brand identity

---

## 3. User guide

### 3.1 Getting started

The app opens in individual mode with illustrative defaults. Overwrite them with real figures — either drag a slider or type directly into the number box beside it. Every change recalculates immediately. Number boxes show thousands separators (250,000) when you aren't typing in them; you can paste values such as `£1,200`, and a blank or non-numeric entry restores the previous figure. Sliders and boxes are named for screen readers (with value and unit), and the (i) help icons open with a tap, Enter or Space and close with Esc.

### 3.2 Adding a partner

Tap **Add a partner** in the header (or the dashed card in the left column). This reveals a second, independent input panel. Remove them again with the **×** on their card.

In joint mode the layout changes:
- A **Retirement Years** card shows both retirement years side by side
- **Per-person breakdown cards** show each person's pension, ISA and total at their own retirement
- The wealth chart stacks each person separately — ink/green for person one, teal/lime for person two
- Each person gets a **Take-home Pay (Annual)** slider (§3.3, §4.5)
- Living standard switches to the **two-person** Retirement Living Standards bands

Both names are editable — tap the name to rename.

### 3.3 What each section covers

| Section | Per person or shared? | Notes |
|---|---|---|
| Ages and retirement timing | Per person | Shows the calendar year they retire. In couple mode, also **Take-home Pay (Annual)**: pay after tax and the person's own contributions, in today's money, used only in years when the other partner has retired and this one hasn't (§4.5) |
| Savings | Per person | Cash ISA, Stocks & Shares ISA, LISA, and free-form "other savings" accounts (up to 3 in Simple mode, any number in Advanced; §3.15) |
| Pension | Per person | Includes employer contributions and lump sum choice |
| Defined Benefit (DB) Pension | Per person | Optional — one DB pension each (§3.11) |
| State Pension and inheritance | Per person | Each person can have a different State Pension age |
| Living costs | Shared | Entered once for the household |
| Mortgage | Shared | Single joint liability. **Mortgage Interest Rate** (0–10%, default 4.5%, shown while there is a mortgage) sets the outstanding balance; its subtitle shows the balance owed today (§4.4) |
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
- **Living Standard gauge** — positions household income after tax, **in today's money**, against the Retirement Living Standards bands (Pensions UK), which are themselves today's-money figures (intent 037). The big figure is the today's-money income; the line under it gives the same income in the pounds of that year. The sub-line reads "Pension £X · Savings £S · State £Y · DB £W · Tax −£Z" in that year's pounds (each entry appears only when non-zero), which adds up to the future-£ figure. The Living Standard level on the summary card, the sticky banner and the "below minimum" warning all use the same today's-money comparison.
- **Sustainable income** (Income card, sticky banner, gauge) is the first year everyone is retired: the withdrawal rate applied to each person's pension pot at their own retirement (taxed) and to their ISAs and other savings (tax-free), plus State Pension and DB pensions already being paid in that year (the projection's own figures for that year), minus Income Tax (§4.8).

### 3.5 Warnings

The red banner appears when any of these trigger:
- Pension contributions exceed the £60,000 annual allowance
- Combined Cash ISA + Stocks & Shares ISA + LISA contributions are above the £20,000 annual allowance (the projection counts only up to it — §4.1)
- LISA contributions are above the £4,000 annual limit (the projection counts only up to it)
- A person still contributing to a LISA will reach age 50 before retiring (LISA contributions stop at 50)
- A gap exists between retirement and State Pension age
- A gap exists between retirement and a person's DB pension start age (only when that person has a DB pension)
- Household income (after tax, in today's money) falls below the Retirement Living Standards minimum
- Funds are projected to run out before the plan horizon

The banner has a **×** close control. Dismissing it hides the whole banner — not individual warning lines — and persists across reloads on that device. It's tied to the exact set of warnings shown at the time: if any input change alters which warnings apply (a figure changes, a warning appears or disappears), the banner reappears automatically with the new set. This is separate from the *"This file contains your personal financial figures..."* warning in §3.7, which is shown every time regardless of prior dismissal — that one is a data-handling caution aimed at whoever currently has the Data panel open, not necessarily the person who saw it last time, so a persistent dismiss wouldn't be appropriate there the way it is for this planning-condition banner.

### 3.6 Saving and resetting

Figures auto-save about half a second after each change — a brief **Saved** appears in the header. The latest change is also saved immediately when you close the page or switch away from it. If the browser refuses to store data (for example in a private window), the header instead shows a persistent **Not saved on this device — export a backup** button that downloads the plan file, and **Saved** is not shown. Data lives in that browser's storage on that device only, so your phone and laptop keep separate plans. The **↺ Reset** button clears the saved plan and restores defaults, including any dismissed warning banner.

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

A **Send feedback** item in the **⚙ Data** panel, below What's new, and a small **Send feedback** link in the page footer both open the feedback page (`feedback.html`) in the same tab. It has a "← Back to the planner" link. The Data panel item, and the top of the page, carry the line *"Sends only what you type here to the developer. Your plan figures aren't included."* The Data panel's privacy note now reads "…nothing is sent anywhere unless you choose to export a file or send feedback yourself."

- The form asks for a type (Bug / Idea / Something confusing / Other), what happened or what you'd like, optional steps or example figures ("only share what you're comfortable with"), and an optional email ("if you'd like to hear when this is fixed"). No account or sign-in is needed.
- The app passes its version in the link (`feedback.html#v=v17`), so a report can be matched to the build it came from. Nothing else is added: **the app never sends plan figures or anything else automatically.** Only what the user types is sent, and only when they press **Send**.
- After sending: *"Thanks, your feedback has been sent."* If sending fails for any reason (offline, a limit reached, a server error): *"Sorry, that didn't send. Please try again later."* The user's text stays in the form. There's no up-front offline check.
- There is no in-app prompt asking for feedback. Nobody is emailed automatically: if an email was given, the owner may reply by hand. Automatic "this is fixed" emails are a possible later requirement, once the app has its own domain. "What's new" (§3.8) is where fixes show up.
- Both entry points are hidden, and the page says feedback isn't available, while no feedback address is configured (`window.FEEDBACK_ENDPOINT` empty in `feedback-config.js`; see §5.2).

Behind the page, a small Cloudflare Worker files each submission as an issue in a **private** GitHub repo, not this public one. The optional email goes into that private issue. A daily Claude Code routine labels and comments on new issues (triage only) and never copies an email address anywhere. Setup, spam limits and triage rules: `tools/feedback/README.md` and `tools/feedback/TRIAGE.md`.

### 3.13 "What if…?" and "What matters most"

Two collapsible cards sit under "Your projection assumes...". Both are closed by default and only calculate while open.

- **What if…?** (intent 040) — four sliders applied together to a copy of your plan: retire earlier or later (−5 to +5 years, one shared change for a couple, within the usual 50–75 limits), change spending (−30% to +30%), change investment growth (−3 to +3 points on every account) and an extra pension contribution (£0–£1,000 a month per person, within the annual allowance). A table shows **Your plan** beside **What if** for: money lasts, pot at retirement, first-year income after tax in today's money, Living Standard and money left at the plan end in today's money; changed figures are highlighted. **Apply to my plan** (after a confirm) writes the retirement, spending and contribution changes into your inputs; growth is not applied because it is set by the profile buttons. **Reset** zeroes the sliders, which are never saved.
- **What matters most in your projection** (intent 041) — nine one-at-a-time changes (retire 2 years later/earlier, spend 10% less/more, growth 1 point higher/lower, inflation 1 point higher, £100 a month more into each pension, plan for 5 more years), ranked by the change in money left at the plan end (today's money), each with a bar and, where it moves, the change in how many years the money lasts. Headed "These are not recommendations"; every row describes the model's response only.

### 3.14 Share with your AI assistant

**⚙ Data → Share with your AI assistant** (intent 042) builds a Markdown summary of the plan to paste into an assistant the user already uses (Claude, ChatGPT…), with **Copy** and **Download .md**. It contains: a header (illustrative, not advice, names removed), notes for the assistant, headline results, every input, a methodology summary, five example questions and the plan as JSON in the Export format with names removed (so an assistant with the MCP server, §3.18, can recalculate it). **No personal identifiers:** people become "Person 1/2", DB schemes, savings accounts and one-off costs get generic labels. Advanced mode adds a year-by-year table and a summary of each saved scenario. The view says the text goes wherever it is pasted. The app itself never sends it anywhere.

### 3.15 Simple and Advanced modes

A **Simple | Advanced (beta)** switch sits in the header (intent 044). **Simple** is the core model and everything above. **Advanced** adds:

- *Inputs:* spending phases and one-off costs (in Living Costs), a **Home & downsizing** card, extra DB pensions and per-scheme yearly increases (in each DB pension section), and unlimited other-savings accounts (Simple allows 3 per person; plans that already have more keep them all — intent 054).
- *Tools* (cards under the Living Standard): **Report (PDF)**, **Scenarios**, **Varied returns (Monte Carlo)**, **Pension, ISA or cash?** and **Bridge to State Pension** (§3.17).

Advanced inputs are saved with the plan but **only apply in Advanced mode**: in Simple mode the projection ignores them and a blue note says how many Advanced settings are switched off, with a link to switch. The mode is a device display preference (like the theme), never part of an exported plan.

**Access.** While accounts are not configured, or `advancedRequiresAccount` is false, Advanced is an open beta preview. When it is true, choosing Advanced without access opens the sign-in dialog (§3.16).

### 3.16 Accounts (optional, for Advanced)

Off until a Supabase project is set in `account-config.js` (intent 045; setup in `tools/accounts/README.md`); until then no account UI appears anywhere and the privacy wording still says "no account". When on:

- **⚙ Data → Sign in (for Advanced mode)** (or the dialog when locked Advanced is chosen) asks for an email address and offers an **unticked** "Email me product news and offers (optional)" box (roadmap #14). A magic link is emailed; opening it on the same device signs in and the app strips the tokens from the address bar.
- The account panel shows the email, whether Advanced is unlocked, the marketing choice (changeable) and **Sign out**.
- The account holds an email address, the consent choice and an access flag. **Plan figures are never sent.** The Data panel and footer privacy lines change to say an account is only needed for Advanced mode.

### 3.17 Advanced tools

- **Spending phases** (intent 049) — rows of from age / to age / change % (−50 to +50) on Person 1's timeline, applied to annual expenses only (not healthcare or the mortgage); overlaps add. Presets: "Active early years (+15% to 75)" and "Slower later years (−20% from 80)".
- **One-off costs** (intent 049) — name, Person 1's age and an amount in today's money, inflation-uprated and added to that year's spending; only from the first retirement onward.
- **Home & downsizing** (intent 052) — home value today, house price growth (default 3%), and optionally a move at Person 1's chosen age to a home costing a % of the sale price (default 60%) with moving costs (default 5%). The card states the cash released (also in today's money), whether the move had to be skipped because the sale wouldn't cover it, and the projected home value at the end. The home is never counted as savings.
- **More DB pensions and yearly increases** (intent 053) — each DB scheme, including the first, can follow the inflation assumption (default), CPI capped at a rate, RPI, a fixed rate or no increases; **+ Add another DB pension** adds schemes with name, amount and start age.
- **Scenarios** (intent 046) — save the current inputs under a name (up to 10), rename, load (after a confirm; saved scenarios are kept) or delete. Tick up to three to compare with the current plan in a table (money lasts, pot at retirement, income after tax and Living Standard in today's money, money left at the end, lifetime tax) and a chart of total savings over time. Scenarios are saved with the plan and go through Export/Import.
- **Pension, ISA or cash?** (intent 047) — an extra monthly amount (cost to you, £25–£2,000) for either person, put into a pension (grossed up 25% by basic-rate relief), a Stocks & Shares ISA or a Cash ISA (limited to the remaining allowance, noted when it bites) or other savings at the Cash ISA rate. A table compares income after tax, money lasts, money left and lifetime tax, with the best figure per column in bold — described as what the model calculates, not what to do.
- **Bridge to State Pension** (intent 048) — for each person retiring before State Pension age: the bridge years, the total drawn from pensions and savings across the household bridge period (today's money), and a year-by-year table of spending, guaranteed income, earnings, pension drawn, tax, from savings and savings left.
- **Varied returns (Monte Carlo)** (intent 051) — **Run 1,000 simulations** reruns the plan with each year's growth varied (§4.9). Shows the share of runs where the money lasts to the plan end, the middle depletion year among runs that ran out, and a fan chart (10th–90th percentile band and the middle outcome) of total savings in today's money. A note appears if inputs change after a run.
- **Report (PDF)** (intent 050) — opens a full-page, always-light report and the browser's print dialog ("Save as PDF"): summary, both charts, every input (with names, since the file is the user's), a year-by-year table and a methodology summary. Print CSS hides the app.

### 3.18 MCP server

An MCP server (intent 055; `tools/mcp/README.md`) lets an AI assistant that supports the Model Context Protocol run the planner's own engine on a plan in the Export format: `project_retirement_plan`, `what_if`, `what_matters_most`, `get_methodology`, `get_uk_reference_figures`. It is stateless and keeps nothing. The Share view (§3.14) links to its setup.

### 3.19 Discoverability

The page carries a meta description, Open Graph tags, JSON-LD (`WebApplication`, `FAQPage`) and a static summary inside `#root` that React replaces on load, so crawlers that don't run JavaScript still see what the tool does. `llms.txt` and `llms-full.txt` (the full methodology) describe the tool for AI assistants; `robots.txt` allows every crawler and points at `sitemap.xml` (intent 043). No analytics or tracking were added.

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

Each person's savings are modelled as up to four independent account types, each with its own balance, monthly contribution and growth rate: **Cash ISA**, **Stocks & Shares ISA**, **LISA**, and any number of free-form **other savings** accounts (e.g. Premium Bonds, general savings). LISA contributions receive an automatic **25% government bonus**, credited monthly alongside the LISA's own growth (`lisaContribution × 1.25` added each month, on top of compounding) — mirroring how the pension lump sum is already special-cased as a fixed, non-configurable top-up. **ISA and LISA caps (intent/033).** The three contribution boxes share the £20,000/yr combined allowance, and the LISA has its own £4,000/yr limit, all fixed in nominal terms like the pension cap. They are enforced twice. (1) At the input: each box's maximum is what is left of the combined allowance after the other two boxes (the LISA box is also limited to £4,000/yr), shown in the box's subtitle; only the box being edited is limited, and other boxes are never rewritten. (2) In the engine, as a backstop for saved plans and imported files that are already over the limit (their values load unchanged): `isaContributionsFor(p, age)` limits the LISA to £4,000/yr, then any excess over £20,000 combined comes off the Stocks & Shares ISA first, then the Cash ISA. The 25% bonus applies to the capped LISA figure only. **LISA contributions and the bonus stop once the person reaches age 50** (contributions apply while age < 50, so the last year is age 49 — slightly conservative, since the real rule runs to the 50th birthday). Allowance freed by the stop is not reassigned to the other ISAs. `computePotBreakdown()` uses the same helper so its contributions total still reconciles.

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

1. **Guaranteed income: State Pension + DB pension** — State Pension begins at each person's State Pension age; a DB pension begins at that person's DB start age. State Pension is inflation-uprated from today by the household rate; each DB scheme by its own indexation (household rate by default; §4.3 "Defined Benefit (DB) pension"). They are pooled into one figure; there is no ordering between them (both are non-depletable, already-promised income)
1a. **Take-home pay** of a partner who is still working while the other has retired (couple mode, §4.5) — net pay, so not taxed again
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
gap = max(0, targetExpenses - (statePension + dbPension + takeHomePay + pensionDraw - tax))  // funded from savings tiers
```

- **Freeze, then inflation.** Thresholds are kept at today's amounts through 2030/31 (to 5 April 2031, as announced), then rise each year with the household inflation input. All four thresholds move together — including the £100,000 taper threshold and £125,140, which in law aren't indexed — so the Personal Allowance still reaches zero exactly at the additional-rate threshold every year. Thresholds and tax are not rounded inside the calculation; rows round per field.
- **No gross-up.** The pension drawdown stays at the gross 4%-rule amount (the rule is defined on the gross withdrawal). Tax reduces net income, and the larger gap is funded from the existing tax-free savings tiers in the existing order.
- **Untaxed.** ISA, LISA and other-savings withdrawals and the tax-free lump sum are not taxable income.
- **Per person.** Each person has their own Personal Allowance and bands; in joint mode two £20,000 incomes pay £1,486 each, not the £5,486 one £40,000 income would.
- Each row carries `p1StatePension`/`p2StatePension`, `p1DbPension`/`p2DbPension` plus household `dbPension`, `p1TaxableIncome`/`p2TaxableIncome`, `p1Tax`/`p2Tax`, `p1LumpSum`/`p2LumpSum`, `p1LumpSumExcess`/`p2LumpSumExcess`, plus household `incomeTax` (= `p1Tax + p2Tax`) and `netIncome` (State Pension + DB pension + pension withdrawal − tax; excludes savings draws).
- The Living Standard card's household figure applies the same helpers to the components it shows (each person's first-year pension draw plus their State Pension input plus their DB pension input if it has started by then, at `bothYear`'s thresholds), so its "Pension · State · DB · Tax" sub-line adds up to the big figure.

#### Defined Benefit (DB) pension

One DB pension per person in Simple mode (`dbPensionName`, `dbPensionAmount`, `dbPensionStartAge` on the person object; all optional — `dbPensionOf()` reads absent fields as amount 0, start age 65). Advanced mode (intent 053) adds `dbPensions: [{ id, name, amount, startAge, indexation, indexRate }]` for more schemes and `dbPensionIndexation` / `dbPensionIndexRate` for the first one. `dbPensionsOf(p)` returns every scheme with amount > 0; the engine sums them per person. The user enters an already-promised annual income in today's money, paid from its start age, taxed as that person's income, and pooled with State Pension as guaranteed income ahead of the savings tiers. Uprating from today, `dbIndexFactor(scheme, y, inflation)`:

```javascript
inflation (default)  (1 + inflation)^y            // identical to State Pension, so pre-053 plans are unchanged
cpiCapped            (1 + min(inflation, cap))^y
fixed                (1 + rate)^y
none                 1
rpi                  (1 + inflation + 1pt)^w × (1 + inflation)^(y − w),  w = min(y, 2030 − 2026)
```

RPI is modelled as running 1 percentage point above the inflation input until 2030 and equal to it afterwards, because RPI is being aligned with CPIH from February 2030 (`UK_REFERENCE.rpi`). The increase applies to the today's-money amount from today; deferred revaluation and pension-in-payment increases are not modelled separately. In Simple mode `planForMode()` strips `dbPensions` and the indexation fields, so only the first scheme at the household rate counts. Deliberately **not** modelled, because there is no factual basis in the inputs to model them: commutation / a tax-free lump sum from the DB scheme (scheme-specific factors — approximate with Expected Inheritance if needed); DB accrual against the Annual Allowance (16× test) or crystallisation against the Lump Sum Allowance (20× valuation); and survivor's pensions (the tool has no death-triggered mechanic anywhere).

#### Annual allowance and MPAA

The £60,000 pension annual allowance is already a hard cap in the engine (§4.1), so over-allowance contributions are capped rather than taxed. The £10,000 Money Purchase Annual Allowance applies once someone flexibly accesses a DC pension while still contributing; in this model contributions stop in exactly the year drawdown starts and there is no phased retirement, so the MPAA can never trigger. Neither needs code — they are documented here so the absence isn't mistaken for a gap.

### 4.4 Expenses and inflation

```javascript
targetExpenses = annualExpenses × phaseFactor(p1Age) × (1 + inflation) ^ years
                 + healthcare × (1 + inflation) ^ years
                 + mortgagePayment × 12                 [while the mortgage runs]
                 + Σ oneOff.amount × (1 + inflation) ^ years   [one-offs at p1Age, Advanced]
phaseFactor(age) = max(0, 1 + Σ changePct of phases with fromAge ≤ age ≤ toAge)   [Advanced; 1 otherwise]
```

Non-mortgage spending inflates; mortgage payments stay flat until the debt clears, then drop out entirely. Spending only starts at the first retirement, so spending phases and one-off costs before then have no effect (the one-off age box starts at retirement age). Phases and one-offs are keyed on Person 1's age (intent 049).

**Mortgage balance (intent 038).** The payment and years left are the user's inputs; the outstanding balance shown on the Wealth chart is the present value of the remaining monthly payments at the Mortgage Interest Rate, `mortgageBalance(payment, months, rate)`:

```javascript
i = rate / 12;  n = months left at the start of the row year
balance = i > 0 ? payment × (1 − (1 + i)^−n) / i : payment × n
```

At 0% this is the old straight line. Payments and the payoff year do not depend on the rate. Saved plans without the field load with 4.5%; the engine treats an absent `mortgageRate` as 0, so the regression baseline is unchanged.

### 4.5 Joint-planning model

> Each person's pension and ISA grow and are drawn **independently**, using their own ages and retirement dates. Shared living costs and the mortgage are a **single joint liability**, funded from combined pots from the moment the **first** person retires.

**A still-working partner's take-home pay (intent 039).** In couple mode each person can enter `takeHomePay` (annual, today's money: pay after tax and their own pension and savings contributions). It counts only in years when someone in the household has retired and this person hasn't, rises with the household inflation rate (no real pay growth), and pays for spending after guaranteed income and before pension drawdown and savings. Pay above what the household spends is not saved, and it is never taxed again. Rows carry `workIncome`, `p1WorkIncome` and `p2WorkIncome` only when it is in use (so the baseline row shape is unchanged), and the income chart shows an "Earnings" bar. Left at £0 (the default) the old, deliberately cautious behaviour applies: from the first retirement onward, full household costs are drawn from savings. In individual mode it has no effect, because spending only starts at retirement.

The projection is anchored on **calendar years** so that differing ages align correctly across all charts.

### 4.6 Longevity test

Funds are considered depleted the first year that combined pension plus ISA plus other savings falls below £1,000, measured only from the first retirement onward. The plan horizon is the **longer** of the two life expectancies. The Life Expectancy slider runs 75–110; its minimum is `max(75, retirement age + 1)`, and raising retirement age past it lifts life expectancy to match (intent 029).

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
| LISA last contribution age | 50 (contributions stop at the 50th birthday) | 2026/27 | https://www.gov.uk/lifetime-isa |
| LISA government bonus | 25% of contributions | 2026/27 | https://www.gov.uk/lifetime-isa |
| LISA minimum access age | 60 (no first-home exception modelled) | — | https://www.gov.uk/lifetime-isa |
| Retirement Living Standards, one-person | Min £13,900 / Mod £32,700 / Comf £45,400 | 2026 (Pensions UK, formerly the PLSA); after tax, excluding housing costs, outside London | https://www.retirementlivingstandards.org.uk/details |
| Retirement Living Standards, two-person | Min £22,500 / Mod £45,400 / Comf £62,700 | 2026 (Pensions UK, formerly the PLSA); after tax, excluding housing costs, outside London | https://www.retirementlivingstandards.org.uk/details |
| RPI–CPI wedge for RPI-linked DB schemes (Advanced) | +1 percentage point over the inflation input until 2030, then 0 (RPI aligned with CPIH from February 2030) | Modelling assumption from the published reform | https://www.gov.uk/government/consultations/a-response-to-the-consultation-on-the-reform-to-retail-prices-index-rpi-methodology |
| Default life expectancy (new/reset plans) | 81 (mean of UK period life expectancy at birth 79.1 male and 83.0 female, rounded) | ONS national life tables, UK 2022 to 2024 | https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/lifeexpectancies/bulletins/nationallifetablesunitedkingdom/2022to2024 |

No reference figures are needed for a default DB pension: the amount is a user input, and its yearly increase reuses the household inflation input. Advanced-mode RPI indexation uses the RPI row above. The Monte Carlo volatilities (§4.9) and the mortgage-rate default (4.5%) are modelling assumptions, not reference figures, so they live in code constants (`MONTE_CARLO`, `DEFAULT_MORTGAGE_RATE`) rather than `UK_REFERENCE`.

The Retirement Living Standards are the cost of each lifestyle; meeting them needs enough **after-tax** income, which is why the app compares them with after-tax household income, in today's money (§4.8). State Pension age is rising from 66 to 67, phased from April 2026.

### 4.8 Headline figures and the Living Standard

`householdAtRetirement(args, projections)` (engine span) computes the summary-card figures for `bothYear`, the first year everyone is retired; `planSummary(args)` wraps it with the verdict fields and is shared by the summary cards, What if, What matters most, scenarios, the comparison, the share export, the report and the MCP server, so none of them can disagree.

```javascript
per person i:
  pensionIncome_i = pensionPot_i at own retirement row × withdrawalRate        // taxable
  savingsIncome_i = (ISAs_i + otherSavings_i) at own retirement row × withdrawalRate   // tax-free (037 addendum)
  sp_i, db_i      = the projection's own p{i}StatePension / p{i}DbPension for bothYear (nominal)
  tax_i           = incomeTaxFor(pensionIncome_i + sp_i + db_i, thresholds(bothYear))
annualIncome      = Σ round(components) − round(Σ tax)                      // future £ of bothYear
incomeToday       = annualIncome / (1 + inflation)^(bothYear − 2026)
livingStandard    = livingStandardLevel(incomeToday, isCouple)              // vs today's-money bands
```

Intent 037 fixed two problems that only showed once the comparison was like-for-like: State Pension and DB pension used to be today's-money input amounts added to a future-£ pension figure, and "sustainable income" ignored ISAs and other savings (including the tax-free lump sum the model moves into the Stocks & Shares ISA). The projection engine itself is unchanged by both fixes.

### 4.9 Monte Carlo (Advanced)

`projectJoint()` accepts an optional `returnShocks` array indexed by projection year: `{ growth, cash }` percentage-point changes to that year's growth rates (`growth` → pensions, Stocks & Shares ISA, LISA; `cash` → Cash ISA and other savings, including downsizing proceeds). Absent or zero shocks reproduce the deterministic projection exactly. `runMonteCarlo(args, opts)`:

```javascript
MONTE_CARLO = { runs: 1000, growthVolatility: 12, cashVolatility: 1, seed: 20261002 }
for each run: shock_y = { growth: N(0,1) × 12, cash: N(0,1) × 1 } for every year   // mulberry32 + Box–Muller
successRate  = share of runs where planSucceeds(rows, firstRet, planEnd)
fan          = per year ≤ planEnd: 10th / 50th / 90th percentile of total savings, deflated to today's money
medianDepletionYear = middle depletion year among runs that ran out by planEnd
```

Shocks are independent from year to year and shared by both people. The fixed seed makes results repeatable for the same plan. The volatilities are illustrative assumptions, stated in the card.

### 4.10 Property and downsizing (Advanced)

`projectJoint({ property })`, with `property = { homeValue, growth, downsize, downsizeAge, newHomePct, costsPct }` (absent or `homeValue` 0 = no property). The home value grows at `growth` each year. In the year Person 1 reaches `downsizeAge`, if `downsize`:

```javascript
sale    = home value that year
release = sale − sale × costsPct − sale × newHomePct − mortgageBalance(owed that year)
if release ≥ 0: release joins Person 1's other savings as "Downsizing proceeds" (growth = Person 1's Cash ISA rate,
                drawn in the first tier); the mortgage is repaid and its payments stop; home value = new home cost
else:           no move is modelled (row flag downsizeSkipped)
```

The home is never counted in savings, the verdict or depletion. Rows carry `homeValue` (and `downsizeRelease` in the move year) only when a property is entered.

### 4.11 What if, What matters most and the allocation comparison

All three run the unchanged engine on modified copies of the plan. `applyWhatIf(args, changes)` applies `retireDelta` (shared, clamped to each person's 50/current-age+1 to 75 range, with life expectancy kept at least one year after retirement), `spendPct` (annual expenses), `growthDelta` (every account, including other savings), `extraPension` (added to each person's own pension contribution; the engine's annual-allowance cap still applies), `lifeDelta` and `inflationDelta`. `sensitivityAnalysis()` runs the nine `SENSITIVITY_CHANGES`, measuring money left at the **base** plan end (except the longer-life row, measured at its own end) and the change in the year money runs out. `allocationOptions()` (display layer) builds the four comparison plans: pension contribution + amount × 1.25 (basic-rate relief at source); S&S or Cash ISA contribution + min(amount, remaining allowance from `isaContributionMax`); or a new other-savings account at the Cash ISA rate.

---

## 5. Technical implementation

### 5.1 Stack

- **React 18** with hooks — no state management library
- **Recharts** for all three visualisations
- **Tailwind CSS** for styling — the inlined stylesheet is pre-generated, not a runtime compiler, so a class with no CSS behind it silently does nothing. Since intent 036 it is regenerated from the app script by the dev-only `tools/tailwind/` (`npm install && npm run build`), which safelists every class from the original build so the output is always a superset. **Run it after adding Tailwind classes** and commit the rewritten `index.html`; there is still no build step to deploy. Its config also holds the brand palette (intent 056: Tailwind's `blue` scale is replaced by "ink", so every `blue-*` class is brand ink) and softer shadows. Dark-mode overrides remain hand-written `.dark` rules in the component's `<style>` block. Dynamic class names built from strings aren't seen by the scanner — write them out in full.
- **Fraunces** (serif headings and the wordmark) paired with **Inter Tight** (body) via Google Fonts
- **Brand** (intent 056): ink navy (`#283860`/`#3a518f`), teal for the partner, a marigold accent in the sunrise mark (`icon.svg`, also inlined as `BrandMark`), warm paper background (`#f7f5f0`; dark `#0b1020`)
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
dbPensionOf()           one person's first DB pension with defaults for absent fields
dbPensionsOf()          every DB scheme a person has, with indexation (053)
dbIndexFactor()         uprating factor for one scheme (053)
dbPensionGapYears()     retirement-to-DB-start gap for the warning banner
mortgageBalance()       present value of remaining mortgage payments (038)
spendingPhaseFactor()   spending-phase multiplier at Person 1's age (049)
householdAtRetirement() summary-card household figures (037)
planSummary()           every headline result for one plan (shared everywhere)
applyWhatIf() / sensitivityAnalysis()   What if and What matters most (040, 041)
runMonteCarlo()         seeded simulation over returnShocks (051)
planForMode()           strips Advanced-only inputs in Simple mode (044)
planToEngineArgs()      saved plan / scenario / share JSON -> engine args (046, 055)

RetirementCalculator()  state, derived memos, layout
  ├─ SliderWithInput    memoised, module-level
  ├─ PersonInputs       memoised, module-level
  │   └─ DbPensionInputs memoised, module-level
  ├─ WealthChart        memoised
  ├─ IncomeChart        memoised
  ├─ TaxNotesPanel      memoised, module-level (wording from taxNoteText())
  ├─ CollapsibleCard    memoised shell for the optional panels; children render only while open
  │   ├─ WhatIfBody, WhatMattersBody                      (040, 041)
  │   └─ ScenariosBody, MonteCarloBody, AllocationBody, BridgeBody   (Advanced)
  ├─ PhasedSpendingInputs, PropertyInputs, ExtraDbPensions, NumberField   (Advanced inputs)
  ├─ ModeSwitch, Modal, AccountPanel (+ useAccount() hook)  (044, 045)
  ├─ SettingsMenu views: menu, Share (ShareView + buildShareMarkdown), Account, What's new
  └─ ReportView         portal on document.body for printing (050)
```

**Plan state (034 batch).** `PERSISTED_FIELDS` gained `mortgageRate`, `spendingPhases`, `oneOffCosts`, `property` and `scenarios`. The component builds one memoised `plan` object from its state, read by auto-save, Export, scenarios and the share export; `applyPlanFields()` is the single tolerant setter used by Import, loading a scenario and What if's Apply. All derived figures read one memoised `engineArgs` (already passed through `planForMode()`), so Simple mode never sees Advanced inputs.

**Accounts (intent 045).** `account-config.js` (`window.ACCOUNT_CONFIG`, cached by `sw.js`) holds the Supabase URL, the public anon key and `advancedRequiresAccount`. `accountApi` calls Supabase's REST endpoints with `fetch` (no SDK); `useAccount()` reads a magic-link return from the URL hash once, strips it with `history.replaceState`, keeps the session under `ukRetirementPlanner.session.v1`, refreshes it when expired and loads the `profiles` row. `advancedAccessFor(account)` is the gate. Schema, row-level security and setup: `tools/accounts/`.

**MCP server (intent 055).** `tools/mcp/worker/` is a stateless Cloudflare Worker speaking MCP's Streamable HTTP transport with JSON responses (POST `/mcp`, JSON-RPC 2.0, no sessions, no storage). `tools/mcp/build-engine.mjs` copies the `ENGINE-EXTRACT` spans and `llms-full.txt` into `worker/src/engine.generated.js`, so it runs the app's own engine; `tests/test-mcp-worker.mjs` fails if that copy is stale. `.github/workflows/deploy-mcp-worker.yml` deploys it on `main`.

**Feedback (intent 026).** `feedback-config.js` sets `window.FEEDBACK_ENDPOINT`, the feedback Worker's URL. It's loaded by both `index.html` and `feedback.html`, and listed in the `sw.js` cache. In `index.html`, `APP_VERSION` and the derived `FEEDBACK_HREF` (`feedback.html#v=<APP_VERSION>`, or `''` when the endpoint is empty) are module-level constants just above `USER_CHANGELOG`, and both entry points render only when `FEEDBACK_HREF` is non-empty. `APP_VERSION` must equal the `sw.js` `CACHE` suffix; `tests/test-engine.js` fails if they differ. The version travels in the URL hash rather than a query string so the service worker's cache key stays `feedback.html`.

`feedback.html` is a standalone plain page (no React, no build), styled to match and honouring the same theme preference. It POSTs JSON `{type, description, steps, email, version, website}` to the endpoint. `website` is a decoy field hidden from people: bots that fill it get a fake success and nothing is filed. The Worker (`tools/feedback/worker/`) does the following:
- accepts only origins listed in its `ALLOWED_ORIGINS` config
- validates types and lengths
- rate-limits to 5 submissions per hour per IP and 20 issues per UK day, with counters in Cloudflare KV; IPs are stored only as hashes and feedback text is never stored
- creates the issue (labelled `needs-triage`) with a fine-grained token held only in its own secrets

`.github/workflows/deploy-feedback-worker.yml` deploys it whenever its code changes on `main`. `tests/test-feedback-worker.mjs` tests it without dependencies.

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
- ISA/LISA caps: within-limit contributions are unchanged; the LISA is limited to £4,000/yr; over £20,000 combined, the excess comes off S&S ISA first then Cash ISA; the bonus applies to the capped LISA figure only; LISA contributions stop at age 50; per-box input maximum equals the remaining shared allowance
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
- `formatNumber()` / `parseNumberInput()` (number boxes): thousands grouping, decimals and negatives preserved; pasted `£1,200` and `6%` parse; values clamp to min/max; blank or non-numeric input returns the previous value; format then parse round-trips
- Manual (no DOM in the harness): every slider and number box has an accessible name, slider `aria-valuetext` includes unit; tooltips open with Enter and close with Esc; a `pagehide` inside the 600ms debounce still writes the latest edit; with `localStorage.setItem` throwing, the header shows the not-saved notice and never "Saved"
- The extra savings draw equals the tax when spending equals the gross pension draw
- Changing the withdrawal rate changes the tax
- `lifetimeTaxTotals` today's-money figure equals the sum of each year's deflated tax (not the nominal total deflated once)
- DB pension is added to its owner's taxable income alongside drawdown and State Pension, sharing that person's own allowance and bands (basic-rate and higher-rate cases), and is never attributed to the other person in joint mode
- DB pension starts in the year its owner reaches the start age and is uprated from today by the household inflation rate, matching State Pension year for year
- State Pension and DB pension are pooled: they fund spending before the savings tiers, swapping amounts between them changes nothing, and the 4%-rule drawdown is unaffected by DB income
- A person with no DB fields at all (a pre-025 save) projects identically to one with a £0 DB pension
- `dbPensionGapYears` is non-zero only when a non-zero DB pension starts strictly after retirement
- `computeTaxNotes` reports each fact in its first year, uses strict ">" boundaries (income exactly at a threshold produces no note), only fires the taper note strictly inside the taper range, attributes notes to the right person, and ignores rows after the plan horizon

- `APP_VERSION` in `index.html` equals the `sw.js` `CACHE` suffix, so feedback reports the build actually running (intent 026)
- The feedback Worker (`tests/test-feedback-worker.mjs`, 12 checks):
  - a valid submission files one `needs-triage` issue, with `@mentions` and `#refs` neutralised
  - wrong origin, invalid or oversized input, and a filled decoy field file nothing
  - the 6th submission in an hour from one IP, and the 21st of the day overall, are refused
  - KV holds only hashed IPs and counts
  - a GitHub failure returns 502

The built PWA was additionally rendered in a headless browser to confirm it boots, calculates, toggles into couple mode and persists state. For feedback (§3.12), a headless check confirmed:
- with the endpoint empty, neither entry point renders and `feedback.html` says feedback isn't available
- with it set, the footer and Data-menu links open `feedback.html#v=v16` in the same tab
- the form requires a type and a description
- a send posts exactly the typed fields plus the version, then shows the thanks message
- a failed send shows the error and keeps the text
- all at desktop and phone widths, in light and dark mode, with no horizontal scroll

**034 batch (intents 035–056)** — `tests/test-engine.js` (20 new checks, 74 in total):
- Mortgage: `mortgageBalance` is payment × months at 0% and the annuity present value otherwise; a rate changes only the balance, never `targetExpenses` or the payoff year
- Take-home pay counts exactly in years when someone has retired and that person hasn't, inflation-uprated; it reduces the savings draw one-for-one and isn't taxed; it has no effect in individual mode
- `spendingPhaseFactor` adds overlapping phases and floors at zero; phases scale annual expenses only; one-offs land in their year, inflated, and are ignored before the first retirement
- Downsizing release = sale − costs − new home − mortgage owed, lands in Person 1's other savings, stops the mortgage and resets the home value; a move that wouldn't cover itself is skipped
- `dbIndexFactor` for inflation, none, fixed, capped CPI (both sides of the cap) and RPI (inside and beyond the wedge years); extra schemes add to their owner's DB income; `planForMode` strips them in Simple mode and is the identity in Advanced; a default-indexation scheme projects byte-for-byte as before 053
- All-zero `returnShocks` reproduce the deterministic projection exactly; growth shocks move only growth accounts and cash shocks only cash-like ones; `runMonteCarlo` is deterministic for a seed, keeps p10 ≤ p50 ≤ p90, and with zero volatility matches the fixed-rate verdict
- `livingStandardLevel` boundaries; `householdAtRetirement` uses the nominal State Pension, counts savings at the withdrawal rate, and its components add up; `planSummary`'s today's-money income is the household figure deflated
- `applyWhatIf` with no changes is the identity and clamps retirement to 50–75; `sensitivityAnalysis` returns nine rows sorted by size; `planToEngineArgs` fills defaults and honours `hasPartner`

`tests/test-mcp-worker.mjs` (10 checks): the generated engine copy is current; initialize negotiates the protocol version; notifications get 202; the five tools list with read-only hints; each tool answers with the disclaimer and never echoes names; bad input is a tool error and unknown tools/methods are JSON-RPC errors; batches, parse errors, GET 405, CORS and `/health`.

Headless (Playwright, desktop and phone widths, light and dark): chart hover tooltips return (035); no console errors; no horizontal scroll; What if and What matters most open and compute; Share produces anonymised Markdown; Advanced inputs and tools render and calculate; Simple mode reports the right number of switched-off settings; the report opens, calls print, and print media hides `#root`; against a mocked Supabase, the magic-link request carries the unticked consent, a token return unlocks Advanced and strips the hash, and the consent toggle PATCHes only consent columns; crawler-visible static content is present in the served HTML and gone after render.

**Life expectancy scale (intent 029):**
- the slider runs 75–110; new and reset plans start at the `UK_REFERENCE` default (81)
- with retirement age 74 the slider minimum is 75; raising retirement age to 75 lifts a life expectancy of 75 to 76
- a life expectancy of 110 gives a projection and charts running to that year; 100 or less is unchanged (baseline fixture)
- a saved plan with life expectancy 95 keeps 95

### 5.5 PWA packaging

Everything is inlined into one `index.html` (~1.07 MB, ~284 KB zipped after the 034 batch):

- JSX **precompiled** with Babel — no in-browser transpiler, so startup is fast on a phone
- React, ReactDOM, `react-is` and Recharts embedded as **UMD builds**
- Tailwind run through the CLI against the source to emit only the ~34 KB of CSS actually used
- Lucide icons replaced with **inline SVG components**, removing the dependency entirely
- Service worker for offline use; web manifest and SVG icon for home-screen install. On install it precaches every asset with `cache: 'reload'`, bypassing the browser's HTTP cache (GitHub Pages allows 10 minutes), so a new cache version never stores a file left over from the previous one (intent 027). After that, requests are served stale-while-revalidate: cached copy first, refreshed in the background
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

The MCP server (§3.18) is a second Cloudflare Worker, deployed by `.github/workflows/deploy-mcp-worker.yml` with the same two Cloudflare secrets; it needs no GitHub token or KV. Accounts (§3.16) use a Supabase project the owner creates (`tools/accounts/README.md`); the app talks to it directly from the browser, so GitHub Pages remains the only web host.

The feedback Worker (§3.12) is hosted separately, on Cloudflare. It redeploys automatically when anything under `tools/feedback/worker/` changes on `main`, via `.github/workflows/deploy-feedback-worker.yml`. That workflow needs three repo secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `FEEDBACK_GITHUB_TOKEN`), described in `tools/feedback/README.md`. The fine-grained `FEEDBACK_GITHUB_TOKEN` expires yearly and must be renewed.

---

## 7. Known limitations

> These are deliberate simplifications, not defects. Worth knowing before relying on the output.

1. **Income tax is estimated, not exhaustive.** Modelled: rest-of-UK income tax on pension drawdown, State Pension and DB pension, per person, with the £100k taper, thresholds frozen to 2030/31 and then inflation-uprated. Not modelled: (a) Scottish rates (roadmap #27; [GOV.UK: Scottish Income Tax](https://www.gov.uk/scottish-income-tax)); (b) tax on non-ISA savings interest ([Personal Savings Allowance](https://www.gov.uk/apply-tax-free-interest-on-savings)); (c) [Marriage Allowance](https://www.gov.uk/marriage-allowance), [Blind Person's Allowance](https://www.gov.uk/blind-persons-allowance) and other reliefs; (d) the announced 2027/28 easement for pensioners whose only income is the State Pension ([House of Commons Library, "Taxation of state pension"](https://commonslibrary.parliament.uk/research-briefings/cbp-10250/); see also [GOV.UK: how your State Pension is taxed](https://www.gov.uk/guidance/how-your-state-pension-is-taxed)); (e) threshold paths other than freeze-then-inflation ([GOV.UK: thresholds maintained until 5 April 2031](https://www.gov.uk/government/publications/maintaining-income-tax-and-equivalent-national-insurance-contributions-thresholds-until-5-april-2031)); (f) no gross-up, so drawdown stays at the 4%-rule gross amount and tax is covered from savings ([GOV.UK: Income Tax rates](https://www.gov.uk/income-tax-rates)).
2. **Salary is only modelled for a still-working partner, and simply.** In couple mode, take-home pay (§4.5) offsets household spending while one partner works after the other retires. It is entered net, rises only with inflation (no real pay growth), and any surplus isn't saved. Salary before the first retirement isn't needed (spending starts then), and phased retirement isn't modelled.
3. **Mortgage is a repayment mortgage with fixed payments.** The balance is the present value of the remaining payments at one fixed rate (§4.4), stepped yearly. Interest-only, rate changes, overpayments and early-repayment charges aren't modelled.
4. **Growth is a fixed annual rate in the main projection** with no sequence-of-returns risk. A poor first decade of retirement is far more damaging than the same average return implies. Advanced mode's Monte Carlo (§4.9) tests this with illustrative, independent, normally distributed yearly returns — no fat tails, no correlation between years, the same shock for both people.
5. **One inflation rate** applies to all spending categories; healthcare in particular tends to inflate faster. The same single rate also uprates State Pension and any DB pension (see #8).
6. **Living Standard is a first-year snapshot.** It compares the first year everyone is retired, in today's money, with the bands (§4.8). A State Pension that starts a few years later isn't in that year's figure, and later years aren't compared.
7. **ISA/LISA caps are fixed and approximate.** The £20,000 and £4,000 limits are enforced (§4.1) but held flat in nominal terms, not uprated. LISA contributions stop at age 50 using whole years of age (last contributing year is 49), slightly earlier than the real 50th-birthday rule, and allowance freed by that stop isn't reassigned to other ISAs. The opening-age-40 rule is not modelled.
8. **DB pensions are simplified.** Simple mode supports one DB pension per person, uprated by the household inflation rate (#5). Advanced mode adds more schemes and per-scheme indexation (capped CPI, RPI, fixed, none; §4.3), applied from today rather than as separate deferred revaluation and payment increases; RPI is an approximation (inflation + 1 point until 2030). Not modelled: commutation / a tax-free lump sum from the DB scheme, interaction with the Annual Allowance or Lump Sum Allowance, and survivor's pensions.
9. **Device-local storage** — phone and laptop keep separate plans, and clearing browser data erases the saved plan. Manual export/import (§3.7) can move a plan between devices or back it up, but there's no automatic sync.
10. **No LISA first-home exception.** Real LISAs allow penalty-free access before 60 for a first home purchase; this tool has no house-purchase concept to hang that on, so the age-60 restriction is unconditional.
11. **Other savings accounts are capped at 3 per person in Simple mode** (unlimited in Advanced; intent 054). A plan that already has more keeps them all, and they all count, in either mode; the cap only stops adding more.
12. **Feedback relies on an outside service and has daily limits.** Sending feedback (§3.12) goes through a Cloudflare Worker to a private GitHub repo. It needs a connection, and there's no offline check before sending. At most 5 submissions per hour per IP and 20 issues per day are filed; anything over that is refused with the "didn't send" message, not queued. Nobody who leaves an email is contacted automatically yet.
13. **Advanced access is a client-side gate.** With accounts on and `advancedRequiresAccount` true, the app checks the signed-in profile, but Advanced code still ships in the public page. Keeping paid logic out of the free bundle is planned with payments (roadmap #25).
14. **Spending phases, one-off costs and downsizing follow Person 1's age**, and one-offs only count from the first retirement. Downsizing assumes a single move; the new home's costs and stamp duty are one combined percentage; the released cash grows at Person 1's Cash ISA rate.
15. **The pension vs ISA vs cash comparison** uses basic-rate relief at source only (no higher-rate reclaim, salary sacrifice, National Insurance savings or employer matching) and adds the extra amount for the whole time until that person retires.
16. **The MCP server runs within Cloudflare's free CPU limit** (10 ms per request). A large couple plan's `what_matters_most` call (about 8 ms) could occasionally exceed it; the Workers Paid plan removes the risk (`tools/mcp/README.md`).
