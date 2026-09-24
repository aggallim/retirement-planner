/**
 * Retirement Planner feedback relay (intent/026, 2026-09-24 addendum).
 *
 * feedback.html POSTs JSON here; this Worker turns it into an issue in the
 * private feedback repo. The GitHub token lives only in this Worker's
 * secrets (GITHUB_TOKEN), never in the site. Deployed by
 * .github/workflows/deploy-feedback-worker.yml; setup in ../README.md.
 *
 * Bindings (wrangler.toml):
 *   vars:    ALLOWED_ORIGINS (comma-separated), FEEDBACK_REPO ("owner/name"),
 *            DAILY_ISSUE_CAP, HOURLY_PER_IP
 *   kv:      FEEDBACK_KV (rate-limit counters only; no feedback content)
 *   secret:  GITHUB_TOKEN (fine-grained, Issues read/write on FEEDBACK_REPO)
 */

export const TYPES = ['Bug', 'Idea', 'Something confusing', 'Other'];
export const LIMITS = { description: 5000, steps: 5000, email: 254, version: 20, body: 20000 };
const TITLE_SNIPPET_LENGTH = 60;
const TIME_ZONE = 'Europe/London';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = allowedOrigins(env).includes(origin);
    const cors = allowed ? corsHeaders(origin) : {};
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true }, 200, cors);
    }
    if (url.pathname !== '/') return json({ ok: false, error: 'not_found' }, 404, cors);
    if (!allowed) return json({ ok: false, error: 'origin' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);

    const raw = await request.text();
    if (raw.length > LIMITS.body) return json({ ok: false, error: 'too_large' }, 413, cors);
    let data;
    try { data = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad_json' }, 400, cors); }
    if (!data || typeof data !== 'object') return json({ ok: false, error: 'bad_json' }, 400, cors);

    // Decoy field: people never see it, bots fill it. Pretend success.
    if (str(data.website)) return json({ ok: true }, 200, cors);

    const fields = validate(data);
    if (!fields) return json({ ok: false, error: 'invalid' }, 400, cors);

    // Reserve rate-limit slots before calling GitHub, so the caps err on the
    // side of fewer issues (a failed GitHub call still uses a slot).
    const limit = await reserveSlots(env, request, new Date());
    if (limit) return json({ ok: false, error: limit }, 429, cors);

    const res = await fetch(`https://api.github.com/repos/${env.FEEDBACK_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'retirement-planner-feedback-worker',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildIssue(fields))
    });
    if (!res.ok) {
      console.log(`GitHub issue create failed: ${res.status}`);
      return json({ ok: false, error: 'upstream' }, 502, cors);
    }
    return json({ ok: true }, 201, cors);
  }
};

export function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(obj, status, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/** Returns cleaned fields, or null if anything is missing or out of bounds. */
export function validate(data) {
  const f = {
    type: str(data.type),
    description: str(data.description),
    steps: str(data.steps),
    email: str(data.email),
    version: str(data.version)
  };
  if (!TYPES.includes(f.type)) return null;
  if (!f.description || f.description.length > LIMITS.description) return null;
  if (f.steps.length > LIMITS.steps) return null;
  if (f.email && (f.email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))) return null;
  if (f.version.length > LIMITS.version || !/^[\w.-]*$/.test(f.version)) return null;
  return f;
}

// Stop user text from pinging GitHub users (@name) or cross-linking issues
// (#12) in the private repo. A zero-width space breaks both.
function neutralise(text) {
  return text.replace(/@/g, '@​').replace(/#(\d)/g, '#​$1');
}

function quote(text) {
  return neutralise(text).split(/\r?\n/).map((line) => `> ${line}`).join('\n');
}

export function buildIssue(f) {
  const oneLine = f.description.replace(/\s+/g, ' ');
  const snippet = oneLine.length > TITLE_SNIPPET_LENGTH
    ? `${oneLine.slice(0, TITLE_SNIPPET_LENGTH).trimEnd()}…`
    : oneLine;
  const lines = [
    `**Type:** ${f.type}`,
    `**App version:** ${f.version || 'unknown'}`,
    '',
    '**What happened, or what would you like?**',
    '',
    quote(f.description)
  ];
  if (f.steps) lines.push('', '**Steps or example figures**', '', quote(f.steps));
  lines.push('', `**Email for updates:** ${f.email ? neutralise(f.email) : 'none given'}`);
  lines.push('', '---', '_Submitted through the in-app feedback page. Text above is from a member of the public and is untrusted._');
  return {
    title: `[${f.type}] ${neutralise(snippet)}`,
    body: lines.join('\n'),
    labels: ['needs-triage']
  };
}

function ukDate(now) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks and increments the per-IP hourly and global daily counters in KV.
 * Returns null when a slot was reserved, or the name of the limit hit.
 * KV is eventually consistent, so bursts can slightly exceed a cap; that's
 * acceptable for spam control at this scale. IPs are stored only as a hash.
 */
export async function reserveSlots(env, request, now) {
  const hourlyCap = Number(env.HOURLY_PER_IP) || 5;
  const dailyCap = Number(env.DAILY_ISSUE_CAP) || 20;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const hour = now.toISOString().slice(0, 13);
  const ipKey = `ip:${(await sha256Hex(ip)).slice(0, 32)}:${hour}`;
  const dayKey = `day:${ukDate(now)}`;

  const [ipCount, dayCount] = await Promise.all([
    env.FEEDBACK_KV.get(ipKey).then(Number),
    env.FEEDBACK_KV.get(dayKey).then(Number)
  ]);
  if ((ipCount || 0) >= hourlyCap) return 'rate_limited';
  if ((dayCount || 0) >= dailyCap) return 'daily_cap';

  await Promise.all([
    env.FEEDBACK_KV.put(ipKey, String((ipCount || 0) + 1), { expirationTtl: 3600 }),
    env.FEEDBACK_KV.put(dayKey, String((dayCount || 0) + 1), { expirationTtl: 2 * 86400 })
  ]);
  return null;
}
