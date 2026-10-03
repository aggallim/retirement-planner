# 057 — Turn on accounts

## Status

Follow-up to intent 045. The owner asked on 2026-10-03 for help setting up
Supabase; the agent did as much as the connector allows.

## Already done (outside the repo)

- The owner created the Supabase project "UK Retirement Planner"
  (`jkoruktwyfbszshnekaj`, London) and ran `tools/accounts/schema.sql`. The
  agent checked it: the `profiles` table, both row-level security policies,
  both triggers, and the consent-only column grant are in place. Supabase's
  security advisor reports no issues.

## Decisions

- Fill in `account-config.js` with the project URL and its **publishable**
  key (`sb_publishable_…`). Supabase recommends it over the legacy anon JWT
  for new apps, and it can be rotated on its own. It is public by design;
  the `service_role` key never goes in the repo.
- Keep `advancedRequiresAccount: false`. This turns on the sign-in option
  only. Advanced stays an open beta until the owner starts the
  friends-and-family beta (#23).
- Cache and `APP_VERSION` bump to v23, with a `USER_CHANGELOG` entry,
  because the Data menu and privacy wording change for users.

## Needs the owner before merging

In the Supabase dashboard, Authentication → URL Configuration: set Site URL
to `https://aggallim.github.io/retirement-planner/` and add it to Redirect
URLs. Without this, magic links send people to the wrong address. The
connector can't change these settings.
