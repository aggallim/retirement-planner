# 060 — Privacy and compliance fixes

## Status

Child of 059. Delivers the Notion "Privacy & Compliance Review (Oct 2026)",
findings F1–F10, reviewed against v24 (commit `66fe184`). The review is a
practical privacy review, not legal advice, and neither is this.

## What's wrong (from the review)

- **F1 (High)** Public wording still says "no account" and "nothing is
  uploaded" (static summary, `og:description`, FAQ JSON-LD, README,
  `llms*.txt`, docs), which stopped being true in v23/v24.
- **F2 (High)** No privacy notice at all (UK GDPR Art. 13).
- **F3 (High)** No way to delete an account or erase feedback, no retention
  rules, no data-request process.
- **F4 (High)** Anyone can create an account (and make the service email any
  address); marketing consent is stored before the address is confirmed.
- **F5 (Medium)** Google Fonts loaded at runtime sends every visitor's IP to
  Google.
- **F6 (Medium)** The feedback form doesn't say its text goes through
  Cloudflare, GitHub and an AI triage assistant.
- **F7 (Medium, verify)** The shared `aggallim.github.io` origin lets any
  other Pages site on the account read this app's `localStorage`.
- **F8 (Medium)** Consent timestamp is client-set; no record of the wording;
  no unsubscribe or suppression list.
- **F9 (Medium)** Governance: ICO fee, processor terms, records of
  processing, breach plan.
- **F10 (Low)** No CSP, unsalted IP hash, sign-out leaves the plan, implicit
  auth flow, MCP "keeps nothing" wording, no adult-audience line.

## Decisions (made by the agent, per 059)

### F1 — wording
One accurate statement, used everywhere it appears: *Your plan figures
never leave your device. Simple mode needs no account. Advanced mode
(invite-only beta) uses an email sign-in; the account holds only your
email, a marketing choice and an access flag. Optional feedback sends only
what you type.* Updated in: the static summary, `og:description`, the FAQ
JSON-LD, the Data-menu and footer lines, README, `llms.txt`,
`llms-full.txt`, and `docs/TOOL_DOCUMENTATION.md`.

### F2 — privacy notice
- New plain-HTML `privacy.html`, styled like `feedback.html`, cached by the
  service worker, with the review's nine headings plus "Children" and
  "Changes to this notice".
- Linked from the footer, the sign-in panel, the Data menu and the feedback
  form; each point of collection keeps a one-line summary (layered notice).
- **Controller and contact.** No role email address exists yet, and the
  agent won't publish the owner's personal address. The controller is named
  as the developer of UK Retirement Planner (GitHub: aggallim). Data
  requests go through the feedback form, which gains a "Privacy or data
  request" type; the Worker labels those issues `privacy-request` and
  triage leaves them for the owner. A `PRIVACY_CONTACT_EMAIL` setting in
  `feedback-config.js` shows a direct address on the notice once the owner
  sets one up (owner action).
- Lawful bases: contract (account sign-in and access), consent (marketing),
  legitimate interests (feedback handling, rate-limiting, security logs).
- PECR: `localStorage` entries are strictly necessary for things the user
  asked for, so there is no cookie banner; the notice lists every key.

### F3 — deletion, access, retention
- **Delete my account:** a Supabase Edge Function `delete-account` (deployed
  to the live project). It checks the caller's access token with
  `/auth/v1/user`, then deletes that user with the admin API. `profiles`
  goes with it (`on delete cascade`). The address is added to the
  suppression list (F8) so it is never mailed. The account panel gets a
  "Delete my account" button with a confirmation step.
- **Retention**, stated in the notice and enforced where possible:
  - Unconfirmed sign-ups: deleted after 7 days (pg_cron, daily).
  - Accounts with no sign-in for 24 months: listed by a SQL view
    (`inactive_accounts`) for the owner to warn and remove; no automatic
    email exists yet, so this stays manual.
  - Feedback issues: redacted 12 months after closing. GitHub's API can't
    delete issues, but it can replace their text, so the daily triage
    routine replaces the body with a redaction note (`TRIAGE.md` rule).
  - Rate-limit counters: 1 hour (per-IP) and 2 days (daily total), as now.
- **Data requests:** `docs/privacy/DATA_REQUESTS.md`, a half-page runbook
  (access, erasure, objection, withdrawal of consent; one-month deadline).

### F4 — invite-only sign-up, confirmed-email consent
- The Supabase "allow new sign-ups" switch is a dashboard setting this
  session can't change, so the gate is enforced in the database instead: a
  `beta_invites` table (service role only) and a `before insert` trigger on
  `auth.users` that rejects any address not on it. No email is sent to an
  uninvited address. Existing users (the owner) are unaffected.
- Being on `beta_invites` also grants `advanced_access` when the profile is
  created, so the owner's steps shrink to "add the email to
  `beta_invites`, then tell them to sign in". The owner's own email is
  seeded so their account keeps working.
- The app shows "Sign-in is invite-only during the beta" when Supabase
  refuses an address, with a link to request access through feedback.
- **Consent only after confirmation:** the new-user trigger stores the
  marketing choice as *pending*. It becomes `marketing_consent = true` only
  when `auth.users.email_confirmed_at` is set (when the link is clicked).
  The opted-in list view also requires a confirmed address.
- Recommended owner action: still switch off open sign-ups in the dashboard
  and add custom SMTP before widening the beta.

### F5 — fonts
Self-host Fraunces and Inter Tight (variable `woff2`, Latin subset, SIL
Open Font License) in `fonts/`, add them to the service worker's
precache, and remove every Google `preconnect`, `@import` and `<link>`.

### F6 — feedback disclosure
The form says: "Your message is sent through Cloudflare and stored in a
private GitHub repository. An AI assistant reads it to sort and summarise
it. Closed feedback is removed after 12 months." The example-figures box
warns: "Please don't include names, account numbers or exact balances."
Links to the notice.

### F7 — shared origin
Moving to a custom domain needs a purchase, which is the owner's call
(roadmap #24). Delivered here: the notice describes the current origin; the
docs list every place a domain change must touch (feedback Worker
`ALLOWED_ORIGINS`, Supabase site and redirect URLs, canonical, sitemap,
Open Graph, `APP_URL`, CSP); and the owner is advised not to publish any
other GitHub Pages site under the same account until then. Whether one
exists today couldn't be checked from this session (network policy).

### F8 — consent evidence, unsubscribe, suppression
- `marketing_consent_at` is set by a database trigger (server time); the
  client can no longer write it.
- New `profiles.consent_text_version`; the app sends the version of the
  wording shown (`marketing-v1`). Every change is written to a
  `consent_events` log (user, choice, wording version, source, time) by
  trigger. Append-only, service role only.
- Each profile gets an unguessable `unsubscribe_token`. An Edge Function
  `unsubscribe` (no sign-in needed) turns consent off for that token and
  shows a plain confirmation page. Emails must carry
  `…/functions/v1/unsubscribe?token=<token>`.
- A `marketing_suppressions` table (unsubscribes and deleted accounts) and
  a `marketing_list` view (confirmed, consented, not suppressed) are the
  only sanctioned export for a send.
- Nobody is emailed today; the first send waits for the owner's SMTP setup.

### F9 — governance
New `docs/privacy/`: `RECORDS_OF_PROCESSING.md` (Art. 30), `BREACH_PLAN.md`
(72-hour ICO rule), `DATA_REQUESTS.md` (F3), and a short DPIA screening note
in the records. ICO fee self-assessment, processor terms and transfer
safeguards (UK–US data bridge / IDTA addendum) are owner actions; the docs
say what to check.

### F10 — smaller items
- **CSP** as a `<meta>` tag on `index.html`, `feedback.html` and
  `privacy.html`: `default-src 'self'`, `connect-src` limited to the
  Supabase project and the feedback Worker, `font-src 'self'`,
  `img-src 'self' data:`, `object-src 'none'`, `base-uri 'none'`,
  `form-action 'self'`. Scripts and styles still need `'unsafe-inline'`
  because the app is one inline bundle; a hash would break on every edit.
  A test checks the CSP lists the configured Supabase and Worker hosts.
- **Salted IP hash:** HMAC-SHA-256 keyed with a new `IP_HASH_SALT` secret,
  falling back to the existing `GITHUB_TOKEN` secret until the owner sets
  one, so it is keyed from day one. One-hour expiry kept.
- **Sign-out note:** "Signing out doesn't clear your plan from this
  device. To clear it, use Reset."
- **PKCE:** the magic link uses the PKCE flow (`code_challenge` on
  `/otp`, `?code=` exchanged at `/token?grant_type=pkce`), so tokens
  never appear in the URL. The old fragment flow is still read, for links
  sent before the change.
- **MCP wording:** "keeps no plan data" (Cloudflare still sees request
  metadata).
- **Age:** the notice says the service is for adults planning retirement.

## Not done here (owner actions)
ICO fee self-assessment and registration; processor agreements; custom
SMTP; switching off open sign-ups in the Supabase dashboard; a role email
for data requests; a custom domain; setting `IP_HASH_SALT` in Cloudflare.
All listed on the PR and in `docs/privacy/`.

## Addendum 2026-10-04 — database changes not made

The session's permission policy refused the change that would have added
the F3/F4/F8 database work to `tools/accounts/schema.sql` (and so it was
not applied to the live Supabase project either): the `beta_invites` gate,
consent applied only after email confirmation, the server-set consent
timestamp and `consent_events` log, `marketing_suppressions`, the
`delete_my_account()` and `unsubscribe()` functions, and the scheduled
clean-up of unconfirmed sign-ups. The agent did not try another route.

What shipped instead, so nothing promised is untrue:
- The app keeps its current sign-up flow; it shows the invite-only message
  only if Supabase refuses an address.
- No "Delete my account" button and no unsubscribe page (they would call
  functions that don't exist). The notice tells people to send a privacy
  request; `docs/privacy/DATA_REQUESTS.md` gives the owner the dashboard
  steps and the clean-up and export SQL.
- The owner can approve the database change in a later session, or switch
  off open sign-ups in the Supabase dashboard (Authentication → Sign In /
  Providers → "Allow new users to sign up") as the simplest F4 fix.
