# 059 — Privacy and UX review follow-ups (autonomous batch)

## Status

Umbrella for one release that delivers the two open reviews in Notion:

- "Privacy & Compliance Review (Oct 2026)", findings F1–F10, reviewed
  against v24.
- "UI/UX Form & Data-Entry Review (Sept 2026)": the backlog items still open
  after v20 (intents 030–032 shipped its P0s).

Opened 2026-10-04.

## Why there was no grilling round

On 2026-10-04 the owner asked: "Deliver the items on the UX and privacy
reviews in Notion. Do everything you can, don't stop to ask me, make the
decisions yourself on how to deliver the changes. Keep working on it till
it's complete." So this batch skips the grilling checkpoint, as 034 did.
Each child intent records the decisions made in its place, with reasons,
so the owner can review or reverse any of them on the PR.

## Child intents

| Intent | Covers |
|---|---|
| 060-privacy-compliance | Privacy review F1–F10 |
| 061-ux-review-followups | UX review P1–P3 backlog, minus what 030–032 shipped |

## Shared decisions

- **One release, v25.** One `sw.js` cache and `APP_VERSION` bump, one
  `CHANGELOG.md` entry per child intent, `USER_CHANGELOG` entries for the
  user-facing parts.
- **Live systems.** This session can reach the Supabase project through
  its MCP connector, so the database side of the privacy fixes (invite
  gate, consent, account deletion, unsubscribe, retention) is applied to
  the live project as well as written to `tools/accounts/`. Cloudflare,
  GitHub settings, the ICO and a domain purchase are not reachable from
  here; those steps are listed as owner actions in 060 and on the PR.
