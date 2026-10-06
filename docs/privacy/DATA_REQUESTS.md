# Data requests runbook

Intent 060 (privacy review F3). How the owner handles a request under UK
GDPR from someone using the planner. Deadline: **one month** from receipt
(Art. 12), extendable by two more months only for complex or numerous
requests, and only if you tell the person within the first month.

## Where requests arrive

- Feedback form, type **Privacy or data request**: an issue labelled
  `privacy-request` in the private `aggallim/retirement-planner-feedback`
  repo. The daily triage routine never touches these (`tools/feedback/TRIAGE.md`).
  The form requires an email address for this type.
- `PRIVACY_CONTACT_EMAIL` in `feedback-config.js`, once a role address is set
  up (shown on `privacy.html`).

Log each request in the issue itself: date received, what was asked, what
you did, date answered. Reply by email, not on the issue.

## Check who is asking

Reply to the email address on the account (or the one given in the
request) and ask them to confirm. Don't send account data to any other
address. Plan figures are never held by us, so there is nothing to send
for them: say so.

## What we hold, and where

| Data | Where | How to find it |
|---|---|---|
| Account: email, `advanced_access`, marketing choice, time and wording version | Supabase → Table Editor → `profiles` | filter by email |
| Marketing-choice history | `private.consent_events` (schema `private`) | filter by email |
| Do-not-email list | `private.marketing_suppressions` | filter by email |
| Beta invite | `private.beta_invites` | filter by email |
| Sign-in records | Supabase → Authentication → Users | search by email |
| Feedback they sent | GitHub, `aggallim/retirement-planner-feedback` issues | search by text or the email |
| Rate-limit counters | Cloudflare KV `FEEDBACK_KV` | keyed hashes only, expire in 1 hour/2 days; not linkable to a person |

## Request types

- **Access (Art. 15).** Send the `profiles` row, the Auth user's email,
  created and last-sign-in times, and copies of any feedback issues they
  sent. Say that plan figures are only on their own device.
- **Erasure (Art. 17) / delete my account.** Users can do this themselves:
  ⚙ Data → Account → **Delete my account** (the `delete-account` Edge
  Function, intent 063). Otherwise: Supabase → Authentication → Users →
  the user → **Delete user**. Either way the `profiles` row and its
  consent history are deleted with it (`on delete cascade`), and if the
  account was opted in to marketing, a trigger adds the address to
  `private.marketing_suppressions`. Also remove their row from
  `private.beta_invites` if they don't want to be invited again. For feedback, edit each
  issue's body and title to the redaction line in `TRIAGE.md` (GitHub's
  API can't delete issues; the web UI can delete an issue if you're an
  admin, which is better when asked).
- **Rectification (Art. 16).** Edit the email in Supabase → Authentication
  (the user can also just create a new account and ask for the old one to
  be deleted).
- **Objection / withdraw marketing consent (Art. 21, Art. 7(3)).** Set
  `marketing_consent` to false on their `profiles` row (the change is
  logged in `private.consent_events`) and add them to the do-not-email
  list: `insert into private.marketing_suppressions (email, reason) values
  (lower('…'), 'owner');`. They can also untick it themselves in ⚙ Data →
  Account, or use the unsubscribe link in any marketing email.
- **Portability (Art. 20).** Same as access, as JSON. Their plan is
  already portable through Export.

## Retention housekeeping (monthly)

Sign-ups whose link was never opened are deleted automatically after 7
days (pg_cron job `delete-unconfirmed-signups`, daily at 03:17 UTC; intent
063). Check it ran: `select * from cron.job_run_details order by
start_time desc limit 5;`.

Accounts with no sign-in for 24 months are still manual, because nothing
sends a warning email yet:

```sql
select * from private.inactive_accounts;
```

Email each one a warning, then delete after 30 days if there's no reply
(Authentication → Users → Delete user, so Supabase cleans up sessions).
Feedback redaction after 12 months is done by the daily triage routine.

## Exporting a marketing list (when sending starts)

Only addresses that are confirmed, opted in and not on the do-not-email
list. This view is the only sanctioned export:

```sql
select * from private.marketing_list;
```

Every email must carry that person's unsubscribe link (PECR reg. 22), in
the body as `https://aggallim.github.io/retirement-planner/unsubscribe.html#token=<unsubscribe_token>`
and as headers for one-click unsubscribe (RFC 8058):

```
List-Unsubscribe: <https://jkoruktwyfbszshnekaj.supabase.co/functions/v1/unsubscribe?token=<unsubscribe_token>>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```
