# 058 — Start the friends-and-family beta

## Status

Roadmap #23. Requested by the owner on 2026-10-03 ("open the PR to start
the beta"), after accounts went live (intent 057).

## What changes

Set `advancedRequiresAccount: true` in `account-config.js`. Advanced mode
then needs a signed-in account whose `profiles.advanced_access` is true.
Everyone else gets Simple mode.

## Decisions

- **No code change.** The gate, the sign-in dialog and the Simple-mode
  "settings switched off" note were built in intents 044 and 045. Choosing
  Advanced without access opens the sign-in dialog with "Advanced mode is in
  a private beta…".
- **Existing open-beta users.** People who used Advanced while it was open
  keep their Advanced settings saved, but Simple mode ignores them and says
  how many are switched off. Nothing is deleted. If they're later given
  access, everything comes back.
- **The owner's own access.** Without the flag the owner would be locked out
  too, so the owner's profile row is flagged as part of starting the beta.
- **Release:** cache and `APP_VERSION` v24, with a `USER_CHANGELOG` entry,
  because Advanced stops being open to everyone.
- **No formal go/no-go metric**, as the roadmap says. This is a gut-check
  beta.

## Owner's steps

1. Ask each tester to sign in once (⚙ Data → Sign in), which creates their
   profile.
2. In Supabase → Table Editor → `profiles`, set `advanced_access` to true
   for them. They get Advanced on their next load.
3. Before inviting more than a handful of people, add custom SMTP
   (Authentication → SMTP Settings). The built-in sender allows only a few
   emails an hour.
