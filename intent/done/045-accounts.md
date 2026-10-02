# 045 — Accounts (magic link) and marketing consent

## Status

Roadmap #13 (account system) and #14 (marketing consent checkbox). Billing
is not wired up (#25).

## Decisions

- **Provider:** Supabase Auth, called over its REST API with `fetch`. No SDK,
  so nothing is added to the bundle and the single-file app stays offline
  capable.
- **Off until configured.** `account-config.js` sets `ACCOUNT_CONFIG =
  { supabaseUrl, supabaseAnonKey, advancedRequiresAccount }`, the same
  pattern as `feedback-config.js`. Empty URL means no account UI anywhere,
  and the "no account" privacy wording stays as it is.
- **Only for Advanced.** Simple mode never asks for an account. The sign-in
  entry appears in the ⚙ Data menu and when locked Advanced is chosen.
- **Magic link flow:**
  1. The user enters their email, with an **unticked** "Email me product
     news and offers" checkbox (#14).
  2. `POST /auth/v1/otp` sends the link, with `marketing_consent` and the
     time of consent in the user's metadata.
  3. The link returns to the app with tokens in the URL hash. The app
     stores the session under its own localStorage key, removes the hash
     from the address bar, and refreshes the token when it expires.
  4. Sign out calls `/auth/v1/logout` and clears the session.
- **Profile:** `profiles` table (id, email, `advanced_access`,
  `marketing_consent`, `marketing_consent_at`, timestamps), created by a
  trigger on sign-up, with row-level security so a user can read only their
  own row and can change only their consent. `advanced_access` is set by the
  owner by hand for the friends-and-family beta (#23). SQL is in
  `tools/accounts/schema.sql`, with setup steps in
  `tools/accounts/README.md`.
- **Plan data never leaves the device**, signed in or not. The privacy text
  gains one line when accounts are on: the account holds an email address,
  a consent choice and access status, never plan figures.
- Consent can be changed later from the account panel.
