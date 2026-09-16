# 002 — Extra savings accounts

## Status

Proposed.

## Problem

The app currently models exactly one savings figure per person: a single
"ISA savings" balance/contribution/growth-rate, which `docs/TOOL_DOCUMENTATION.md`
§4 already documents as "Cash and Stocks & Shares combined" — i.e. real-world
distinctions between account types are collapsed into one number before they
ever reach the tool.

That doesn't match how people actually hold retirement savings. Many people
split money across a Cash ISA, a Stocks & Shares ISA, a Lifetime ISA, and
non-ISA cash savings (easy-access accounts, Premium Bonds, a GIA) — each with
a different growth profile, different access rules, and (for the ISA-type
accounts) a shared annual allowance. Forcing all of that into one blended
"ISA" number means the projection can't reflect a LISA's 25% government
bonus or its age-60 access restriction, can't show that cash sitting outside
an ISA grows more slowly than invested savings, and can't warn a user who's
inadvertently modelled contributions above the real £20,000/£4,000 ISA/LISA
allowances.

## Outcome

Per person, the single ISA field is replaced/extended with:

1. **Named ISA-type sub-accounts** — Cash ISA, Stocks & Shares ISA, and
   Lifetime ISA (LISA), each with its own balance, monthly contribution, and
   growth-rate assumption (Poor/Average/Aggressive or custom %, as the
   existing ISA field already offers). Their sum is what everywhere else in
   the app (breakdown cards, wealth chart, income chart, depletion check)
   already calls "ISA".
2. **Free-form "other savings" accounts** — an add/remove list where a
   person can create any number of arbitrarily-named non-ISA accounts (e.g.
   "Premium Bonds", "General savings"), each with its own balance, monthly
   contribution, and growth rate.
3. **LISA bonus modelling** — contributions to the LISA sub-account receive
   an automatic 25% government top-up in the projection (mirroring how the
   pension lump sum is already special-cased), on top of its own growth
   rate.
4. **LISA access-age restriction** — the LISA balance is excluded from
   funding any withdrawal/expense gap before the person turns 60. It still
   accrues contributions, bonus and growth before that age; it simply isn't
   drawable until 60.
5. **Combined ISA allowance enforcement** — Cash ISA + Stocks & Shares ISA +
   LISA contributions are summed per person per tax year and capped/warned
   at £20,000 (the existing reference figure in §4.7), with the LISA
   contribution additionally capped/warned at £4,000 within that total. Free-form
   "other savings" accounts are not ISAs and are not subject to this cap.
6. **Fixed drawdown priority** — during decumulation, the gap left after
   the pension lump sum is filled from: (a) free-form "other savings"
   accounts, then (b) Cash ISA, then (c) Stocks & Shares ISA, then (d) LISA
   (subject to the age-60 restriction above) — replacing today's single
   proportional ISA draw. This order must be stated visibly in the UI (e.g.
   in the results/breakdown view or an inline explainer), not left implicit,
   since it changes which of a person's accounts empties first.
7. Every account above remains **per-person only**, exactly like the
   existing ISA field — there is no joint/shared pot. In joint mode, a
   couple's shared savings still need to be attributed to one partner or the
   other.

## Non-goals

- **No joint/shared account.** Every account, ISA-type or free-form, belongs
  to one person. This intent does not add a "joint savings" concept
  alongside the existing joint mortgage/expenses treatment.
- **No modelling of the LISA first-home exception.** Real LISAs allow
  penalty-free access before 60 for a first home purchase. This app has no
  house-purchase event or concept to hang that on, so the age-60 restriction
  here is unconditional — money isn't drawable before 60, full stop.
- **No changes to income tax treatment.** Retirement income tax is already
  out of scope app-wide per `CLAUDE.md`; this intent doesn't change that.
  ISA-type withdrawals (including LISA) remain treated as tax-free, as ISA
  withdrawals already are.
- **No redesign of the input UI beyond what these fields need.** How the
  (now longer) list of per-person sliders is laid out — grouped, collapsed,
  tabbed — is an implementation decision for the spec/plan stage, not
  settled here.

## Constraints

- **Follows the existing per-account-field pattern, not a new paradigm.**
  Cash ISA / S&S ISA / LISA reuse the same balance + monthly contribution +
  growth-rate shape the current ISA field already uses; free-form accounts
  need the same shape plus a name and add/remove UI, likely as an array on
  each person's state rather than fixed fields.
- **`SliderWithInput`, `PersonInputs` and friends stay module-level and
  memoised** (`CLAUDE.md`, tool docs §5.3). Adding a variable-length list of
  free-form accounts to `PersonInputs` must not reintroduce inline
  subcomponent definitions or unstable callbacks — the sliders were
  unusable the last time that happened.
- **`projectJoint()` changes are high-stakes.** LISA bonus application, the
  age-60 access gate, the new fixed drawdown order, and the combined
  allowance check are all engine logic, covered by the verification
  checklist in tool docs §5.4. `test-engine.js` (from intent 001) must gain
  cases for each of these before this ships.
- **`localStorage` migration.** Existing users' saved state has one ISA
  balance/contribution/rate per person, not the new sub-account shape.
  Loading old saved data must not crash or silently drop the user's existing
  ISA figures — it needs an explicit migration path (e.g. treat old ISA
  balance as the opening Stocks & Shares ISA balance) rather than resetting
  to zero.
- **Update `docs/TOOL_DOCUMENTATION.md`** (input definitions §4, model §6,
  reference figures §4.7, limitations §7) to describe the new account types,
  the LISA bonus/access rules, the drawdown order, and the allowance
  enforcement — per `CLAUDE.md`, that doc is the spec of record for the
  calculation logic.
- **Single-file PWA constraint holds.** All of the above still ships inside
  `index.html`/`sw.js`, with the service worker cache version bumped per the
  usual deploy convention.
