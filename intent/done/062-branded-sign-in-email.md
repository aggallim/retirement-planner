# 062 — Branded sign-in email

## What's wrong

The email a user gets when they ask for an Advanced sign-in link looks like
it came from Supabase, not from the UK Retirement Planner:

- the body is Supabase's default template ("Confirm your signup" /
  "Follow this link to confirm your user"), with no app name or branding;
- the link goes to `jkoruktwyfbszshnekaj.supabase.co/auth/v1/verify…`, an
  address that has nothing to do with the app;
- the sender is "Supabase Auth <noreply@mail.app.supabase.io>".

To a beta tester this reads like phishing.

## Decisions (owner, 2026-10-06)

- **Fix the wording and the link now.** The sender stays Supabase's until
  custom SMTP is set up; that needs an email provider the owner controls and
  is out of scope here (the setup guide already lists it as step 6).
- **Branded templates live in the repo** (`tools/accounts/email-templates/`)
  for both emails Supabase sends: *Confirm signup* (first sign-in) and
  *Magic Link* (returning user). Email-safe HTML: inline styles, tables, no
  images or web fonts, the brand ink navy (`#3a518f`) and paper background,
  the app's name, what the email is for, and a "didn't ask for this?" line.
  The owner pastes them into Authentication → Email Templates; no tool in
  an agent session can set them.
- **The link points at the app.** The templates link to
  `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email` (the page the
  user asked from, on aggallim.github.io), and the app finishes sign-in by
  posting the token hash to `/auth/v1/verify`. Side benefits: a link
  scanner that pre-fetches the URL no longer burns the one-time token
  (verification needs the app's JavaScript), and the link works on any
  device.
- **Old links keep working.** The `?code=` (PKCE) and hash flows stay, so
  emails sent before the templates are changed still sign in. Ship the app
  change before pasting the templates.
