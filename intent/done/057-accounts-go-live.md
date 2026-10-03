# 057 — Accounts go live (Supabase project connected)

## Status

Follows `intent/done/045-accounts.md`, which built magic-link accounts but
left them switched off until a Supabase project existed. The owner has now
created that project ("UK Retirement Planner", London `eu-west-2`, ref
`jkoruktwyfbszshnekaj`) and connected it to an agent session, which applied
the schema directly.

## What happened in the Supabase project

The schema in `tools/accounts/schema.sql` was applied as migrations, then
the project's security and performance advisors were run. They raised:

- `touch_profile` has a role-mutable `search_path`.
- `handle_new_user` (a `SECURITY DEFINER` function in `public`) is listed
  as executable by `anon` and `authenticated` via `/rest/v1/rpc/…`. A
  trigger function can't actually be called that way, but revoking
  `EXECUTE` is Supabase's recommended fix and costs nothing: Postgres checks
  that privilege only when the trigger is created, not when it fires.
- Both RLS policies call `auth.uid()` per row instead of once per query.

All three were fixed in the project, and both advisors are now clean. The
repo's `schema.sql` must match what is live, so a rebuilt project ends up
identical.

Checked live: `authenticated` has no table-level `UPDATE` and can update
only `marketing_consent` and `marketing_consent_at`; it has `SELECT`; RLS is
on with the two policies; both triggers exist.

## Decisions (settled with the owner)

- **Key:** use the project's **publishable** key (`sb_publishable_…`), not
  the legacy JWT anon key. It is Supabase's current recommendation and can
  be rotated on its own. The app sends the key only as the `apikey` header
  (the `Authorization` header carries the user's session token), so it works
  unchanged. The config field keeps its name, `supabaseAnonKey`, to avoid
  touching app code; the comment says either public key works.
- **Advanced stays open:** `advancedRequiresAccount` stays `false`. Sign-in
  becomes available, but Advanced remains an open beta preview until the
  friends-and-family beta flips it.
- **Merge only after the dashboard steps.** Some settings can't be changed
  from the connector (Site URL, redirect URLs, "Allow new users to sign up",
  email templates, SMTP). Until they are set, a magic link would send
  people to the wrong address, and every visitor will see "Sign in" once
  this ships. The PR is opened now and merged only after the owner has
  finished those steps and tested sign-in locally.
- **README additions:** a wildcard redirect URL
  (`https://aggallim.github.io/retirement-planner/**`) because the app
  redirects to whatever page the user is on. Also: "Allow new users to sign
  up" must be on (the app requests the link with `create_user: true`); a
  first-time user receives the "Confirm signup" template, not "Magic Link";
  and the publishable key is the one to copy.

## User-facing?

Yes: "Sign in (for Advanced mode)" appears in the ⚙ Data menu and the
privacy wording changes. It gets a `USER_CHANGELOG` entry and a cache bump.
