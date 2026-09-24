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
