// MCP server for the UK Retirement Planner (intent 055).
//
// Streamable HTTP transport, JSON responses only: clients POST JSON-RPC 2.0
// messages to /mcp and get one JSON response back. No sessions, no SSE
// stream, no storage: every call is self-contained, and plan data is never
// logged or kept. The engine is the app's own (engine.generated.js, copied
// from index.html by ../../build-engine.mjs).
import {
  CURRENT_YEAR, UK_REFERENCE, METHODOLOGY, planSummary, planToEngineArgs, applyWhatIf, sensitivityAnalysis, deflate
} from './engine.generated.js';

export const SERVER_INFO = { name: 'uk-retirement-planner', title: 'UK Retirement Planner', version: '1.0.0' };
export const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const APP_URL = 'https://aggallim.github.io/retirement-planner/';
const DISCLAIMER = 'Illustrative projection under the supplied assumptions, using 2026/27 UK figures. Not financial advice.';

const INSTRUCTIONS = `Calculation tools for the UK Retirement Planner (${APP_URL}). Pass a plan in the app's Export format (or the JSON block from the app's "Share with your AI assistant" text). Every figure is an illustrative projection under the plan's own assumptions, not a forecast or financial advice. When discussing results, explain what drives them and suggest a regulated financial adviser for personal recommendations.`;

const PLAN_SCHEMA = {
  type: 'object',
  description: "A retirement plan in the UK Retirement Planner's Export format: { hasPartner, person1, person2, annualExpenses, healthcareCosts, mortgagePayment, mortgageYears, mortgageRate, inflationRate, withdrawalRate, ... }. Each person has currentAge, retirementAge, lifeExpectancy, pensionPot, pensionContribution, employerContribution, pensionGrowth, cashIsaBalance/Contribution/Growth, ssIsaBalance/Contribution/Growth, lisaBalance/Contribution/Growth, otherSavings[], statePensionAge, statePensionAmount, takeLumpSum, and optional DB pension and inheritance fields. Money is GBP; contributions are monthly; spending and pensions are annual in today's money.",
  properties: { person1: { type: 'object' } },
  required: ['person1']
};
const CHANGES_SCHEMA = {
  type: 'object',
  description: 'Hypothetical changes, all optional: retireDelta (years, both people), spendPct (% change to annual spending), growthDelta (percentage points on every account), extraPension (£/month more into each pension), lifeDelta (years), inflationDelta (percentage points).',
  properties: {
    retireDelta: { type: 'number' }, spendPct: { type: 'number' }, growthDelta: { type: 'number' },
    extraPension: { type: 'number' }, lifeDelta: { type: 'number' }, inflationDelta: { type: 'number' }
  }
};

export const TOOLS = [
  {
    name: 'project_retirement_plan',
    title: 'Project a retirement plan',
    description: `Runs the UK Retirement Planner's year-by-year projection for a plan: whether the money lasts to the plan end, the pot at retirement, first-year sustainable income after Income Tax (future pounds and today's money), the Pensions UK Retirement Living Standard, money left at the end and estimated lifetime tax. Set include_yearly for a year-by-year table. ${DISCLAIMER}`,
    inputSchema: {
      type: 'object',
      properties: {
        plan: PLAN_SCHEMA,
        include_yearly: { type: 'boolean', description: 'Include one row per year (default false).' },
        advanced: { type: 'boolean', description: 'Apply Advanced-mode inputs such as spending phases, downsizing and extra DB pensions (default true).' }
      },
      required: ['plan']
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'what_if',
    title: 'Compare a plan with hypothetical changes',
    description: `Runs a plan twice, as it is and with hypothetical changes (retirement age, spending, growth, extra pension contributions, life expectancy, inflation), and returns both results side by side. Describes the model's response only. ${DISCLAIMER}`,
    inputSchema: { type: 'object', properties: { plan: PLAN_SCHEMA, changes: CHANGES_SCHEMA }, required: ['plan', 'changes'] },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'what_matters_most',
    title: 'Rank what the projection depends on',
    description: `Applies nine standard one-at-a-time changes to a plan and ranks them by their effect on money left at the plan end (today's money). These are sensitivities, not recommendations. ${DISCLAIMER}`,
    inputSchema: { type: 'object', properties: { plan: PLAN_SCHEMA }, required: ['plan'] },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'get_methodology',
    title: 'How the planner calculates',
    description: 'Returns the full methodology of the UK Retirement Planner: inputs, the projection steps, Income Tax, headline results and known limitations, with sources.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'get_uk_reference_figures',
    title: 'UK reference figures',
    description: 'Returns every dated UK figure the planner uses (Income Tax bands, State Pension, allowances, Retirement Living Standards, life expectancy), with the GOV.UK or other source for each.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false }
  }
];

class ToolInputError extends Error {}
const round = (v) => Math.round(v);
const today = (v) => Math.round(v / 100) * 100;

function engineArgsFor(plan, advanced = true) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw new ToolInputError('plan must be an object in the app\'s Export format.');
  const p1 = plan.person1;
  if (!p1 || typeof p1 !== 'object') throw new ToolInputError('plan.person1 is required.');
  for (const k of ['currentAge', 'retirementAge', 'lifeExpectancy']) {
    if (typeof p1[k] !== 'number') throw new ToolInputError(`plan.person1.${k} must be a number.`);
  }
  if (!(p1.retirementAge > p1.currentAge)) throw new ToolInputError('plan.person1.retirementAge must be after currentAge.');
  if (p1.lifeExpectancy > 120 || p1.currentAge < 16) throw new ToolInputError('Ages are out of range.');
  return planToEngineArgs(plan, advanced !== false);
}

function summaryJson(s) {
  const h = s.household;
  return {
    verdict: s.succeeds ? 'on_track' : 'needs_attention',
    money_lasts: s.succeeds ? `beyond plan end (${s.planEnd})` : `until ${s.fundedTo}`,
    first_retirement_year: s.firstRet,
    plan_end_year: s.planEnd,
    runs_out_year: s.depleted && s.depleted <= s.planEnd ? s.depleted : null,
    pot_at_retirement: { year: h.year, amount: h.totalPot },
    first_year_income_after_tax: {
      year: h.year,
      nominal: h.annualIncome,
      todays_money: today(s.annualIncomeToday),
      breakdown: { pension: h.pensionIncome, savings: h.savingsIncome, state_pension: h.statePension, db_pension: h.dbPension, income_tax: -h.incomeTax }
    },
    living_standard: s.livingStandard,
    money_left_at_plan_end_todays_money: today(s.endWealthToday),
    lifetime_income_tax: { nominal: round(s.lifetimeTax.nominal), todays_money: today(s.lifetimeTax.today) }
  };
}

const gbp = (v) => `£${Math.round(v).toLocaleString('en-GB')}`;
function summaryText(j) {
  return [
    `Verdict: ${j.verdict === 'on_track' ? 'on track' : 'needs attention'}; the money lasts ${j.money_lasts}.`,
    `Pot when retired (${j.pot_at_retirement.year}): ${gbp(j.pot_at_retirement.amount)}.`,
    `First-year income after tax: ${gbp(j.first_year_income_after_tax.nominal)} (about ${gbp(j.first_year_income_after_tax.todays_money)} in today's money); Living Standard: ${j.living_standard}.`,
    `Left at plan end (${j.plan_end_year}): about ${gbp(j.money_left_at_plan_end_todays_money)} in today's money. Lifetime Income Tax: ${gbp(j.lifetime_income_tax.nominal)}.`,
    DISCLAIMER
  ].join('\n');
}

function result(text, structured) {
  return { content: [{ type: 'text', text: structured ? `${text}\n\n${JSON.stringify(structured, null, 2)}` : text }], ...(structured ? { structuredContent: structured } : {}), isError: false };
}

export function callTool(name, args = {}) {
  switch (name) {
    case 'project_retirement_plan': {
      const ea = engineArgsFor(args.plan, args.advanced);
      const s = planSummary(ea);
      const out = { ...summaryJson(s), disclaimer: DISCLAIMER };
      if (args.include_yearly) {
        out.yearly = s.projections.filter((r) => r.year <= s.planEnd).map((r) => ({
          year: r.year, person1_age: r.person1Age, person2_age: r.person2Age, spending: r.targetExpenses,
          state_pension: r.statePension, db_pension: r.dbPension, pension_withdrawal: r.pensionWithdrawal,
          savings_withdrawal: r.isaWithdrawal + r.otherSavingsWithdrawal, earnings: r.workIncome || 0, income_tax: r.incomeTax,
          pensions: r.totalPension, isas: r.totalIsa, other_savings: r.totalOtherSavings,
          total_savings_todays_money: today(deflate(r.totalPension + r.totalIsa + r.totalOtherSavings, r.year, ea.inflationRate))
        }));
      }
      return result(summaryText(out), out);
    }
    case 'what_if': {
      const ea = engineArgsFor(args.plan, true);
      const changes = args.changes && typeof args.changes === 'object' ? args.changes : {};
      for (const [k, v] of Object.entries(changes)) {
        if (typeof v !== 'number' || !isFinite(v)) throw new ToolInputError(`changes.${k} must be a number.`);
      }
      const base = summaryJson(planSummary(ea));
      const alt = summaryJson(planSummary(applyWhatIf(ea, changes)));
      const out = { changes, current_plan: base, with_changes: alt, disclaimer: DISCLAIMER };
      return result(`Current plan:\n${summaryText(base)}\n\nWith the changes:\n${summaryText(alt)}`, out);
    }
    case 'what_matters_most': {
      const ea = engineArgsFor(args.plan, true);
      const base = planSummary(ea);
      const rows = sensitivityAnalysis(ea, base).map((r) => ({
        change: r.label,
        money_left_at_end_change_todays_money: today(r.endWealthTodayChange),
        money_lasts_change_years: r.fundedToChange,
        plan_still_lasts: r.succeeds
      }));
      const out = { plan_end_year: base.planEnd, sensitivities: rows, note: 'One change at a time; not recommendations.', disclaimer: DISCLAIMER };
      const text = rows.map((r) => `${r.change}: ${r.money_left_at_end_change_todays_money >= 0 ? '+' : '−'}${gbp(Math.abs(r.money_left_at_end_change_todays_money))} left at the end (today's money)`).join('\n');
      return result(`${text}\n${out.note} ${DISCLAIMER}`, out);
    }
    case 'get_methodology':
      return result(METHODOLOGY);
    case 'get_uk_reference_figures':
      return result(`UK reference figures used by the planner (${UK_REFERENCE.taxYear}, last updated ${UK_REFERENCE.lastUpdated}).`, { reference_year: CURRENT_YEAR, ...UK_REFERENCE });
    default:
      throw Object.assign(new Error(`Unknown tool: ${name}`), { rpcCode: -32602 });
  }
}

function handleMessage(msg) {
  const isRequest = msg && msg.jsonrpc === '2.0' && typeof msg.method === 'string';
  if (!isRequest) return { jsonrpc: '2.0', id: msg && msg.id !== undefined ? msg.id : null, error: { code: -32600, message: 'Invalid Request' } };
  const isNotification = msg.id === undefined;
  const reply = (body) => (isNotification ? null : { jsonrpc: '2.0', id: msg.id, ...body });
  try {
    switch (msg.method) {
      case 'initialize': {
        const requested = msg.params && msg.params.protocolVersion;
        return reply({ result: {
          protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS
        } });
      }
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return null;
      case 'ping':
        return reply({ result: {} });
      case 'tools/list':
        return reply({ result: { tools: TOOLS } });
      case 'tools/call': {
        const name = msg.params && msg.params.name;
        try {
          return reply({ result: callTool(name, (msg.params && msg.params.arguments) || {}) });
        } catch (e) {
          if (e instanceof ToolInputError) return reply({ result: { content: [{ type: 'text', text: `Input error: ${e.message}` }], isError: true } });
          if (e.rpcCode) return reply({ error: { code: e.rpcCode, message: e.message } });
          return reply({ result: { content: [{ type: 'text', text: 'The projection could not be calculated for this plan.' }], isError: true } });
        }
      }
      default:
        return reply({ error: { code: -32601, message: `Method not found: ${msg.method}` } });
    }
  } catch (e) {
    return reply({ error: { code: -32603, message: 'Internal error' } });
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id'
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
const MAX_BODY = 256 * 1024;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/health') return new Response('ok', { headers: CORS });
    if (url.pathname === '/' && request.method === 'GET') {
      return json({ ...SERVER_INFO, mcp_endpoint: `${url.origin}/mcp`, transport: 'streamable-http (JSON responses, stateless)', docs: 'https://github.com/aggallim/retirement-planner/blob/main/tools/mcp/README.md', app: APP_URL });
    }
    if (url.pathname !== '/mcp') return json({ error: 'Not found' }, 404);
    if (request.method === 'GET' || request.method === 'DELETE') {
      // No server-initiated stream and no sessions to end.
      return new Response(null, { status: 405, headers: { Allow: 'POST', ...CORS } });
    }
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST', ...CORS } });
    const text = await request.text();
    if (text.length > MAX_BODY) return json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Request too large' } }, 413);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
    }
    const messages = Array.isArray(body) ? body : [body];
    const replies = messages.map(handleMessage).filter(Boolean);
    if (!replies.length) return new Response(null, { status: 202, headers: CORS });
    return json(Array.isArray(body) ? replies : replies[0]);
  }
};
