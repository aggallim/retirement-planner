// Feedback relay address (intent/026). Shared by index.html, which only
// shows its "Send feedback" links when this is set, and feedback.html,
// which posts to it. The Worker's URL is printed by the "Deploy feedback
// Worker" GitHub Actions run. Setup: tools/feedback/README.md.
window.FEEDBACK_ENDPOINT = 'https://retirement-planner-feedback.aggallim.workers.dev';

// Privacy contact (intent 060). A role address for data requests, shown on
// privacy.html when set. Empty = the notice points to the feedback form's
// "Privacy or data request" option instead.
window.PRIVACY_CONTACT_EMAIL = '';
