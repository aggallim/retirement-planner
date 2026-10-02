// Tests for the MCP server Worker (intent 055). Dependency-free:
//   node tests/test-mcp-worker.mjs
// Exercises the Worker's fetch handler directly with Request objects, and
// checks that its copy of the engine matches index.html.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildEngineSource, OUTPUT } from '../tools/mcp/build-engine.mjs';
import worker, { TOOLS, PROTOCOL_VERSIONS } from '../tools/mcp/worker/src/index.js';

let pass = 0;
let fail = 0;
async function check(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`✓ ${name}`);
  } catch (e) {
    fail++;
    console.log(`✗ ${name}\n  ${e.message}`);
  }
}
const rpc = async (body, method = 'POST') => {
  const res = await worker.fetch(new Request('https://mcp.test/mcp', { method, headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: method === 'POST' ? JSON.stringify(body) : undefined }));
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
};
const call = (name, args, id = 1) => rpc({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
const person = (o = {}) => ({
  name: 'Secret Name', currentAge: 40, retirementAge: 65, lifeExpectancy: 90, statePensionAge: 67, statePensionAmount: 12548,
  cashIsaBalance: 0, cashIsaContribution: 0, cashIsaGrowth: 2, ssIsaBalance: 50000, ssIsaContribution: 500, ssIsaGrowth: 5,
  lisaBalance: 0, lisaContribution: 0, lisaGrowth: 5, otherSavings: [], pensionPot: 150000, pensionContribution: 500,
  employerContribution: 300, pensionGrowth: 6, takeLumpSum: true, inheritanceAmount: 0, inheritanceAge: 70, ...o
});
const PLAN = { schemaVersion: 1, hasPartner: false, person1: person(), person2: person(), annualExpenses: 30000, healthcareCosts: 1000, mortgagePayment: 0, mortgageYears: 0, mortgageRate: 4.5, inflationRate: 3, withdrawalRate: 4 };

await check('The generated engine copy matches index.html and llms-full.txt', () => {
  assert.equal(readFileSync(OUTPUT, 'utf8'), buildEngineSource(), 'Run: node tools/mcp/build-engine.mjs');
});
await check('initialize negotiates the protocol version and advertises tools', async () => {
  const r = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
  assert.equal(r.status, 200);
  assert.equal(r.body.result.protocolVersion, '2025-06-18');
  assert.ok(r.body.result.capabilities.tools);
  const old = await rpc({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } });
  assert.equal(old.body.result.protocolVersion, PROTOCOL_VERSIONS[0]);
});
await check('Notifications get 202 with no body; ping answers', async () => {
  const n = await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(n.status, 202);
  assert.equal(n.body, null);
  const p = await rpc({ jsonrpc: '2.0', id: 3, method: 'ping' });
  assert.deepEqual(p.body.result, {});
});
await check('tools/list returns the five tools with input schemas and read-only hints', async () => {
  const r = await rpc({ jsonrpc: '2.0', id: 4, method: 'tools/list' });
  const names = r.body.result.tools.map((t) => t.name);
  assert.deepEqual(names, ['project_retirement_plan', 'what_if', 'what_matters_most', 'get_methodology', 'get_uk_reference_figures']);
  TOOLS.forEach((t) => {
    assert.equal(t.inputSchema.type, 'object');
    assert.equal(t.annotations.readOnlyHint, true);
  });
});
await check('project_retirement_plan returns a verdict, figures and the disclaimer', async () => {
  const r = await call('project_retirement_plan', { plan: PLAN, include_yearly: true });
  const s = r.body.result.structuredContent;
  assert.equal(r.body.result.isError, false);
  assert.ok(['on_track', 'needs_attention'].includes(s.verdict));
  assert.ok(s.pot_at_retirement.amount > 0);
  assert.ok(s.first_year_income_after_tax.todays_money > 0);
  assert.ok(s.yearly.length > 20);
  assert.match(r.body.result.content[0].text, /Not financial advice/);
  assert.ok(!JSON.stringify(r.body).includes('Secret Name'), 'names are never echoed');
});
await check('what_if returns both plans, and more spending never leaves more money', async () => {
  const r = await call('what_if', { plan: PLAN, changes: { spendPct: 20 } });
  const s = r.body.result.structuredContent;
  assert.ok(s.with_changes.money_left_at_plan_end_todays_money <= s.current_plan.money_left_at_plan_end_todays_money);
  const bad = await call('what_if', { plan: PLAN, changes: { spendPct: 'lots' } });
  assert.equal(bad.body.result.isError, true);
});
await check('what_matters_most ranks nine sensitivities', async () => {
  const r = await call('what_matters_most', { plan: PLAN });
  assert.equal(r.body.result.structuredContent.sensitivities.length, 9);
});
await check('Reference and methodology tools answer', async () => {
  const ref = await call('get_uk_reference_figures', {});
  assert.equal(ref.body.result.structuredContent.incomeTax.personalAllowance, 12570);
  const m = await call('get_methodology', {});
  assert.match(m.body.result.content[0].text, /Income Tax/);
});
await check('Bad input is a tool error, an unknown tool or method is a JSON-RPC error', async () => {
  const missing = await call('project_retirement_plan', { plan: { person1: { currentAge: 'x' } } });
  assert.equal(missing.body.result.isError, true);
  const unknown = await call('nope', {});
  assert.equal(unknown.body.error.code, -32602);
  const method = await rpc({ jsonrpc: '2.0', id: 9, method: 'resources/list' });
  assert.equal(method.body.error.code, -32601);
});
await check('Batches, parse errors, GET and CORS', async () => {
  const b = await rpc([{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', method: 'notifications/initialized' }, { jsonrpc: '2.0', id: 2, method: 'tools/list' }]);
  assert.equal(b.body.length, 2);
  const res = await worker.fetch(new Request('https://mcp.test/mcp', { method: 'POST', body: '{nope' }));
  assert.equal(res.status, 400);
  const get = await rpc(null, 'GET');
  assert.equal(get.status, 405);
  const opt = await worker.fetch(new Request('https://mcp.test/mcp', { method: 'OPTIONS' }));
  assert.equal(opt.headers.get('Access-Control-Allow-Origin'), '*');
  const health = await worker.fetch(new Request('https://mcp.test/health'));
  assert.equal(await health.text(), 'ok');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
