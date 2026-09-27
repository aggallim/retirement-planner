# 028 — Grilling uses structured questions instead of a text block

## Status

Resolved via the `grilling` skill (on itself) in two rounds in a single
Claude Code session on 2026-09-27.

## Problem

The `grilling` skill currently prints each round as one long markdown
block — every question, its body and its recommendation run together in
prose (`❓ **Q1** - ...`, `➡️ ...`, `❓ **Q2** - ...`). The owner has to read
through the whole block to find each question, and can't click through
them individually.

Separately, the owner is often being grilled about something they didn't
originate themselves (an idea or request passed to them), so a question
that assumes shared context from "the plan" reads as opaque — it needs to
restate why it's being asked.

## Outcome

### Question format

Each frontier question becomes one `AskUserQuestion` question object
instead of a block of markdown:
- **Header:** a short (≤12 char) topic chip.
- **Question:** restates the relevant context in 1-2 sentences, then asks
  exactly one decision. A question that bundles more than one decision is
  split into separate questions instead.
- **Options:** 2-4, flexible — as many as the decision naturally needs,
  never padded to a fixed count. The recommended answer is always option
  1, with " (Recommended)" appended to its label, per the tool's own
  convention. Each option's `description` carries the trade-off reasoning
  that used to sit in the block's prose.
- **multiSelect:** `true` only for a genuinely "pick any that apply"
  decision; everything else is single-choice, including any decision that
  might have looked like a checklist but is really several yes/no
  questions.
- The tool's own "Other" choice covers free text and any answer that
  doesn't fit the offered options — no explicit stub option is needed for
  that.

### Batching within and across rounds

- `AskUserQuestion` caps a single call at 4 questions. When a round's
  frontier has more than 4, split it across multiple back-to-back calls —
  still the same round, no recap between those calls.
- Between rounds (once a round's full frontier is answered), post a short
  plain-text recap of what's now settled, before the next round's
  questions. This replaces scrolling back through the transcript to
  reconstruct the design tree, since the question cards don't show
  history themselves.

### What stays the same

- The design-tree/frontier mechanics: work in rounds, ask the whole
  frontier each round, recompute after each round's answers, dispatch a
  sub-agent for any fact the user shouldn't be asked. Unaffected by this
  change.
- The session still ends with the user confirming a shared understanding
  before the intent file gets written — that stays a plain chat exchange,
  not a structured question. (Considered making it a structured
  Confirm/Not-yet question too; rejected because the final go/no-go is
  itself open-ended — "not yet" needs the user's own words, not a pick
  from options.)
- `grill-me` is unaffected: it only delegates to `grilling`.

### Attribution

The skill file currently claims to be "Reproduced verbatim aside from
this attribution footer" from `mattpocock/skills`. This change is no
longer verbatim, so the footer is rewritten to say it's adapted from that
source, with a one-line note on what changed and why (native
`AskUserQuestion` cards instead of a markdown block, available in this
harness but not necessarily upstream's).

## Non-goals

- No change to `grill-me/SKILL.md` itself.
- No fallback text-block mode for a context where `AskUserQuestion` isn't
  available — both skills are only used inside Claude Code sessions where
  it is.
- No change to when grilling is invoked, or to the requirement lifecycle
  around it (`CLAUDE.md`, `CONTRIBUTING.md`).

## Docs and changelog obligations (per `CLAUDE.md`)

- No `docs/TOOL_DOCUMENTATION.md` change — it documents the app's
  calculation/product surface, not this workflow skill.
- `CHANGELOG.md`: one entry naming this intent (process-only, matching
  019/020/022/024's treatment).
- No `USER_CHANGELOG` entry — not user-facing (no `sw.js`/`index.html`
  change at all).

## Verification

- `.claude/skills/grilling/SKILL.md` describes the `AskUserQuestion`-based
  format, the multi-call-per-round batching rule, the inter-round recap,
  and the rewritten attribution footer.
- Read through once end-to-end to confirm it no longer references the old
  `❓ **Q1**` block format anywhere.
- `node tests/test-engine.js` still passes (no engine changes).
