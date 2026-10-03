# 055 — MCP server

## Status

Roadmap #30. Advanced in the roadmap; ungated for now because accounts
aren't live (045). The gate can be added once billing exists.

## Decisions

- A stateless MCP server on Cloudflare Workers (`tools/mcp/worker/`), using
  MCP's Streamable HTTP transport with JSON responses only: JSON-RPC 2.0 by
  POST to `/mcp`, no sessions, no storage. Free tier is enough.
- Tools:
  - `project_retirement_plan(plan)`: takes a plan in the app's Export
    format (or the JSON block from 042) and returns the verdict, headline
    figures, lifetime tax and a yearly summary
  - `what_if(plan, changes)`: the same changes as the 040 sliders
  - `get_methodology()`: how the model works and its limits
  - `get_uk_reference_figures()`: every `UK_REFERENCE` figure with its source
- **The engine is the app's engine.** `tools/mcp/build-engine.mjs` copies the
  `ENGINE-EXTRACT` spans from `index.html` into
  `src/engine.generated.js`. A test fails if the copy is out of date.
- Tool descriptions say every figure is an illustrative projection under the
  supplied assumptions, not advice. Advice-like output happens in the user's
  own assistant, as the roadmap intends.
- The Worker keeps nothing: no logs of plan data, no KV.
- Deploy: `.github/workflows/deploy-mcp-worker.yml` on `main`, reusing the
  existing Cloudflare secrets.
- The app links to setup instructions from the Share with AI view (042).
