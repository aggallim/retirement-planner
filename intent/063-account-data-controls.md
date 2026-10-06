# 063 — Account data controls in the database

## Status

Roadmap §1B (Notion). Delivers the database half of intent 060 that its
2026-10-04 addendum recorded as not done: the session's permission policy
refused the schema change. The owner has now approved it (2026-10-06:
"We don't have live users, do everything you can"). The design is the one
already decided in 060 (F3, F4, F8); this file records what is built and
the few points 060 left open.

## What's wrong

- **F4.** Anyone can create an account, and so make the service email any
  address. The marketing choice is stored before the address is confirmed.
- **F8.** The consent timestamp is set by the browser. There's no record of
  the wording shown, no consent log, no unsubscribe link and no
  do-not-email list.
- **F3.** There's no in-app way to delete an account. Unconfirmed sign-ups
  and inactive accounts are cleaned up by hand, using SQL in
  `docs/privacy/DATA_REQUESTS.md`.

The privacy notice already promises some of these (7-day clean-up,
one-click unsubscribe, a do-not-email list).

## What's wanted

All in `tools/accounts/schema.sql` (re-runnable) and applied to the live
Supabase project. The live project has no users apart from the owner.

1. **Invite-only gate (F4).** A `beta_invites` table (service role only).
   A `before insert` trigger on `auth.users` refuses any address not on
   it, so Supabase sends no email to an uninvited address. Existing users
   are seeded into the table, so the owner's own account keeps working
   (the schema seeds from `auth.users`; no address is written into the
   repo). Being invited grants `advanced_access` when the profile is
   created. The owner's steps for a new tester become "add their email to
   `beta_invites`, tell them to sign in". The app already turns Supabase's
   refusal into "Sign-in is invite-only during the Advanced beta".
2. **Consent only after confirmation (F4).** At sign-up, the ticked box is
   stored as `marketing_consent_pending`. It becomes `marketing_consent =
   true` only when `auth.users.email_confirmed_at` is set.
3. **Consent evidence (F8).** `marketing_consent_at` is set by a trigger
   from the server clock; whatever the browser sends is ignored. A new
   column `consent_text_version` records which wording was shown. The app
   sends `marketing-v1`. Every change is appended to `consent_events`
   (user, email, choice, wording version, source, time), which only the
   service role can reach.
4. **Unsubscribe (F8).** Each profile has an unguessable
   `unsubscribe_token`. An Edge Function `unsubscribe` (no sign-in) turns
   consent off for a token and adds the address to `marketing_suppressions`.
   It accepts mailbox one-click POSTs (RFC 8058). A plain `unsubscribe.html`
   page in the app is the link target people click. A `private.marketing_list`
   view (confirmed, consented, not suppressed) is the only sanctioned
   export for a send.
5. **Delete my account (F3).** An Edge Function `delete-account` checks the
   caller's access token with `/auth/v1/user`, then deletes that user with
   the admin API. The `profiles` row and its consent events go with it
   (`on delete cascade`). The account panel gets a "Delete my account"
   button with a confirmation step.
6. **Scheduled clean-up (F3).** A daily pg_cron job deletes sign-ups never
   confirmed after 7 days. A `private.inactive_accounts` view lists accounts
   with no sign-in for 24 months, for the owner to warn and remove (no
   automatic email exists yet).

Docs updated to match: the privacy notice, `docs/privacy/DATA_REQUESTS.md`
and `RECORDS_OF_PROCESSING.md`, the accounts setup guide, and
`docs/TOOL_DOCUMENTATION.md`.

## Decisions on points 060 left open

- **Who goes on the do-not-email list when an account is deleted.** Only
  people who had opted in (confirmed consent). Keeping the address of
  someone who never agreed to marketing would hold data for no reason. A
  ticked box that was never confirmed doesn't count either, because the
  address may not even be theirs. This matches what the privacy notice
  already says.
- **Re-joining after unsubscribing.** A new, confirmed opt-in is a newer
  choice than the old unsubscribe, so it removes the address from the
  do-not-email list. The change is logged in `consent_events`.
- **Views stay out of the API.** `marketing_list` and `inactive_accounts`
  read `auth.users`, so they live in a `private` schema that isn't exposed
  through the REST API. The owner reads them in the SQL editor.
- **The unsubscribe page is in the app, not served by the function.**
  Supabase Edge Functions serve HTML as plain text on the default domain.
  So the link points at `unsubscribe.html?token=…`, and the person clicks
  a button there, which calls the function. The button is there so that
  link scanners in mail systems can't unsubscribe someone just by opening
  the link. The function also takes a one-click POST from mail clients.
- **Old app versions keep working.** The browser may still send
  `marketing_consent_at`; the column stays writable but the trigger
  replaces the value with the server time.
