# 026 — User feedback pipeline (form → private GitHub issues → daily Claude triage)

## Status

Resolved via the `grilling` skill in three rounds (Q1–Q16) in a single
Claude Code session on 2026-09-24. Intent only. **Do not start building
until the owner tells you to.** Decisions below are final unless a dated
addendum changes them.

## Problem

Users who only have the live app or site have no way to report bugs,
confusing behaviour, or ideas. Most of them are non-technical and have no
GitHub account. The owner wants feedback to land somewhere Claude can
triage automatically, so that when they later ask for a fix or feature to
be built, the report is already sorted.

Constraints this has to respect:

- The app has no backend. `CLAUDE.md` says "Data never leaves the device",
  and intent 017 made privacy a user-facing selling point.
- The app repo (`aggallim/retirement-planner`) is **public**. Any issue
  opened there is world-readable. Users may type real pension balances,
  ages or health details into a feedback box.
- The owner wants triage to run on their **Claude subscription**, not on
  a pay-per-use API key.

## Outcome

### 1. In-app entry points (user-facing)

- A **"Send feedback"** item in the ⚙ Data menu, next to "What's new".
  Under it, the line: *"Opens a short Google form. Your plan figures
  aren't sent. Only what you type in the form."*
- A small **"Send feedback"** link in the footer, with no extra wording.
- Both open the Google Form in a **new tab**. The app version (the `sw.js`
  cache value) is pre-filled into a hidden form field through the form's
  pre-fill URL.
- **No offline handling.** Always show the link and assume the user is
  connected. There is no "needs internet" message.
- The app **never sends plan data automatically**. The form only ever
  contains what the user types into it.
- The form URL lives in one constant, `FEEDBACK_FORM_URL`, in
  `index.html`. While it's empty, both entry points stay hidden, so code
  can merge before the form exists without showing a broken link.
- No first-use prompt or popup asking for feedback. That was rejected as
  intrusive.

### 2. Google Form

Four questions plus one hidden field. No sign-in is required.

1. Type: Bug / Idea / Something confusing / Other (required)
2. What happened, or what would you like? (required, free text)
3. Steps or example figures (optional). Helper text: "only share what
   you're comfortable with".
4. Email if you'd like a reply (optional)
5. Hidden: app version, pre-filled from the link

### 3. Form → GitHub issue (Google Apps Script)

- An Apps Script `onFormSubmit` trigger opens an issue in a **new private
  repo, `aggallim/retirement-planner-feedback`**. That repo only holds
  issues. It keeps personal details out of the public app repo.
- The issue gets the label **`needs-triage`**. The title is the type plus
  the first part of the description. The body has the type, description,
  steps/figures and app version.
- **The email address is never put in the issue.** It stays only in the
  form's response sheet.
- The script creates at most **20 issues a day** (spam cap). Submissions
  over the cap stay in the response sheet and aren't posted.
- It authenticates with a **fine-grained GitHub token** that can only
  read and write issues on the feedback repo, with a **1-year expiry**.
  The token is stored in the script's properties, never in the app, the
  site or either repo.
- A copy of the script, with no secrets in it, is kept at
  `tools/feedback/` in this repo, alongside a `README.md` setup guide.
  The guide covers creating the private repo, the form (including how to
  find the hidden field's pre-fill ID), the token, pasting and triggering
  the script, and renewing the token. The pipeline can be rebuilt from
  that alone.

### 4. Daily triage (Claude Code routine)

- A **scheduled Claude Code routine** on the owner's subscription with
  no API key. It runs **once a day at 07:00 UK time** on **Claude Haiku
  4.5** (the cheapest current model), and each run starts a **fresh
  session**.
- The routine's prompt only says to follow **`tools/feedback/TRIAGE.md`**
  in this repo. The triage rules therefore change through normal PRs and
  keep a history.
- For each open issue labelled `needs-triage` in the feedback repo, it:
  - adds a type label: `bug` / `idea` / `confusing` / `other`
  - adds a priority label: `p1` (wrong figures or a broken app), `p2`,
    or `p3`
  - checks open issues for duplicates, and closes a duplicate with a link
    to the original
  - closes obvious junk with the label `spam`
  - posts a short triage comment: the report restated in plain terms, the
    likely part of the app affected, and a suggested next step (e.g.
    "candidate for intent: …")
  - replaces `needs-triage` with **`triaged`**, so no issue is handled
    twice
- At the end of each run it sends **one push-notification digest** (e.g.
  "3 new: 1 p1 bug, 2 ideas"). A run with no new issues is silent.
- **Triage only.** No reading of the app code, no running tests to
  reproduce, no branches, intents or PRs. Building a fix or feature is
  always started by the owner, separately, later.

### 5. Replies to users

No automatic replies of any kind. "What's new" is how users find out what
changed. The owner can reply by hand using the email addresses in the
response sheet.

### 6. Rollout order

1. Build everything on this branch: the app entry points, hidden while
   `FEEDBACK_FORM_URL` is empty; `tools/feedback/` (script, README,
   TRIAGE.md); and docs and changelogs.
2. The owner follows `tools/feedback/README.md`: creates the private
   repo, the form, the token, and the script plus its trigger. They send
   back the form's pre-fill link.
3. A follow-up commit on this PR fills in `FEEDBACK_FORM_URL` and the
   hidden field ID.
4. Claude adds the feedback repo to the routine's environment, creates
   the routine, and makes **one real test submission** that goes through
   the whole pipeline (form → issue → triage comment → digest) before the
   PR is marked ready for review.

### Division of work

- **Owner:** creates the private repo, the Google Form, the fine-grained
  token, and the Apps Script project and trigger.
- **Claude:** writes the app changes, the Apps Script source, the setup
  README and TRIAGE.md, docs and changelogs; creates the routine; runs
  the test.

## Docs and changelog obligations (per `CLAUDE.md`)

- `docs/TOOL_DOCUMENTATION.md`: document the feedback entry points in the
  user guide (§3), and add a sentence to the privacy messaging saying the
  feedback form is hosted by Google and receives only what the user types.
- `CHANGELOG.md`: one entry naming this intent.
- `USER_CHANGELOG` in `index.html`: **yes, this is user-facing** (new
  menu item and footer link). Version it with the `sw.js` cache value this
  PR bumps to (currently `v15`, so `v16` or whatever is current at the
  time).
- Bump the `sw.js` cache version.

## Non-goals

- A feedback form inside the app that posts to a third-party service
  (Formspree, Web3Forms) or to our own Worker/serverless function.
  Rejected because the app itself would be sending data, which conflicts
  with the privacy promise.
- Issues in the public app repo.
- Automatic replies to users, or drafting replies in Gmail.
- Triage that reads the app's code or runs tests to reproduce bugs.
- Automatic building of fixes or features, even for `p1` bugs.
- Offline detection or messaging for the feedback link.

## Verification

- With `FEEDBACK_FORM_URL` empty: neither entry point is rendered, and
  nothing else changes.
- With it set: the Data menu item and the footer link both open the form
  in a new tab, with the correct app version pre-filled. It works on
  mobile width, in light and dark mode.
- A test submission creates an issue in the private repo labelled
  `needs-triage`, with no email address in it.
- The 21st submission in a day doesn't create an issue.
- The next routine run labels the issue with a type and a priority,
  posts the triage comment, replaces `needs-triage` with `triaged`, and
  sends the digest. A run with nothing new is silent.
- `node tests/test-engine.js` still passes (there are no engine changes).

## Addendum — 2026-09-24: switch to an in-app form and a Cloudflare Worker

The owner decided they don't want to set up or maintain a Google Form by
hand. They asked for feedback to be collected on the site itself and
posted straight to GitHub issues, with Claude doing as much of the setup
as possible. This was resolved in grilling rounds 4–5 (Q17–Q27). It
**replaces** sections 1–3 and 6 above. Sections 4 (daily triage) and 5
(replies) still apply, amended as described below.

### Why a relay is needed

The site is a public static page, so any token written into it is public.
Anyone could pull it out, read every feedback issue and flood the repo.
GitHub's secret scanning would also revoke it automatically. The token
therefore lives in a small server-side relay, a **Cloudflare Worker**, and
never in the app.

Rejected: an in-app form posting to an email relay (Web3Forms), with the
routine reading the emails through the owner's Gmail connector. That
routine would read text written by strangers while having access to the
owner's whole mailbox (a prompt-injection risk), and issues would arrive up
to a day late.

### Pipeline

`feedback.html` (same site) → `POST` to the Worker → the Worker creates an
issue labelled `needs-triage` in the private
`aggallim/retirement-planner-feedback` repo → the daily triage routine
(unchanged).

### Decisions

- **Q18: form page.** A separate plain page, `feedback.html`, rather than
  a popup built into `index.html` (which is precompiled and easy to
  break). The ⚙ Data menu item and the footer link go to it and pass the
  app version in the link. It has a "← Back to the planner" link and is
  added to the service worker's offline cache. Fields are the same as
  before: type, description, optional steps or figures, optional email,
  and the app version (from the link, not shown to the user).
- **Q19 / Q26: email.** Optional. Label: *"Email (optional): if you'd like
  to hear when this is fixed"*. If given, it goes **in the private issue
  body**. `TRIAGE.md` must forbid the routine from copying an email
  address anywhere (comments, digest, other issues). The triage comment
  and the digest say *whether* an email is attached. For now, the owner
  replies by hand. **Future requirement (not this one):** once the owner
  has a domain, send an automatic email when an issue is closed as fixed
  or shipped. Sending mail automatically needs a verified sending domain,
  which doesn't exist yet. Rejected: routine-written Gmail drafts (same
  mailbox-access risk as above), and holding back email collection until
  a domain exists.
- **Q20: spam protection, enforced by the Worker.**
  - Accept submissions only from origins listed in `ALLOWED_ORIGINS`.
  - A hidden decoy field: submissions that fill it are silently dropped.
  - Length limits on every field.
  - At most **5 submissions per hour per IP**.
  - At most **20 issues per day** in total.

  Counters are kept in Cloudflare KV. Cloudflare Turnstile (a CAPTCHA) is
  deferred until spam actually gets through.
- **Q21: after pressing Send.**
  - Success: *"Thanks, your feedback has been sent."* The form clears and
    shows a link back to the planner.
  - Any failure (network, offline, limit reached, server error):
    *"Sorry, that didn't send. Please try again later."* The user's text
    stays in the form.

  There's still no up-front offline check (per the original Q8). The
  message only appears after a send actually fails.
- **Q22: privacy wording.** Under the Data menu item and at the top of
  `feedback.html`: *"Sends only what you type here to the developer. Your
  plan figures aren't included."* The privacy section of
  `docs/TOOL_DOCUMENTATION.md` is updated to match.
- **Q23 / Q27: addresses.** The Worker uses Cloudflare's free
  `*.workers.dev` address for now. The owner plans to put a domain in
  front of the app later, so:
  - `ALLOWED_ORIGINS` lives in the Worker's config, not its code. It
    starts as `https://aggallim.github.io` only.
  - `feedback.html` reads the Worker's URL from one constant.

  Adding a domain is then a one-line change to each.
- **Q17 / Q25: deployment and secrets.** A GitHub Actions workflow in this
  repo deploys the Worker (via wrangler) whenever its code changes on
  `main`. It also passes `FEEDBACK_GITHUB_TOKEN` into the Worker's secret
  settings. It's done this way because this Claude environment's network
  policy blocks `api.cloudflare.com`, while GitHub's runners don't.

  Nobody pastes a secret into a chat or into GitHub's settings screen. The
  owner puts these into the Claude environment's variables:
  - `CLOUDFLARE_API_TOKEN` ("Edit Cloudflare Workers" template)
  - `CLOUDFLARE_ACCOUNT_ID`
  - `FEEDBACK_GITHUB_TOKEN` (fine-grained; Issues read and write on the
    feedback repo only; 1-year expiry)
  - `SETUP_GITHUB_TOKEN` (fine-grained; Secrets read and write on
    `retirement-planner` only; 7-day expiry)

  Claude then copies the first three into the repo's Actions secrets
  through the GitHub API, using `SETUP_GITHUB_TOKEN`. That token expires
  on its own. The only recurring manual task is renewing
  `FEEDBACK_GITHUB_TOKEN` once a year.
- **Q24: cleaning up the Google Form work on this branch.**
  - Delete `tools/feedback/Code.gs`.
  - Rewrite `tools/feedback/README.md` for the Worker pipeline.
  - Add the Worker source under `tools/feedback/worker/`.
  - Replace `FEEDBACK_FORM_URL` / `FEEDBACK_VERSION_FIELD` in `index.html`
    with a link to `feedback.html`, shown only once the Worker URL is
    configured.
  - Update `TRIAGE.md` only for the email rule above.
  - Adjust the docs and changelog entries already written to match.

### Superseded

Sections 2 (Google Form), 3 (Apps Script), the Google-hosted wording in 1,
the "no automatic replies" framing in 5 (still true for now; see Q26), and
steps 2–3 of section 6 (owner builds the form; Claude fills in the form
URL). Verification now means: a real submission from `feedback.html`
creates a `needs-triage` issue (with the email if one was given);
submissions from a disallowed origin, with the decoy field filled, or over
either limit create no issue; and a triage run behaves as before, with no
email address copied into its output.

## Addendum — 2026-09-24: owner sets the Actions secrets by hand

The route agreed in Q17/Q25 (Claude copies the secrets into the repo's
Actions secrets with `SETUP_GITHUB_TOKEN`) doesn't work. This environment's
GitHub proxy refuses the Actions-secrets API path outright, whatever token
is used, and its network policy blocks `api.cloudflare.com`, so Claude
can't deploy from a session either. The owner chose to set the secrets by
hand instead (option B).

- **Secrets:** the owner adds `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_ACCOUNT_ID` and `FEEDBACK_GITHUB_TOKEN` directly in GitHub →
  Settings → Secrets and variables → Actions. This reverses the "nobody
  types a secret into GitHub's settings screen" part of Q25. The tokens
  themselves are unchanged (same scopes and expiry). `SETUP_GITHUB_TOKEN`
  and `tools/feedback/set_actions_secrets.py` are dropped, and the Claude
  environment no longer needs any of these variables.
- **Labels:** the owner creates the ten labels in the feedback repo by
  hand, since Claude sessions can't reach that private repo.
- **Rollout is now two PRs.**
  1. This PR merges with `FEEDBACK_ENDPOINT` still empty, so both
     entry points stay hidden. Merging it runs the deploy workflow for
     the first time, which prints the Worker URL.
  2. A small follow-up PR sets `FEEDBACK_ENDPOINT` to that URL, bumps
     the cache version, and adds the "What's new" entry (moved out of
     this PR so users aren't told about a link they can't see yet). The
     end-to-end test and creating the triage routine happen once that's
     live. That PR moves this intent to `intent/done/`.
