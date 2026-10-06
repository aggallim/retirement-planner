# Records of processing

Intent 060 (privacy review F9). A one-page record in the spirit of UK GDPR
Art. 30, kept with the code so it changes in the same PR as the processing
it describes. The public version is `privacy.html`.

**Controller:** the developer of UK Retirement Planner (GitHub: aggallim).
Contact: see `privacy.html` §1. **Last reviewed:** 2026-10-06 (v27).

| Activity | Data subjects | Personal data | Purpose | Lawful basis | Recipients / processors | Location | Retention |
|---|---|---|---|---|---|---|---|
| Planner | Users | Plan figures, names | Run the calculator | n/a: stays on the user's device, never received | None | User's browser | Until the user resets or clears data |
| Accounts | Advanced beta users (invited addresses only) | Email, access flag, marketing choice, time and wording version, consent history, sign-in records; invite list | Sign-in and access to Advanced mode | Contract | Supabase (and its email sender) | London (eu-west-2) | Until deleted (in-app or on request); 24 months inactive; unconfirmed 7 days (automatic) |
| Marketing list (not yet used) | Account holders who opted in | Email, consent time and wording | Product news and offers | Consent (PECR reg. 22) | Supabase; future SMTP provider | London; provider TBC | Until consent is withdrawn; suppression list kept after |
| Feedback | Anyone using the form | Free text, optional email, app version | Improve the app; reply | Legitimate interests | Cloudflare, GitHub, Anthropic | US | Redacted 12 months after closing |
| Abuse limits | Feedback senders | Keyed hash of network address | Stop spam | Legitimate interests | Cloudflare | Cloudflare network | 1 hour / 2 days |
| Hosting logs | Visitors | Network address, user agent | Serve the site | Legitimate interests | GitHub Pages | US/worldwide | Provider's policy |
| MCP server | Assistant users | Plan JSON (names removed) in memory only | Run the engine for an assistant | Legitimate interests | Cloudflare | Cloudflare network | Not stored |

## Transfers outside the UK

GitHub (Microsoft), Cloudflare and Anthropic are US-based. **Owner to
confirm** each is certified under the UK Extension to the EU–US Data Privacy
Framework (the "UK–US data bridge"), or that its data processing terms
include the UK International Data Transfer Addendum.

## Processor terms (Art. 28)

**Owner to confirm** a data processing agreement is accepted for each:
Supabase (DPA in dashboard), Cloudflare (DPA in account settings), GitHub
(Customer Agreement DPA), Anthropic (commercial terms DPA), and the SMTP
provider once chosen.

## DPIA screening

Financial figures are not special-category data, and the service never
receives plan figures. The account holds three fields. No profiling or
automated decisions about people are made by the service. Screening
outcome: a full DPIA is **not required** now. Re-screen before billing,
analytics, storing plans server-side, or any marketing send.

## ICO data protection fee

**Owner action.** Use the ICO's fee self-assessment
(ico.org.uk/for-organisations/data-protection-fee/self-assessment). A free
tool with planned paid features and a mailing list probably doesn't fall
under the "personal or household" exemption. If a fee is due (tier 1 for a
sole trader), register and add the registration number to `privacy.html` §1.

## Cookies and local storage (PECR reg. 6)

Every `localStorage` key supports something the user asked for (the list is
in `privacy.html` §9), so the strictly-necessary exemption applies and
there is no consent banner. Re-check before adding any analytics, including
the Data (Use and Access) Act 2025 changes.

## Live settings to verify (from the review, §6)

- Supabase: the invite gate (intent 063) applied — `before_auth_user_created` on `auth.users`;
  custom SMTP; refresh-token lifetime; email templates name the sender.
- Cloudflare: Workers Logs / analytics on the feedback Worker; retention.
- GitHub: who can access the feedback repo; token scope and expiry.
- No other site published under `aggallim.github.io` while the app shares
  that origin (F7).
