// Dependency-free tests for the feedback Worker (intent/026).
// Run from the repo root: node tests/test-feedback-worker.mjs
import assert from 'node:assert/strict';
import worker, { buildIssue, validate } from '../tools/feedback/worker/src/index.js';

let pass = 0;
let fail = 0;
async function check(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${name}\n    ${e.message}`);
  }
}

const ORIGIN = 'https://aggallim.github.io';

function makeEnv() {
  const store = new Map();
  return {
    ALLOWED_ORIGINS: `${ORIGIN}, https://example.test`,
    FEEDBACK_REPO: 'owner/feedback',
    DAILY_ISSUE_CAP: '20',
    HOURLY_PER_IP: '5',
    GITHUB_TOKEN: 'test-token',
    FEEDBACK_KV: {
      store,
      async get(k) { return store.has(k) ? store.get(k) : null; },
      async put(k, v) { store.set(k, v); }
    }
  };
}

// Stub global fetch (the Worker's call to GitHub) and record what it sent.
let githubCalls = [];
let githubStatus = 201;
globalThis.fetch = async (url, init) => {
  githubCalls.push({ url, init, body: JSON.parse(init.body) });
  return new Response('{}', { status: githubStatus });
};

const good = {
  type: 'Bug',
  description: 'The chart is wrong @someone see #3',
  steps: 'Age 55\nPot £100k',
  email: 'me@example.com',
  version: 'v16',
  website: ''
};

function post(body, { origin = ORIGIN, ip = '1.2.3.4', raw } = {}) {
  return new Request('https://worker.test/', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: raw !== undefined ? raw : JSON.stringify(body)
  });
}

console.log('Feedback Worker');

await check('valid submission creates one needs-triage issue in the configured repo', async () => {
  githubCalls = [];
  const res = await worker.fetch(post(good), makeEnv());
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.equal(githubCalls.length, 1);
  assert.equal(githubCalls[0].url, 'https://api.github.com/repos/owner/feedback/issues');
  assert.equal(githubCalls[0].init.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(githubCalls[0].body.labels, ['needs-triage']);
});

await check('issue body carries type, version, text, steps and email; mentions and #refs are neutralised', async () => {
  const issue = buildIssue(validate(good));
  assert.match(issue.title, /^\[Bug\] The chart is wrong/);
  assert.match(issue.body, /\*\*Type:\*\* Bug/);
  assert.match(issue.body, /\*\*App version:\*\* v16/);
  assert.match(issue.body, /> Age 55\n> Pot £100k/);
  assert.match(issue.body, /\*\*Email for updates:\*\* me@​example\.com/);
  assert.ok(!/@someone/.test(issue.body), 'raw @mention left in body');
  assert.ok(!/#3/.test(issue.body), 'raw #ref left in body');
});

await check('no email → "none given"; long description → truncated title', async () => {
  const issue = buildIssue(validate({ ...good, email: '', description: 'x'.repeat(100) }));
  assert.match(issue.body, /\*\*Email for updates:\*\* none given/);
  assert.ok(issue.title.endsWith('…'));
  assert.ok(issue.title.length < 80);
});

await check('disallowed origin is refused without calling GitHub', async () => {
  githubCalls = [];
  const res = await worker.fetch(post(good, { origin: 'https://evil.test' }), makeEnv());
  assert.equal(res.status, 403);
  assert.equal(githubCalls.length, 0);
});

await check('CORS preflight from an allowed origin succeeds', async () => {
  const req = new Request('https://worker.test/', { method: 'OPTIONS', headers: { Origin: ORIGIN } });
  const res = await worker.fetch(req, makeEnv());
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.match(res.headers.get('Access-Control-Allow-Methods'), /POST/);
});

await check('filled decoy field reports success but creates nothing', async () => {
  githubCalls = [];
  const res = await worker.fetch(post({ ...good, website: 'http://spam' }), makeEnv());
  assert.equal(res.status, 200);
  assert.equal(githubCalls.length, 0);
});

await check('invalid input is rejected: bad type, empty or oversized description, bad email, bad version, bad JSON', async () => {
  const env = makeEnv();
  for (const body of [
    { ...good, type: 'Hack' },
    { ...good, description: '   ' },
    { ...good, description: 'x'.repeat(5001) },
    { ...good, email: 'not-an-email' },
    { ...good, version: '<script>' }
  ]) {
    assert.equal((await worker.fetch(post(body), env)).status, 400, JSON.stringify(body).slice(0, 60));
  }
  assert.equal((await worker.fetch(post(null, { raw: '{nope' }), env)).status, 400);
  assert.equal((await worker.fetch(post(null, { raw: 'x'.repeat(20001) }), env)).status, 413);
});

await check('6th submission in an hour from one IP is rate-limited', async () => {
  const env = makeEnv();
  githubCalls = [];
  for (let i = 0; i < 5; i++) assert.equal((await worker.fetch(post(good), env)).status, 201);
  assert.equal((await worker.fetch(post(good), env)).status, 429);
  assert.equal(githubCalls.length, 5);
  // A different IP is unaffected.
  assert.equal((await worker.fetch(post(good, { ip: '5.6.7.8' }), env)).status, 201);
});

await check('21st issue in a day is refused (daily cap), whatever the IP', async () => {
  const env = makeEnv();
  githubCalls = [];
  for (let i = 0; i < 20; i++) {
    assert.equal((await worker.fetch(post(good, { ip: `10.0.0.${i}` }), env)).status, 201);
  }
  assert.equal((await worker.fetch(post(good, { ip: '10.0.1.1' }), env)).status, 429);
  assert.equal(githubCalls.length, 20);
});

await check('KV stores only hashed IPs and counters, never feedback text', async () => {
  const env = makeEnv();
  await worker.fetch(post(good), env);
  for (const [k, v] of env.FEEDBACK_KV.store) {
    assert.ok(!k.includes('1.2.3.4'), `raw IP in key ${k}`);
    assert.match(v, /^\d+$/);
  }
});

await check('GitHub failure is reported as 502', async () => {
  githubStatus = 500;
  try {
    assert.equal((await worker.fetch(post(good), makeEnv())).status, 502);
  } finally {
    githubStatus = 201;
  }
});

await check('GET /health answers; other paths and methods are refused', async () => {
  const env = makeEnv();
  assert.equal((await worker.fetch(new Request('https://worker.test/health'), env)).status, 200);
  assert.equal((await worker.fetch(new Request('https://worker.test/x', { method: 'POST' }), env)).status, 404);
  const get = new Request('https://worker.test/', { headers: { Origin: ORIGIN } });
  assert.equal((await worker.fetch(get, env)).status, 405);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
