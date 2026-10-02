# 044 — Simple and Advanced modes

## Status

Roadmap #12 (originally #11). The gate mechanism for the paid tier.

## Decisions

- A **Simple | Advanced** switch in the header. Simple is today's app,
  unchanged. Advanced adds the extra inputs and tools from intents 042
  (full export), 046 to 053, and lifts the 054 cap. It's labelled "beta" for
  now.
- The mode is a device display preference (its own localStorage key, like
  the theme), not part of the plan, so it never goes through Export/Import.
- Advanced-only inputs are saved with the plan, but **only apply in Advanced
  mode**. In Simple mode the projection ignores them, and a one-line note
  says Advanced settings are switched off. This is done in one place: a
  `planForMode()` helper strips Advanced fields before the engine sees the
  plan. The engine itself always honours whatever data it's given, which
  keeps it testable and lets the MCP server (055) use the full model.
- **Access.** `advancedAccess()` is open to everyone while
  `ADVANCED_REQUIRES_ACCOUNT` is false (the default, and the roadmap's
  "beta preview" stage). When it's true and accounts are set up (045),
  Advanced needs a signed-in account whose profile has `advanced_access`.
  Choosing Advanced without access opens the sign-in panel instead.
- This is a client-side gate. Real protection of paid logic (keeping it out
  of the free bundle) comes later with payments (#25), as the roadmap says.
