# Feedback pipeline: setup guide

How the "Send feedback" link in the app reaches a triaged GitHub issue
(`intent/026-user-feedback.md`):

```
App "Send feedback" link ──► Google Form (new tab, app version pre-filled)
                                  │ on submit
                                  ▼
                       Apps Script (Code.gs) ──► issue in private repo
                                                  aggallim/retirement-planner-feedback
                                                  label: needs-triage
                                  ▲
       Daily Claude Code routine ─┘ follows TRIAGE.md: labels, comment,
                                    needs-triage → triaged, one push digest
```

The app never sends anything itself. It only opens a link. The form
receives only what the user types, plus the app version from the link.

Files here:

| File | What it is |
|---|---|
| `Code.gs` | The Apps Script that turns a form response into an issue. No secrets. |
| `TRIAGE.md` | The triage rules the daily routine follows. |
| `README.md` | This guide. Enough to rebuild the whole pipeline. |

Steps 1–5 are done by the owner (they need your Google and GitHub
accounts). Steps 6–7 are done by Claude, or by you by hand.

## 1. Create the private feedback repo

1. GitHub → **New repository** → owner `aggallim`, name
   **`retirement-planner-feedback`**, **Private**. Tick "Add a README" so
   it isn't empty.
2. In the repo, **Issues → Labels**, create these labels (colours are up
   to you): `needs-triage`, `triaged`, `bug`, `idea`, `confusing`,
   `other`, `p1`, `p2`, `p3`, `spam`. Creating them up front means neither
   the script nor the routine depends on labels being created
   automatically.
3. Give Claude access to it: if the Claude GitHub App is installed on
   "Only select repositories", go to
   <https://github.com/apps/claude/installations/select_target> and add
   `retirement-planner-feedback`.

## 2. Create the Google Form

1. <https://forms.google.com> → blank form. Title: e.g. *"UK Retirement
   Planner: feedback"*. Description (suggested): *"Tell us about a
   problem, an idea or something confusing. Only share figures you're
   comfortable with."*
2. **Settings → Responses:** "Collect email addresses" = **Do not
   collect**. Leave "Limit to 1 response" **off** (turning it on forces
   sign-in).
3. Add the questions. The titles must match the constants at the top of
   `Code.gs` **exactly**:

   | # | Title | Type | Required |
   |---|---|---|---|
   | 1 | `Type` | Multiple choice: Bug / Idea / Something confusing / Other | Yes |
   | 2 | `What happened, or what would you like?` | Paragraph | Yes |
   | 3 | `Steps or example figures (optional)` | Paragraph, description: *"only share what you're comfortable with"* | No |
   | 4 | `Email if you'd like a reply (optional)` | Short answer | No |

4. **The hidden app-version field.** Google Forms has no hidden field
   type, so use a second section that nobody is sent to:
   1. Click **Add section** (the "=" icon) below question 4. A
      "Section 2" appears.
   2. In Section 2, add a Short answer question titled **`App version`**,
      not required.
   3. At the bottom of Section 1, set **"After section 1" → "Submit
      form"**.

   Users never see Section 2, but a value pre-filled into it through the
   link is still submitted with the response. The end-to-end test (step
   7) confirms this.
5. **Get the pre-fill link:** ⋮ (top right) → **Get pre-filled link**.
   Go to Section 2, type `v0` in *App version*, click **Get link → Copy
   link**. It looks like:

   ```
   https://docs.google.com/forms/d/e/1FAIpQL.../viewform?usp=pp_url&entry.123456789=v0
   ```

   The part before `?` is the **form URL**. `entry.123456789` is the
   **version field ID**. Send both to Claude (they aren't secret: anyone
   using the app sees the link).
6. Optional but recommended: **Responses → Link to Sheets**, so you can
   read every response, including reply emails and anything over the
   daily cap, in a spreadsheet.

## 3. Create the GitHub token

GitHub → **Settings → Developer settings → Personal access tokens →
Fine-grained tokens → Generate new token**:

- **Name:** `retirement-planner-feedback form`
- **Expiration:** Custom, **1 year** from today. Put a reminder in your
  calendar a week before (see "Renewing the token").
- **Resource owner:** `aggallim`
- **Repository access:** Only select repositories →
  **`retirement-planner-feedback`** only.
- **Permissions → Repository → Issues: Read and write.** Nothing else
  (Metadata: read-only is added automatically).

Copy the token (`github_pat_...`). It goes only into the script's
properties in the next step: never into the app, the site, either repo,
or a chat message.

## 4. Add the Apps Script

1. In the form: ⋮ → **Apps Script**. A project bound to the form opens.
2. Replace the contents of `Code.gs` with this folder's `Code.gs`. Save.
3. **Project Settings** (gear icon) → **Script properties → Add script
   property**: name `GITHUB_TOKEN`, value the token from step 3. Save.
4. **Triggers** (clock icon) → **Add Trigger**: function
   `onFormSubmit`, event source **From form**, event type **On form
   submit**, failure notifications **Notify me immediately**. Save, and
   approve the permissions Google asks for (it needs to read the form's
   responses and call an external URL).

## 5. Send the pre-fill link to Claude

Send the form URL and version field ID from step 2.5. Claude sets
`FEEDBACK_FORM_URL` and `FEEDBACK_VERSION_FIELD` in `index.html`. Until
then, both "Send feedback" links stay hidden in the app.

## 6. Create the daily triage routine

A Claude Code routine (scheduled trigger) on the owner's Claude
subscription (no API key):

- **Schedule:** daily at 07:00 UK time. Routines use UTC cron, so
  `0 6 * * *` is 07:00 in summer (BST) and 06:00 in winter (GMT). Change
  it to `0 7 * * *` in October and back again in March if the hour
  matters to you.
- **Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`).
- **Each run starts a fresh session.**
- **Environment:** has both `aggallim/retirement-planner` (to read
  `TRIAGE.md`) and `aggallim/retirement-planner-feedback` available.
- **Prompt:**

  > Follow the instructions in `tools/feedback/TRIAGE.md` in the
  > `aggallim/retirement-planner` repository (on `main`) to triage new
  > issues in `aggallim/retirement-planner-feedback`.

## 7. End-to-end test

1. Open the live app → ⚙ Data → **Send feedback**. Check the form opens
   in a new tab and Section 2 isn't shown.
2. Submit a test (Type: Other; description "Pipeline test"; any email).
3. Within a minute, an issue appears in the feedback repo labelled
   `needs-triage`. Check it shows the right **App version** and has **no
   email address** in it.
4. Run the routine once by hand. The issue should get a type and priority
   label and a triage comment, `needs-triage` should be replaced by
   `triaged`, and one push notification should arrive. Run it again: it
   should do nothing and send nothing.

## Daily cap

The script creates at most **20 issues per UK calendar day** (a spam
cap). Once the cap is reached, submissions are still saved in the form's
responses (and linked Sheet) but no issue is created. Every submission
that reaches the script uses a slot, including one whose GitHub call
then fails, so the cap errs on the side of fewer issues. The count is
stored in the script's properties (`capDate`, `capCount`). Delete those
two properties to reset it early.

## Renewing the token (yearly)

About a week before it expires, go to GitHub → Settings → Developer
settings → Fine-grained tokens → the token → **Regenerate token**, keep
the same settings with a new 1-year expiry, and paste the new value into
the script's `GITHUB_TOKEN` property. If it does expire first, the script
fails on each submission and Google emails you a failure notice. The
responses are safe in the form, but they won't become issues until you
renew the token.

## Troubleshooting

- **No issue created:** Apps Script → **Executions** shows each run and
  its error. A 401 means the token is wrong or expired. A 404 means the
  token can't see the repo. A 422 usually means a label name doesn't
  exist.
- **Version shows "unknown":** the `App version` title doesn't match
  `Q_VERSION` in `Code.gs`, or `FEEDBACK_VERSION_FIELD` in `index.html`
  isn't that question's `entry.` ID.
- **You renamed a question:** update the matching `Q_...` constant in
  `Code.gs` (and in this repo's copy).
