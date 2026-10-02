# Accounts (Supabase magic link) — setup

Intent 045 (roadmap #13 and #14). Accounts exist only to unlock Advanced mode.
Simple mode never asks for one, and no plan figures are ever sent: an account
holds an email address, a marketing-consent choice and an access flag.

Until `account-config.js` has a Supabase URL and key, all of this is switched
off and the app shows its "no account" wording.

## One-time setup (owner)

1. **Create a Supabase project** (free tier is enough) at
   https://supabase.com/dashboard. Region: London (`eu-west-2`).
2. **Run the schema.** SQL editor → paste `tools/accounts/schema.sql` → Run.
3. **Auth settings** (Authentication → Sign In / Providers → Email):
   - Email provider enabled; "Confirm email" on.
   - Turn off password sign-up if you like: the app only uses magic links.
4. **URL configuration** (Authentication → URL Configuration):
   - Site URL: `https://aggallim.github.io/retirement-planner/`
   - Redirect URLs: add `https://aggallim.github.io/retirement-planner/`
     (and `http://localhost:8000/` for local testing).
5. **Email template** (optional): Authentication → Email Templates → Magic
   Link. Keep `{{ .ConfirmationURL }}`; the app reads the tokens from the URL
   hash it returns with.
6. **Custom SMTP** (before more than a handful of users): the built-in
   sender is rate-limited. Authentication → SMTP Settings.
7. **Turn it on in the app:** in `account-config.js` set `supabaseUrl` and
   `supabaseAnonKey` (Project Settings → API → Project URL and the `anon`
   public key). Never use the `service_role` key. Bump the `sw.js` cache
   version and `APP_VERSION` with it.

## Friends-and-family beta (roadmap #23)

1. Set `advancedRequiresAccount: true` in `account-config.js` (with a cache
   bump). Advanced mode now needs a signed-in account with access.
2. Ask each tester to sign in once (⚙ Data → Sign in), which creates their
   profile.
3. Table editor → `profiles` → set `advanced_access` to `true` for them.
   They see Advanced on their next load.

## Marketing consent

`profiles.marketing_consent` (and `marketing_consent_at`) records the
unticked-by-default checkbox at sign-up. Users can change it from the account
panel. Export the opted-in list from the table editor when marketing starts
(roadmap #28). Nobody is emailed automatically.

## What the app calls

All over Supabase's REST API with the public anon key (no SDK):

| Call | Purpose |
|---|---|
| `POST /auth/v1/otp?redirect_to=…` | send the magic link, with consent in user metadata |
| `POST /auth/v1/token?grant_type=refresh_token` | refresh an expired session |
| `GET /auth/v1/user` | who is signed in |
| `GET /rest/v1/profiles?id=eq.<id>` | access flag and consent |
| `PATCH /rest/v1/profiles?id=eq.<id>` | change consent (row-level security limits it to the consent columns) |
| `POST /auth/v1/logout` | sign out |

The session is kept in localStorage under `ukRetirementPlanner.session.v1`.
