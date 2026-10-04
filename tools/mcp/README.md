# UK Retirement Planner MCP server

Intent 055 (roadmap #30). Lets an AI assistant you already use (Claude,
ChatGPT and others that support the Model Context Protocol) run the planner's
own calculations on your plan, so it can answer questions with real figures.

- **Endpoint:** `https://retirement-planner-mcp.aggallim.workers.dev/mcp`
  (the deploy workflow prints the exact URL)
- **Transport:** Streamable HTTP with plain JSON responses. Stateless: no
  sessions, no login.
- **Privacy:** the server keeps no plan data. Plans are calculated in memory and
  discarded. Cloudflare, which runs it, still sees ordinary request metadata
  (such as network addresses) at its edge. There's no storage and no logging of plan data. Your assistant
  sends the plan only when it calls a tool.
- **Not financial advice.** Every result is an illustrative projection under
  the plan's own assumptions.

## Tools

| Tool | What it does |
|---|---|
| `project_retirement_plan` | Runs the full projection: verdict, pot at retirement, first-year income after tax (also in today's money), Living Standard, money left at the end, lifetime tax. `include_yearly` adds a year-by-year table. |
| `what_if` | The plan as it is and with hypothetical changes (retirement age, spending, growth, extra pension, life expectancy, inflation), side by side. |
| `what_matters_most` | Nine one-at-a-time changes ranked by their effect on money left at the end. |
| `get_methodology` | How the planner calculates, its limits and sources. |
| `get_uk_reference_figures` | Every dated UK figure used, with its source. |

Plans use the app's **Export** format. The easiest way to get one into your
assistant is the app's ⚙ Data → **Share with your AI assistant**: the text it
copies ends with a JSON block (names removed) that the assistant can pass
straight to these tools.

## Connecting your assistant

- **Claude (claude.ai, desktop and mobile):** Settings → Connectors → Add
  custom connector → paste the endpoint URL. No authentication.
- **Claude Code:**
  `claude mcp add --transport http uk-retirement-planner https://retirement-planner-mcp.aggallim.workers.dev/mcp`
- **ChatGPT:** Settings → Connectors (developer mode) → Create → paste the
  endpoint URL, authentication "None".
- **Other clients** that only speak stdio can use a bridge such as
  `npx mcp-remote https://retirement-planner-mcp.aggallim.workers.dev/mcp`.

Then ask, for example: "Use the UK Retirement Planner tools on this plan.
What does my projection depend on most?"

## How it's built

- `worker/src/index.js`: the JSON-RPC handler (initialize, ping,
  tools/list, tools/call).
- `worker/src/engine.generated.js`: **generated**, the app's own engine (the
  `ENGINE-EXTRACT` spans of `index.html`) plus `llms-full.txt` as the
  methodology. After any engine change, run from the repo root:

  ```sh
  node tools/mcp/build-engine.mjs
  ```

  `tests/test-mcp-worker.mjs` (run in CI) fails if this copy is out of date.
- Deployed by `.github/workflows/deploy-mcp-worker.yml` on merges to `main`
  that touch `tools/mcp/`, using the same `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` secrets as the feedback Worker. No other setup.

## Limits

- **CPU.** A projection takes about 1.5 ms of CPU, and `what_matters_most`
  (ten projections) about 8 ms. The Workers free plan allows 10 ms per
  request, so a large couple plan could occasionally hit that on
  `what_matters_most`. If that happens (Cloudflare error 1102), the Workers
  Paid plan ($5/month) raises the limit to 30 seconds.
- **No gate yet.** The roadmap puts this in Advanced (paid). It's open while
  accounts and billing aren't live; once they are, it can require an account
  token.
