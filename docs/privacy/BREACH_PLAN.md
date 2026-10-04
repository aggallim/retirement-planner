# Personal data breach plan

Intent 060 (privacy review F9). A breach is any security incident that
leads to personal data being lost, destroyed, changed, disclosed or
accessed without permission. For this service the personal data is: account
emails and flags (Supabase), feedback text and optional emails (GitHub,
Cloudflare in transit, Anthropic for triage), and session tokens in users'
browsers.

## The 72-hour rule

If a breach is likely to put people at risk, report it to the ICO within
**72 hours of becoming aware of it** (ico.org.uk/for-organisations/report-a-breach,
0303 123 1113). If the risk to people is high, also tell the people affected
without undue delay. If you decide not to report, write down why.

## Steps

1. **Contain.** Depending on what happened:
   - Leaked secret (GitHub token, Supabase secret key, Cloudflare token):
     revoke and rotate it now (GitHub → Settings → Developer settings;
     Supabase → Project Settings → API keys; Cloudflare → API Tokens), then
     update the repo's Actions secrets and the Worker secrets.
   - Supabase data exposed: check the security advisor and RLS; rotate keys;
     sign everyone out (Authentication → Users, or rotate the JWT signing key).
   - A malicious script on the `aggallim.github.io` origin (see F7): take
     the offending site down; it could read this app's `localStorage`,
     including session tokens, so sign everyone out.
   - Feedback repo access granted to the wrong person: remove them, review
     the audit log.
2. **Assess.** What data, how many people, how sensitive, is it still
   exposed, could it be used against them (phishing with a known email,
   financial details typed into feedback)?
3. **Decide and notify** per the 72-hour rule above.
4. **Record** every breach, reported or not, in a private note: date found,
   what happened, data and people affected, decisions and why, fixes.
5. **Fix the cause** and add a check (test, advisor, setting) so it can't
   recur unnoticed.

## Contacts

- ICO breach line: 0303 123 1113
- Supabase support: supabase.com/support
- Cloudflare: dash.cloudflare.com → Support
- GitHub: support.github.com
