# Accounts (Supabase magic link) — setup

Intent 045 (roadmap #13 and #14). Accounts exist only to unlock Advanced mode.
Simple mode never asks for one, and no plan figures are ever sent: an account
holds an email address, a marketing-consent choice and an access flag.

Until `account-config.js` has a Supabase URL and key, all of this is switched
off and the app shows its "no account" wording.

## One-time setup (owner)

**Status (intent 057):** done up to step 2. The project is "UK Retirement
Planner" (ref `jkoruktwyfbszshnekaj`, London) and the schema has been
applied, with both Supabase advisors clean. `account-config.js` points at
it. Steps 3–6 can only be done in the dashboard.

1. **Create a Supabase project** (free tier is enough) at
   https://supabase.com/dashboard. Region: London (`eu-west-2`). If the form
   offers Data API options, keep the Data API on for the `public` schema
   (the app uses only the REST API). Auto-exposing new tables isn't needed,
   because the schema grants its own privileges.
2. **Run the schema.** SQL editor → paste `tools/accounts/schema.sql` → Run.
   Then check Advisors → Security and Performance: both should be empty.
3. **Auth settings** (Authentication → Sign In / Providers):
   - **Allow new users to sign up: on.** This is required, because the app
     requests the link with `create_user: true`, which creates the account.
   - Email provider enabled; "Confirm email" on.
   - Turn off password sign-up if you like: the app only uses magic links.
4. **URL configuration** (Authentication → URL Configuration):
   - Site URL: `https://aggallim.github.io/retirement-planner/`
   - Redirect URLs: add `https://aggallim.github.io/retirement-planner/**`
     and `http://localhost:8000/**` (for local testing). Use the `**`
     wildcard: the app redirects back to whatever page the user is on
     (e.g. `…/index.html`), and a URL that isn't allowed falls back to the
     Site URL.
5. **Email templates** (optional): Authentication → Email Templates. A
   first-time user receives **Confirm signup**; a returning user receives
   **Magic Link**. If you reword one, reword both, and keep
   `{{ .ConfirmationURL }}` in each: the app reads the tokens from the URL
   hash it returns with.
6. **Custom SMTP** (before more than a handful of users): the built-in
   sender allows only a few emails an hour. Authentication → SMTP Settings.
7. **Turn it on in the app:** in `account-config.js` set `supabaseUrl` and
   `supabaseAnonKey` (Project Settings → API Keys: the Project URL and the
   **publishable** key `sb_publishable_…`; the legacy `anon` key also works).
   Never use a secret key (`sb_secret_…`) or the `service_role` key. Bump
   the `sw.js` cache version and `APP_VERSION` with it. Ship this only after
   steps 3–4, because every visitor sees "Sign in" once it is live.

## Friends-and-family beta (roadmap #23)

**Started 2026-10-03 (intent 058, v24).**

1. Set `advancedRequiresAccount: true` in `account-config.js` (with a cache
   bump). Advanced mode now needs a signed-in account with access. *Done.*
2. Ask each tester to sign in once (⚙ Data → Sign in), which creates their
   profile.
3. Table editor → `profiles` → set `advanced_access` to `true` for them.
   They see Advanced on their next load. To remove access, set it back to
   `false`; their Advanced settings stay saved on their device.
4. Before inviting more than a handful of people, set up custom SMTP
   (step 6 above).

## Marketing consent

`profiles.marketing_consent` (and `marketing_consent_at`) records the
unticked-by-default checkbox at sign-up. Users can change it from the account
panel. Export the opted-in list from the table editor when marketing starts
(roadmap #28). Nobody is emailed automatically.

## What the app calls

All over Supabase's REST API with the public key as the `apikey` header (no SDK):

| Call | Purpose |
|---|---|
| `POST /auth/v1/otp?redirect_to=…` | send the magic link, with consent in user metadata |
| `POST /auth/v1/token?grant_type=refresh_token` | refresh an expired session |
| `GET /auth/v1/user` | who is signed in |
| `GET /rest/v1/profiles?id=eq.<id>` | access flag and consent |
| `PATCH /rest/v1/profiles?id=eq.<id>` | change consent (row-level security limits it to the consent columns) |
| `POST /auth/v1/logout` | sign out |

The session is kept in localStorage under `ukRetirementPlanner.session.v1`.
