/**
 * Retirement Planner feedback → private GitHub issue (intent/026).
 *
 * Paste into the Google Form's Apps Script project (Form → ⋮ → Apps Script)
 * and add an installable "On form submit" trigger for onFormSubmit. Full
 * setup: tools/feedback/README.md.
 *
 * No secrets live in this file. The GitHub token is read from Script
 * Properties (Project Settings → Script properties → GITHUB_TOKEN).
 *
 * Privacy: the reply-email answer is never copied into the issue. It stays
 * only in the form's own responses.
 */

const FEEDBACK_REPO = 'aggallim/retirement-planner-feedback';
const DAILY_ISSUE_CAP = 20;
const TITLE_SNIPPET_LENGTH = 60;
const TIME_ZONE = 'Europe/London';

// Question titles exactly as they appear on the form. If you reword a
// question on the form, update it here too.
const Q_TYPE = 'Type';
const Q_DESCRIPTION = 'What happened, or what would you like?';
const Q_STEPS = 'Steps or example figures (optional)';
const Q_EMAIL = "Email if you'd like a reply (optional)";
const Q_VERSION = 'App version';

function onFormSubmit(e) {
  const answers = {};
  e.response.getItemResponses().forEach((r) => {
    answers[r.getItem().getTitle()] = String(r.getResponse() || '').trim();
  });

  if (!reserveDailySlot_()) {
    console.log('Daily cap of ' + DAILY_ISSUE_CAP + ' issues reached; submission kept in form responses only.');
    return;
  }

  const type = answers[Q_TYPE] || 'Other';
  const description = answers[Q_DESCRIPTION] || '';
  const steps = answers[Q_STEPS] || '';
  const version = answers[Q_VERSION] || 'unknown';
  // answers[Q_EMAIL] is deliberately not used.

  const snippet = description.replace(/\s+/g, ' ').slice(0, TITLE_SNIPPET_LENGTH);
  const title = '[' + type + '] ' + snippet + (description.length > TITLE_SNIPPET_LENGTH ? '…' : '');
  const body = [
    '**Type:** ' + type,
    '**App version:** ' + version,
    '**Submitted:** ' + Utilities.formatDate(e.response.getTimestamp(), TIME_ZONE, 'yyyy-MM-dd HH:mm') + ' (UK)',
    '',
    '### What happened, or what would you like?',
    '',
    description || '_(empty)_',
    '',
    '### Steps or example figures',
    '',
    steps || '_(none given)_',
    '',
    '---',
    '_Created from the feedback form. The reply email, if any, is only in the form responses._'
  ].join('\n');

  createIssue_(title, body);
}

// Counts issues created today (UK date). Returns false once the cap is hit.
// Held under a script lock so two simultaneous submissions can't both take
// the last slot.
function reserveDailySlot_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
    const count = props.getProperty('capDate') === today ? Number(props.getProperty('capCount') || 0) : 0;
    if (count >= DAILY_ISSUE_CAP) return false;
    props.setProperties({ capDate: today, capCount: String(count + 1) });
    return true;
  } finally {
    lock.releaseLock();
  }
}

function createIssue_(title, body) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN script property is not set.');
  const res = UrlFetchApp.fetch('https://api.github.com/repos/' + FEEDBACK_REPO + '/issues', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: JSON.stringify({ title: title, body: body, labels: ['needs-triage'] }),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code !== 201) {
    // Throwing makes Apps Script email the owner a failure notice. The
    // submission itself is safe in the form responses either way.
    throw new Error('GitHub issue creation failed (' + code + '): ' + res.getContentText().slice(0, 500));
  }
}
