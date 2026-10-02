# 034 — Roadmap batch (autonomous build)

## Status

Umbrella for one release covering most of the Notion roadmap. Opened
2026-10-02.

## Why there was no grilling round

On 2026-10-02 the owner asked for every buildable roadmap item, free and
paid, in one go, with this instruction: "don't stop, make decisions
yourself, do not ask me to confirm anything". So this batch skips the usual
grilling checkpoint. Each child intent below records the decisions the agent
made in its place, with the reasoning, so the owner can review or reverse any
of them in the PR.

## Child intents

| Intent | Roadmap item | Tier |
|---|---|---|
| 035-chart-hover-tooltips | Bug found while building (not on the roadmap) | Free |
| 036-tailwind-regeneration | Tooling that the rest of the batch needs | — |
| 037-living-standard-todays-money | #5 PLSA forward-inflation | Free |
| 038-mortgage-interest | #9 Mortgage amortisation with interest | Free |
| 039-working-partner-pay | #8 Still-working partner's salary | Free |
| 040-what-if-sliders | #7 "What if?" sliders | Free |
| 041-what-matters-most | #6 Sensitivity / "what matters most" | Free |
| 042-share-with-ai | #36 "Share to your AI" export | Free basic, Advanced full |
| 043-ai-discoverability | #29 llms.txt and AI/agent discoverability | Free |
| 044-simple-advanced-modes | #12 Simple/Advanced mode split | Gate |
| 045-accounts | #13 Account system, #14 marketing consent | — |
| 046-scenarios | #15 Scenario save/compare | Advanced |
| 047-allocation-comparison | #16 Pension vs ISA vs cash comparison | Advanced |
| 048-state-pension-bridge | #17 Bridge to State Pension view | Advanced |
| 049-phased-spending | #18 Phased / one-off spending | Advanced |
| 050-report-export | #19 PDF / report export | Advanced |
| 051-monte-carlo | #20 Monte Carlo simulation | Advanced |
| 052-property-downsizing | #21 Property / downsizing module | Advanced |
| 053-multiple-db-pensions | #31 Multiple DB pensions, #32 per-scheme indexation | Advanced |
| 054-savings-account-cap | #22 Savings-account count cap | Gate |
| 055-mcp-server | #30 MCP server | Advanced (ungated for now) |
| 056-brand-identity | #33 Brand identity and visual design | Free |

## Not built, and why

- **#35 daily feedback triage routine.** Not code. It needs the private
  feedback repo attached to a Claude session, which was refused before. The
  agent tries again in this session; the outcome is reported in the PR.
- **#23 friends-and-family beta.** A milestone run by the owner. Everything
  it needs is built: set `ADVANCED_REQUIRES_ACCOUNT = true` in
  `account-config.js` and flag beta users in Supabase (see 045).
- **#24 hosting/domain.** A decision, not a build. Recommendation: stay on
  GitHub Pages. The account system (045) talks to Supabase directly from the
  browser, so no new backend host is needed. A domain is still the owner's
  purchase.
- **#25 payments, #26 policies, #27 paywall live.** Need the owner's Stripe
  or Paddle account, legal sign-off, and the beta result, in that order.
- **#28 marketing.** Anchored after #27.

## Shared decisions across the batch

- **One release.** Every child ships in one PR with one cache bump, so the
  per-item changes don't conflict with each other in `index.html`, `sw.js`,
  the docs and the changelogs.
- **Advanced inputs apply only in Advanced mode.** Advanced-only data stays
  in the saved plan, but the projection ignores it in Simple mode, and Simple
  mode says so. Whatever Simple mode shows is reproducible from what Simple
  mode lets you see.
- **Advanced is an open beta preview until accounts are switched on.** With
  no Supabase project configured, anyone can turn Advanced on. That matches
  the roadmap's "beta preview, not yet paid" stage.
- **Wording.** Everything new describes what happens under the assumptions.
  It never says what the user should do (#6's constraint, applied to the
  whole batch).
- **Engine changes are opt-in.** Every new engine input defaults to the old
  behaviour when absent, so the individual-mode regression baseline is not
  regenerated.
