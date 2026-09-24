# Feedback pipeline: how it works and how to set it up

How the app's "Send feedback" link becomes a triaged GitHub issue
(`intent/026-user-feedback.md`, including its 2026-09-24 addendum):

```
App "Send feedback" link ──► feedback.html (same site; app version in the URL hash)
                                  │ POST JSON (only what the user typed)
                                  ▼
                   Cloudflare Worker (worker/) ──► issue in private repo
                     origin check, decoy field,     aggallim/retirement-planner-feedback
                     length limits, 5/h per IP,     label: needs-triage
                     20/day; holds the GitHub token
                                  ▲
       Daily Claude Code routine ─┘ follows TRIAGE.md: labels, comment,
                                    needs-triage → triaged, one push digest
```

The app never sends plan data. `feedback.html` sends only what the user
types, and only when they press Send. The GitHub token lives only in the
Worker's secrets. It's never in the site or either repo, because anything
in a public static site is readable by anyone.

| File | What it is |
|---|---|
| `worker/src/index.js` | The Worker: validation, spam limits, issue creation. |
| `worker/wrangler.toml` | Worker config: `ALLOWED_ORIGINS`, repo, caps, KV binding. |
| `../../.github/workflows/deploy-feedback-worker.yml` | Deploys the Worker whenever its code changes on `main`. |
| `../../tests/test-feedback-worker.mjs` | Dependency-free Worker tests (run in CI). |
| `../../feedback.html`, `../../feedback-config.js` | The page, and the one place the Worker URL is set. |
| `TRIAGE.md` | Rules the daily triage routine follows. |

## One-time setup

Claude sessions can't set Actions secrets or reach Cloudflare (the
session's proxy blocks both), so the owner does steps 2–3 by hand. See the
intent's second 2026-09-24 addendum.

1. **Private feedback repo.** `aggallim/retirement-planner-feedback`,
   private, holding issues only. It has these labels (already created):
   `needs-triage`, `triaged`, `bug`, `idea`, `confusing`, `other`, `p1`,
   `p2`, `p3` and `spam`. Re-create them in its **Issues → Labels** page if
   the repo is ever rebuilt.
2. **Create the tokens.**

   | Secret | What it is |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → **"Edit Cloudflare Workers"** template. |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → Account ID. |
   | `FEEDBACK_GITHUB_TOKEN` | GitHub fine-grained token: only `retirement-planner-feedback`, **Issues: Read and write**, **1-year** expiry. |

3. **Add them as Actions secrets** in this repo: GitHub → Settings →
   Secrets and variables → Actions → New repository secret, one per row
   above, with exactly those names. Don't paste them anywhere else (not
   into a chat, not into a file in either repo).
4. **The first deploy** runs when the PR that adds the Worker merges to
   `main` (or later from the Actions tab → "Deploy feedback Worker" → Run
   workflow). It:
   1. runs the Worker tests
   2. finds or creates the KV namespace `retirement-planner-feedback-counters`
   3. deploys the Worker with wrangler
   4. sets the Worker's `GITHUB_TOKEN` secret from `FEEDBACK_GITHUB_TOKEN`
   5. prints the Worker URL (in the run's summary) and checks its `/health`
5. **Claude sets `window.FEEDBACK_ENDPOINT`** in `feedback-config.js` to
   that URL, in a follow-up PR that also bumps the `sw.js` cache version.
   This makes the links appear in the app.
6. **Claude creates the daily triage routine** (a Claude Code scheduled
   trigger on the owner's subscription; no API key):
   - Schedule: daily at 07:00 UK time. Routines use UTC cron, so
     `0 6 * * *` is 07:00 in summer (BST) and 06:00 in winter (GMT).
   - Model: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`).
   - A fresh session each run, in an environment that includes both repos.
   - Prompt:

     > Follow the instructions in `tools/feedback/TRIAGE.md` in the
     > `aggallim/retirement-planner` repository (on `main`) to triage new
     > issues in `aggallim/retirement-planner-feedback`.
7. **End-to-end test** (see below).

## End-to-end test

1. On the live site, go to ⚙ Data → **Send feedback**. Check that the page
   opens with the privacy line.
2. Send a test (Type: Other; description "Pipeline test"; with an email).
3. An issue should appear in the feedback repo within seconds. Check that
   it's labelled `needs-triage`, with the right **App version** and the
   email under "Email for updates".
4. Fire the routine by hand. The issue should get a type label, a priority
   label and a triage comment that says an email is attached, without
   showing the address. `needs-triage` should be replaced by `triaged`,
   and one push notification should arrive. Run the routine again: it
   should do nothing and send nothing.

## Changing things later

- **Adding a domain for the app:** add it to `ALLOWED_ORIGINS` in
  `worker/wrangler.toml`, comma-separated. Merging that to `main`
  redeploys the Worker.
- **Moving the Worker onto a domain:** change `window.FEEDBACK_ENDPOINT`
  in `feedback-config.js` and bump the `sw.js` cache version.
- **Limits:** `DAILY_ISSUE_CAP` and `HOURLY_PER_IP` in `wrangler.toml`.
  KV is eventually consistent, so a burst can slightly exceed a cap.
- **Spam getting through:** add Cloudflare Turnstile (deferred for now; see
  the intent).

## Renewing the GitHub token (yearly)

About a week before `FEEDBACK_GITHUB_TOKEN` expires:
1. Regenerate it in GitHub (same settings, new 1-year expiry).
2. Update the `FEEDBACK_GITHUB_TOKEN` Actions secret in this repo.
3. Actions tab → "Deploy feedback Worker" → Run workflow. That copies the
   new token into the Worker.

If the token expires first, sends fail with "Sorry, that didn't send"
until it's renewed. Nothing is filed in the meantime.

## Troubleshooting

- **The "didn't send" message for everyone:** check the latest "Deploy
  feedback Worker" run. If it's fine, check the Worker's logs in the
  Cloudflare dashboard. A `GitHub issue create failed: 401` means the
  token is expired or wrong; `404` means the token can't see the repo.
- **403 from the Worker:** the page's origin isn't in `ALLOWED_ORIGINS`.
- **429:** a limit was reached (5 an hour from one IP, or 20 a day).
