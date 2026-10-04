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
| Account: email, `advanced_access`, marketing choice and time | Supabase → Table Editor → `profiles` | filter by email |
| Sign-in records | Supabase → Authentication → Users | search by email |
| Feedback they sent | GitHub, `aggallim/retirement-planner-feedback` issues | search by text or the email |
| Rate-limit counters | Cloudflare KV `FEEDBACK_KV` | keyed hashes only, expire in 1 hour/2 days; not linkable to a person |

## Request types

- **Access (Art. 15).** Send the `profiles` row, the Auth user's email,
  created and last-sign-in times, and copies of any feedback issues they
  sent. Say that plan figures are only on their own device.
- **Erasure (Art. 17) / delete my account.** Supabase → Authentication →
  Users → the user → **Delete user**. The `profiles` row is deleted with it
  (`on delete cascade`). If they had ever opted in to marketing, add their
  email to your do-not-email list before deleting. For feedback, edit each
  issue's body and title to the redaction line in `TRIAGE.md` (GitHub's
  API can't delete issues; the web UI can delete an issue if you're an
  admin, which is better when asked).
- **Rectification (Art. 16).** Edit the email in Supabase → Authentication
  (the user can also just create a new account and ask for the old one to
  be deleted).
- **Objection / withdraw marketing consent (Art. 21, Art. 7(3)).** Set
  `marketing_consent` to false on their `profiles` row and add them to the
  do-not-email list. They can also untick it themselves in ⚙ Data →
  Account.
- **Portability (Art. 20).** Same as access, as JSON. Their plan is
  already portable through Export.

## Retention housekeeping (monthly)

The privacy notice promises these; until they are automated (see intent
060, owner actions), run them by hand in the Supabase SQL editor:

```sql
-- Sign-ups whose link was never opened, older than 7 days: delete.
select id, email, created_at from auth.users
 where email_confirmed_at is null and created_at < now() - interval '7 days';

-- Accounts with no sign-in for 24 months: email a warning, then delete
-- after 30 days if there's no reply.
select id, email, last_sign_in_at from auth.users
 where coalesce(last_sign_in_at, created_at) < now() - interval '24 months';
```

Delete through Authentication → Users so Supabase cleans up sessions.
Feedback redaction after 12 months is done by the daily triage routine.

## Exporting a marketing list (when sending starts)

Only addresses that are confirmed, opted in and not on the do-not-email
list:

```sql
select p.email, p.marketing_consent_at from public.profiles p
  join auth.users u on u.id = p.id
 where p.marketing_consent and u.email_confirmed_at is not null;
```

Remove anyone on the do-not-email list before sending, and include an
unsubscribe link in every email (PECR reg. 22).
