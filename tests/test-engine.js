// Engine test harness for projectJoint() — spec/001-engine-test-harness.md
//
// Run (from repo root):            node tests/test-engine.js
// Regenerate the individual-mode regression baseline (deliberate, reviewed act):
//                                   node tests/test-engine.js --update-baseline
//
// How this works: projectJoint() (and the CURRENT_YEAR constant it needs) are
// pulled straight out of index.html by searching for two pairs of
// `// ENGINE-EXTRACT-START` / `// ENGINE-EXTRACT-END` marker comments and
// evaluating the extracted text in a Node vm sandbox exposing only `Math`.
// The same spans also carry the UK_REFERENCE figures object and the
// income-tax helpers from spec/018-uk-income-tax.md: taxThresholdsFor(),
// incomeTaxFor(), deflate(), lifetimeTaxTotals() and computeTaxNotes().
// Top-level `const`s (CURRENT_YEAR, UK_REFERENCE, deflate) don't become
// sandbox properties, so loadEngine() re-exports them via `var __X = X;`.
// If projectJoint or CURRENT_YEAR ever move, the markers must move with them —
// this script fails loudly (not silently) if the markers go missing, get
// mismatched, or stop bounding a runnable projectJoint().

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const INDEX_HTML_PATH = path.join(__dirname, '..', 'index.html');
const BASELINE_PATH = path.join(__dirname, 'fixtures', 'individual-baseline.json');
const START = '// ENGINE-EXTRACT-START';
const END = '// ENGINE-EXTRACT-END';

function extractEngineSource(html) {
  const starts = [];
  for (let i = html.indexOf(START); i !== -1; i = html.indexOf(START, i + START.length)) starts.push(i);
  const ends = [];
  for (let i = html.indexOf(END); i !== -1; i = html.indexOf(END, i + END.length)) ends.push(i);

  if (starts.length === 0 || ends.length === 0) {
    throw new Error(`No ENGINE-EXTRACT markers found in index.html (${starts.length} START, ${ends.length} END)`);
  }
  if (starts.length !== ends.length) {
    throw new Error(`Mismatched ENGINE-EXTRACT markers: ${starts.length} START vs ${ends.length} END`);
  }

  const marks = [
    ...starts.map((pos) => ({ pos, type: 'S' })),
    ...ends.map((pos) => ({ pos, type: 'E' }))
  ].sort((a, b) => a.pos - b.pos);

  const spans = [];
  for (let k = 0; k < marks.length; k += 2) {
    const a = marks[k];
    const b = marks[k + 1];
    if (!a || !b || a.type !== 'S' || b.type !== 'E') {
      throw new Error('ENGINE-EXTRACT markers are not correctly paired/ordered (expected alternating START, END, START, END, ...)');
    }
    spans.push(html.slice(a.pos + START.length, b.pos));
  }
  return spans.join('\n');
}

function loadEngine(html) {
  const src = extractEngineSource(html) +
    '\nvar __CURRENT_YEAR = CURRENT_YEAR;\nvar __UK_REFERENCE = UK_REFERENCE;\nvar __deflate = deflate;\n';
  const sandbox = { Math };
  const context = vm.createContext(sandbox);
  new vm.Script(src, { filename: 'index.html (extracted engine)' }).runInContext(context);

  const rawProjectJoint = sandbox.projectJoint;
  const rawMigratePerson = sandbox.migratePerson;
  const rawFindSupportableDelta = sandbox.findSupportableDelta;
  const rawComputePotBreakdown = sandbox.computePotBreakdown;
  const CURRENT_YEAR = sandbox.__CURRENT_YEAR;
  const rawTaxThresholdsFor = sandbox.taxThresholdsFor;
  const rawIncomeTaxFor = sandbox.incomeTaxFor;
  const rawLifetimeTaxTotals = sandbox.lifetimeTaxTotals;
  const rawComputeTaxNotes = sandbox.computeTaxNotes;
  const rawDeflate = sandbox.__deflate;
  const rawUkReference = sandbox.__UK_REFERENCE;

  if (typeof rawProjectJoint !== 'function') {
    throw new Error('Extraction sanity check failed: projectJoint is not a function after eval');
  }
  if (typeof rawMigratePerson !== 'function') {
    throw new Error('Extraction sanity check failed: migratePerson is not a function after eval');
  }
  if (typeof rawFindSupportableDelta !== 'function') {
    throw new Error('Extraction sanity check failed: findSupportableDelta is not a function after eval');
  }
  if (typeof rawComputePotBreakdown !== 'function') {
    throw new Error('Extraction sanity check failed: computePotBreakdown is not a function after eval');
  }
  if (typeof CURRENT_YEAR !== 'number') {
    throw new Error('Extraction sanity check failed: CURRENT_YEAR is not a number after eval');
  }
  for (const [name, fn] of [
    ['taxThresholdsFor', rawTaxThresholdsFor],
    ['incomeTaxFor', rawIncomeTaxFor],
    ['lifetimeTaxTotals', rawLifetimeTaxTotals],
    ['computeTaxNotes', rawComputeTaxNotes],
    ['deflate', rawDeflate]
  ]) {
    if (typeof fn !== 'function') {
      throw new Error(`Extraction sanity check failed: ${name} is not a function after eval`);
    }
  }
  if (!rawUkReference || typeof rawUkReference !== 'object') {
    throw new Error('Extraction sanity check failed: UK_REFERENCE is not an object after eval');
  }
  // The vm context is a separate JS realm, so objects projectJoint builds
  // there have a different Object.prototype than this script's — round-trip
  // through JSON so callers get plain objects that compare equal to fixtures
  // loaded with JSON.parse (deepStrictEqual treats cross-realm objects as
  // unequal even when every property matches).
  const projectJoint = (input) => JSON.parse(JSON.stringify(rawProjectJoint(input)));
  const migratePerson = (input) => {
    const result = rawMigratePerson(input);
    return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
  };
  // findSupportableDelta returns a plain number or null — no cross-realm
  // object identity issue, so no JSON round-trip needed.
  const findSupportableDelta = (engineArgs, currentlySucceeds) => rawFindSupportableDelta(engineArgs, currentlySucceeds);
  // computePotBreakdown returns a plain object of numbers — same no-identity-issue reasoning.
  const computePotBreakdown = (people, projections, bothYear) => rawComputePotBreakdown(people, projections, bothYear);
  // spec/018: object-returning helpers get the same cross-realm JSON round
  // trip; incomeTaxFor and deflate return plain numbers.
  const taxThresholdsFor = (year, inflationRate) => JSON.parse(JSON.stringify(rawTaxThresholdsFor(year, inflationRate)));
  const incomeTaxFor = (taxableIncome, th) => rawIncomeTaxFor(taxableIncome, th);
  const lifetimeTaxTotals = (projections, firstRet, planEnd, inflationRate) =>
    JSON.parse(JSON.stringify(rawLifetimeTaxTotals(projections, firstRet, planEnd, inflationRate)));
  const computeTaxNotes = (projections, people, inflationRate, planEnd) =>
    JSON.parse(JSON.stringify(rawComputeTaxNotes(projections, people, inflationRate, planEnd)));
  const deflate = (nominalValue, targetYear, inflationRate) => rawDeflate(nominalValue, targetYear, inflationRate);
  const UK_REFERENCE = JSON.parse(JSON.stringify(rawUkReference));
  return {
    projectJoint, migratePerson, findSupportableDelta, computePotBreakdown, CURRENT_YEAR,
    taxThresholdsFor, incomeTaxFor, lifetimeTaxTotals, computeTaxNotes, deflate, UK_REFERENCE
  };
}

let projectJoint, migratePerson, findSupportableDelta, computePotBreakdown, CURRENT_YEAR;
let taxThresholdsFor, incomeTaxFor, lifetimeTaxTotals, computeTaxNotes, deflate, UK_REFERENCE;
try {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  ({
    projectJoint, migratePerson, findSupportableDelta, computePotBreakdown, CURRENT_YEAR,
    taxThresholdsFor, incomeTaxFor, lifetimeTaxTotals, computeTaxNotes, deflate, UK_REFERENCE
  } = loadEngine(html));
} catch (err) {
  console.error('FATAL: could not extract a runnable projectJoint() from index.html');
  console.error(err.message);
  process.exit(1);
}

// Test input mirrors makePerson()'s defaults — intentionally hardcoded here,
// not extracted from index.html, since it's test input rather than engine logic.
const DEFAULT_PERSON = {
  name: 'You',
  currentAge: 35,
  retirementAge: 65,
  lifeExpectancy: 95,
  statePensionAge: 67,
  statePensionAmount: 12548,
  cashIsaBalance: 0,
  cashIsaContribution: 0,
  cashIsaGrowth: 2,
  ssIsaBalance: 25000,
  ssIsaContribution: 500,
  ssIsaGrowth: 5,
  lisaBalance: 0,
  lisaContribution: 0,
  lisaGrowth: 5,
  otherSavings: [],
  pensionPot: 80000,
  pensionContribution: 400,
  employerContribution: 300,
  pensionGrowth: 6,
  takeLumpSum: true,
  inheritanceAmount: 0,
  inheritanceAge: 70
};
const person = (overrides) => ({ ...DEFAULT_PERSON, ...overrides });

// Scenario A — solo, one year to retirement, no contributions/mortgage/inheritance.
// Covers: opening balances, lump sum split, 4%-rule fixed-then-uprated (not recalculated).
const SCENARIO_A = {
  inflationRate: 3,
  withdrawalRate: 4,
  annualExpenses: 20000,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 64,
    retirementAge: 65,
    statePensionAge: 67,
    statePensionAmount: 12548,
    ssIsaBalance: 10000,
    ssIsaContribution: 0,
    ssIsaGrowth: 5,
    pensionPot: 100000,
    pensionContribution: 0,
    employerContribution: 0,
    pensionGrowth: 6,
    takeLumpSum: true,
    inheritanceAmount: 0,
    inheritanceAge: 999
  }),
  person2: null
};

// Scenario B — solo accumulation, far from retirement, real contributions.
// Covers: monthly compounding, checked against an independent closed-form annuity formula.
const SCENARIO_B = {
  inflationRate: 0,
  withdrawalRate: 4,
  annualExpenses: 0,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 30,
    retirementAge: 65,
    ssIsaBalance: 20000,
    ssIsaContribution: 400,
    ssIsaGrowth: 5,
    pensionPot: 50000,
    pensionContribution: 500,
    employerContribution: 300,
    pensionGrowth: 6
  }),
  person2: null
};

// Scenario C — solo, already retired at y=0, short mortgage, zero inflation.
// Covers: mortgage clears in exactly the specified year; target expenses drop it after.
const SCENARIO_C = {
  inflationRate: 0,
  withdrawalRate: 4,
  annualExpenses: 20000,
  healthcareCosts: 0,
  mortgagePayment: 1000,
  mortgageYears: 3,
  person1: person({
    currentAge: 66,
    retirementAge: 65,
    pensionPot: 500000,
    ssIsaBalance: 100000,
    statePensionAmount: 0,
    statePensionAge: 67,
    ssIsaContribution: 0,
    pensionContribution: 0,
    employerContribution: 0
  }),
  person2: null
};

// Scenario D — solo, State Pension eligibility crosses mid-projection.
// Covers: State Pension starts in the correct year, inflated from today (not from SP-start age).
const SCENARIO_D = {
  inflationRate: 2,
  withdrawalRate: 4,
  annualExpenses: 10000,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 64,
    retirementAge: 65,
    statePensionAge: 67,
    statePensionAmount: 10000,
    pensionPot: 0,
    ssIsaBalance: 50000,
    ssIsaContribution: 0,
    pensionContribution: 0,
    employerContribution: 0
  }),
  person2: null
};

// Scenario E — couple, asymmetric ages/balances/rates.
// Covers: joint combined totals reconcile against the sum of individual pots.
const SCENARIO_E = {
  inflationRate: 2.5,
  withdrawalRate: 4,
  annualExpenses: 30000,
  healthcareCosts: 3000,
  mortgagePayment: 800,
  mortgageYears: 10,
  person1: person({
    currentAge: 50,
    retirementAge: 65,
    pensionPot: 150000,
    ssIsaBalance: 30000,
    pensionGrowth: 6,
    ssIsaGrowth: 5,
    pensionContribution: 400,
    employerContribution: 300,
    ssIsaContribution: 200,
    statePensionAmount: 11000
  }),
  person2: person({
    currentAge: 48,
    retirementAge: 63,
    pensionPot: 90000,
    ssIsaBalance: 20000,
    pensionGrowth: 5,
    ssIsaGrowth: 4,
    pensionContribution: 300,
    employerContribution: 200,
    ssIsaContribution: 150,
    statePensionAmount: 9500
  })
};

// Scenario F — solo, deliberately under-funded (tiny pot, high expenses, no contributions).
// Covers: depletion (combined pension + ISA < £1,000) detected from first retirement onward.
const SCENARIO_F = {
  inflationRate: 2,
  withdrawalRate: 4,
  annualExpenses: 40000,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 60,
    retirementAge: 61,
    pensionPot: 5000,
    pensionGrowth: 0, // no growth to outrun the withdrawal — guarantees depletion within the horizon
    ssIsaBalance: 0,
    statePensionAge: 67,
    statePensionAmount: 0,
    pensionContribution: 0,
    employerContribution: 0,
    ssIsaContribution: 0
  }),
  person2: null
};

// Scenario G — solo accumulation, LISA contributions only.
// Covers: the 25% government bonus is applied to LISA contributions before compounding.
const SCENARIO_G = {
  inflationRate: 0,
  withdrawalRate: 4,
  annualExpenses: 0,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 30,
    retirementAge: 65,
    lisaBalance: 4000,
    lisaContribution: 300,
    lisaGrowth: 5,
    pensionPot: 0,
    pensionContribution: 0,
    employerContribution: 0
  }),
  person2: null
};

// Scenario H — solo, already retired before 60, funds only in the LISA, flat growth.
// Covers: the LISA is excluded from drawdown before age 60 and becomes drawable from age 60.
const SCENARIO_LISA_GATE = {
  inflationRate: 0,
  withdrawalRate: 4,
  annualExpenses: 1000,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 58,
    retirementAge: 58,
    lifeExpectancy: 95,
    statePensionAge: 99,
    statePensionAmount: 0,
    cashIsaBalance: 0,
    cashIsaContribution: 0,
    ssIsaBalance: 0,
    ssIsaContribution: 0,
    lisaBalance: 10000,
    lisaContribution: 0,
    lisaGrowth: 0,
    pensionPot: 0,
    pensionContribution: 0,
    employerContribution: 0,
    pensionGrowth: 0
  }),
  person2: null
};

// Scenario I — solo, already retired at 61 (LISA always age-eligible), flat growth,
// money in all four tiers, expenses sized to only partially drain each tier in turn.
// Covers: fixed drawdown order — other savings, then Cash ISA, then S&S ISA, then LISA.
const SCENARIO_DRAW_ORDER = {
  inflationRate: 0,
  withdrawalRate: 4,
  annualExpenses: 2500,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 61,
    retirementAge: 61,
    lifeExpectancy: 95,
    statePensionAge: 99,
    statePensionAmount: 0,
    pensionPot: 0,
    pensionContribution: 0,
    employerContribution: 0,
    pensionGrowth: 0,
    cashIsaBalance: 2000,
    cashIsaContribution: 0,
    cashIsaGrowth: 0,
    ssIsaBalance: 3000,
    ssIsaContribution: 0,
    ssIsaGrowth: 0,
    lisaBalance: 4000,
    lisaContribution: 0,
    lisaGrowth: 0,
    otherSavings: [{
      id: 'other-1',
      name: 'Premium Bonds',
      balance: 1000,
      contribution: 0,
      growth: 0
    }]
  }),
  person2: null
};

// Scenario J — solo, plan already comfortably succeeds today (a pension pot
// far larger than needed at the standard withdrawal rate).
// Covers: findSupportableDelta() bidirectional search, earliest-retirement branch.
const SCENARIO_SUPPORTABLE_ALREADY_SUCCEEDS = {
  inflationRate: 2,
  withdrawalRate: 4,
  annualExpenses: 5000,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 50,
    retirementAge: 65,
    lifeExpectancy: 90,
    pensionPot: 2000000,
    pensionContribution: 0,
    employerContribution: 0,
    pensionGrowth: 5,
    ssIsaBalance: 0,
    ssIsaContribution: 0,
    takeLumpSum: false
  }),
  person2: null
};

// Scenario K — solo, plan fails today but a later retirement age (within the
// existing [max(50, currentAge+1), 75] slider bounds) fixes it. Low pension
// growth (2%) relative to the fixed 4%-rule withdrawal is what makes the pot
// eventually deplete; delaying retirement both shrinks the years remaining
// before the (retirement-age-independent) plan horizon and lets the pot run
// a few more years before the same relative depletion catches up with it.
// Covers: findSupportableDelta() bidirectional search, fix-a-failing-plan
// branch, and that it returns the *smallest* delta that fixes it (verified
// against a manual scan of every delta from 1 to the bound).
const SCENARIO_SUPPORTABLE_FIXABLE = {
  inflationRate: 2,
  withdrawalRate: 4,
  annualExpenses: 30000,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 60,
    retirementAge: 61,
    lifeExpectancy: 95,
    statePensionAge: 67,
    statePensionAmount: 0,
    pensionPot: 100000,
    pensionContribution: 0,
    employerContribution: 0,
    pensionGrowth: 2,
    ssIsaBalance: 0,
    ssIsaContribution: 0,
    takeLumpSum: false
  }),
  person2: null
};

// Scenario L — couple, same shape as Scenario K, confirming the shared-delta
// search applies the same delta to both people rather than solving per-person.
const SCENARIO_SUPPORTABLE_FIXABLE_COUPLE = {
  inflationRate: 2,
  withdrawalRate: 4,
  annualExpenses: 30000,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 60,
    retirementAge: 61,
    lifeExpectancy: 95,
    statePensionAge: 67,
    statePensionAmount: 0,
    pensionPot: 60000,
    pensionContribution: 0,
    employerContribution: 0,
    pensionGrowth: 2,
    ssIsaBalance: 0,
    ssIsaContribution: 0,
    takeLumpSum: false
  }),
  person2: person({
    currentAge: 58,
    retirementAge: 61,
    lifeExpectancy: 93,
    statePensionAge: 67,
    statePensionAmount: 0,
    pensionPot: 60000,
    pensionContribution: 0,
    employerContribution: 0,
    pensionGrowth: 2,
    ssIsaBalance: 0,
    ssIsaContribution: 0,
    takeLumpSum: false
  })
};

// Scenario M — couple, staggered retirement ages, identical per-category
// contribution rates for both people so their contribution totals differ
// only by years-of-eligibility, not by rate.
// Covers (spec/013-wave-1-bundle.md §11): computePotBreakdown()'s
// reconciliation identity in couple mode; withdrawals provably nonzero
// before bothYear (person1 retires at bothYear-14, person2 at bothYear);
// the pension-contribution cap (person1's combined monthly pension +
// employer contribution is above the £60,000/yr cap); and that each
// person's contribution years stop at their own retirementAge, not bothYear
// (person1 only has 1 year of eligibility, person2 has 15, at the same
// monthly rate for every other account).
const SCENARIO_POT_BREAKDOWN_COUPLE = {
  inflationRate: 2,
  withdrawalRate: 4,
  annualExpenses: 25000,
  healthcareCosts: 1500,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: person({
    currentAge: 60,
    retirementAge: 61, // 1 year of contribution eligibility
    lifeExpectancy: 90,
    statePensionAge: 67,
    statePensionAmount: 8000,
    pensionPot: 150000,
    pensionContribution: 3000, // combined with employerContribution, above the £60k/yr cap
    employerContribution: 2500,
    pensionGrowth: 4,
    cashIsaBalance: 5000,
    cashIsaContribution: 100,
    cashIsaGrowth: 2,
    ssIsaBalance: 20000,
    ssIsaContribution: 100,
    ssIsaGrowth: 3,
    lisaBalance: 0,
    lisaContribution: 50,
    lisaGrowth: 5,
    otherSavings: [],
    takeLumpSum: true,
    inheritanceAmount: 0,
    inheritanceAge: 999
  }),
  person2: person({
    currentAge: 50,
    retirementAge: 65, // 15 years of contribution eligibility, same rates as person1 below
    lifeExpectancy: 95,
    statePensionAge: 67,
    statePensionAmount: 9000,
    pensionPot: 120000,
    pensionContribution: 400,
    employerContribution: 300,
    pensionGrowth: 5,
    cashIsaBalance: 3000,
    cashIsaContribution: 100,
    cashIsaGrowth: 2,
    ssIsaBalance: 15000,
    ssIsaContribution: 100,
    ssIsaGrowth: 4,
    lisaBalance: 2000,
    lisaContribution: 50,
    lisaGrowth: 5,
    otherSavings: [{
      id: 'other-1',
      name: 'Premium Bonds',
      balance: 1000,
      contribution: 20,
      growth: 3
    }],
    takeLumpSum: true,
    inheritanceAmount: 0,
    inheritanceAge: 999
  })
};

// Individual-mode regression baseline — a fully-literal, self-documenting
// scenario using the app's own real default input values. Regenerating this
// fixture (via --update-baseline) is a deliberate, reviewed act, never done
// automatically by a normal test run.
const BASELINE_INPUT = {
  inflationRate: 3,
  withdrawalRate: 4,
  annualExpenses: 35000,
  healthcareCosts: 2000,
  mortgagePayment: 1200,
  mortgageYears: 15,
  person1: {
    name: 'You',
    currentAge: 35,
    retirementAge: 65,
    lifeExpectancy: 95,
    statePensionAge: 67,
    statePensionAmount: 12548,
    cashIsaBalance: 0,
    cashIsaContribution: 0,
    cashIsaGrowth: 2,
    ssIsaBalance: 25000,
    ssIsaContribution: 500,
    ssIsaGrowth: 5,
    lisaBalance: 0,
    lisaContribution: 0,
    lisaGrowth: 5,
    otherSavings: [],
    pensionPot: 80000,
    pensionContribution: 400,
    employerContribution: 300,
    pensionGrowth: 6,
    takeLumpSum: true,
    inheritanceAmount: 0,
    inheritanceAge: 70
  },
  person2: null
};

const UPDATE_BASELINE = process.argv.includes('--update-baseline');

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    pass++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    fail++;
  }
}

check('Opening balances appear at the current age with no phantom year of growth', () => {
  const data = projectJoint(SCENARIO_A);
  assert.strictEqual(data[0].p1Pension, 100000);
  assert.strictEqual(data[0].p1Isa, 10000);
});

check('Monthly compounding matches an independently-computed manual calculation exactly', () => {
  const data = projectJoint(SCENARIO_B);
  const { pensionPot, pensionGrowth, pensionContribution, employerContribution, ssIsaBalance, ssIsaGrowth, ssIsaContribution } =
    SCENARIO_B.person1;

  const mPenG = Math.pow(1 + pensionGrowth / 100, 1 / 12) - 1;
  const mSsIsaG = Math.pow(1 + ssIsaGrowth / 100, 1 / 12) - 1;
  const cm = pensionContribution + employerContribution; // below the £60k/yr cap in this scenario

  const expectedPension = Math.round(pensionPot * Math.pow(1 + mPenG, 12) + cm * ((Math.pow(1 + mPenG, 12) - 1) / mPenG));
  const expectedIsa = Math.round(ssIsaBalance * Math.pow(1 + mSsIsaG, 12) + ssIsaContribution * ((Math.pow(1 + mSsIsaG, 12) - 1) / mSsIsaG));

  assert.strictEqual(data[1].p1Pension, expectedPension);
  assert.strictEqual(data[1].p1Isa, expectedIsa);
});

check('The 25% lump sum leaves precisely 75% of the pre-lump-sum balance in the pension, and the other 25% lands in the ISA', () => {
  const data = projectJoint(SCENARIO_A);
  const { pensionPot, pensionGrowth, ssIsaBalance, ssIsaGrowth } = SCENARIO_A.person1;
  // With zero contributions, a year of monthly compounding reconstructs the
  // plain annual growth rate exactly, so both balances grow by the stated
  // rate over the one pre-retirement year before the lump sum is applied.
  const preLumpPension = Math.round(pensionPot * (1 + pensionGrowth / 100));
  const preLumpIsa = Math.round(ssIsaBalance * (1 + ssIsaGrowth / 100));
  const lump = preLumpPension * 0.25;

  assert.strictEqual(data[1].p1Pension, Math.round(preLumpPension - lump));
  assert.strictEqual(data[1].p1Isa, preLumpIsa + lump);
});

check('The 4% rule fixes the withdrawal amount in the retirement year and uprates it by inflation thereafter, not recalculated as a percentage of the declining balance', () => {
  const data = projectJoint(SCENARIO_A);
  const yearOneWithdrawal = data[1].pensionWithdrawal;
  // data[1].p1Pension is the post-lump-sum balance for the retirement year,
  // recorded before that year's withdrawal is subtracted (the subtraction is
  // applied when computing the *next* row's opening balance) — so it's
  // exactly the balance the 4% was taken from.
  assert.strictEqual(yearOneWithdrawal, Math.round(data[1].p1Pension * (SCENARIO_A.withdrawalRate / 100)));

  const yearTwoWithdrawal = data[2].pensionWithdrawal;
  const expectedYearTwo = Math.round(yearOneWithdrawal * (1 + SCENARIO_A.inflationRate / 100));
  assert.strictEqual(yearTwoWithdrawal, expectedYearTwo);

  // Negative check: must NOT be recalculated as 4% of the (now smaller) declining balance.
  const wrongRecalculation = Math.round(data[2].p1Pension * (SCENARIO_A.withdrawalRate / 100));
  assert.notStrictEqual(yearTwoWithdrawal, wrongRecalculation);
});

check('Mortgage debt clears in exactly the specified year, and mortgage payments drop out of target expenses from that year onward', () => {
  const data = projectJoint(SCENARIO_C);
  assert.ok(data[0].mortgage < 0);
  assert.ok(data[1].mortgage < 0);
  assert.ok(data[2].mortgage < 0);
  assert.strictEqual(data[3].mortgage, 0);

  const mortgageAnnual = SCENARIO_C.mortgagePayment * 12;
  assert.strictEqual(data[2].targetExpenses - SCENARIO_C.annualExpenses, mortgageAnnual);
  assert.strictEqual(data[3].targetExpenses - SCENARIO_C.annualExpenses, 0);
});

check('The State Pension starts in the correct year for each person and is correctly inflation-uprated from today', () => {
  const data = projectJoint(SCENARIO_D);
  // ages 64,65,66 -> below statePensionAge 67
  assert.strictEqual(data[0].statePension, 0);
  assert.strictEqual(data[1].statePension, 0);
  assert.strictEqual(data[2].statePension, 0);
  // age 67 at y=3
  const expected = Math.round(SCENARIO_D.person1.statePensionAmount * Math.pow(1 + SCENARIO_D.inflationRate / 100, 3));
  assert.strictEqual(data[3].statePension, expected);
});

check('Joint-mode combined totals reconcile exactly against the sum of the two individual pots', () => {
  const data = projectJoint(SCENARIO_E);
  for (const row of data) {
    assert.strictEqual(row.totalPension, row.p1Pension + row.p2Pension);
    assert.strictEqual(row.totalIsa, row.p1Isa + row.p2Isa);
    assert.strictEqual(row.p1Total, row.p1Pension + row.p1Isa);
    assert.strictEqual(row.p2Total, row.p2Pension + row.p2Isa);
    assert.strictEqual(row.p1Total + row.p2Total, row.totalPension + row.totalIsa);
  }
});

check('Depletion (combined pension + ISA < £1,000, from first retirement onward) is detected correctly in a deliberately under-funded scenario', () => {
  const data = projectJoint(SCENARIO_F);
  const { currentAge, retirementAge } = SCENARIO_F.person1;
  const firstRetYear = CURRENT_YEAR + (retirementAge - currentAge);

  const beforeRetirement = data.filter((row) => row.year < firstRetYear);
  for (const row of beforeRetirement) {
    assert.ok(row.totalPension + row.totalIsa >= 1000, `unexpected pre-retirement depletion in year ${row.year}`);
  }

  const fromRetirement = data.filter((row) => row.year >= firstRetYear);
  const depleted = fromRetirement.some((row) => row.totalPension + row.totalIsa < 1000);
  assert.ok(depleted, 'expected the under-funded scenario to deplete at some point from retirement onward');
});

check('LISA contributions receive exactly a 25% government top-up before compounding', () => {
  const data = projectJoint(SCENARIO_G);
  const { lisaBalance, lisaGrowth, lisaContribution } = SCENARIO_G.person1;
  const mLisaG = Math.pow(1 + lisaGrowth / 100, 1 / 12) - 1;
  const expectedLisa = Math.round(lisaBalance * Math.pow(1 + mLisaG, 12) + lisaContribution * 1.25 * ((Math.pow(1 + mLisaG, 12) - 1) / mLisaG));
  assert.strictEqual(data[1].p1Lisa, expectedLisa);
});

check('LISA balance is never drawn before age 60, and becomes drawable from age 60', () => {
  const data = projectJoint(SCENARIO_LISA_GATE);
  // ages 58, 59: LISA excluded from drawdown even though it's the only money available.
  assert.strictEqual(data[0].p1Lisa, 10000);
  assert.strictEqual(data[0].isaWithdrawal, 0);
  assert.strictEqual(data[1].p1Lisa, 10000);
  assert.strictEqual(data[1].isaWithdrawal, 0);
  // age 60: now eligible, drawn to cover the gap.
  assert.strictEqual(data[2].p1Lisa, 10000);
  assert.strictEqual(data[2].isaWithdrawal, 1000);
  // age 61: draw continues from the reduced balance.
  assert.strictEqual(data[3].p1Lisa, 9000);
  assert.strictEqual(data[3].isaWithdrawal, 1000);
});

check('Fixed drawdown order: other savings, then Cash ISA, then Stocks & Shares ISA, then LISA', () => {
  const data = projectJoint(SCENARIO_DRAW_ORDER);
  // Year 0: the £2,500 gap drains other savings (£1,000) fully, then partially draws
  // Cash ISA (£1,500 of £2,000) — S&S ISA and LISA aren't touched while Cash ISA still has funds.
  assert.strictEqual(data[0].p1OtherSavings, 1000);
  assert.strictEqual(data[0].p1CashIsa, 2000);
  assert.strictEqual(data[0].p1SsIsa, 3000);
  assert.strictEqual(data[0].p1Lisa, 4000);
  assert.strictEqual(data[0].otherSavingsWithdrawal, 1000);
  assert.strictEqual(data[0].isaWithdrawal, 1500);

  // Year 1: other savings already empty; Cash ISA's last £500 drains, then S&S ISA
  // covers the rest (£2,000 of £3,000) — S&S ISA is only touched once Cash ISA is empty.
  assert.strictEqual(data[1].p1OtherSavings, 0);
  assert.strictEqual(data[1].p1CashIsa, 500);
  assert.strictEqual(data[1].p1SsIsa, 3000);
  assert.strictEqual(data[1].p1Lisa, 4000);
  assert.strictEqual(data[1].otherSavingsWithdrawal, 0);
  assert.strictEqual(data[1].isaWithdrawal, 2500);

  // Year 2: Cash ISA now empty; S&S ISA's last £1,000 drains, then LISA covers the
  // rest (£1,500) — LISA is only touched once every other tier is empty.
  assert.strictEqual(data[2].p1CashIsa, 0);
  assert.strictEqual(data[2].p1SsIsa, 1000);
  assert.strictEqual(data[2].p1Lisa, 4000);
  assert.strictEqual(data[2].isaWithdrawal, 2500);

  // Year 3: LISA reflects year 2's £1,500 draw.
  assert.strictEqual(data[3].p1SsIsa, 0);
  assert.strictEqual(data[3].p1Lisa, 2500);
});

check('migratePerson() maps an old single-ISA save onto the new sub-account shape', () => {
  const oldShape = {
    name: 'You',
    currentAge: 40,
    isaBalance: 12345,
    isaContribution: 250,
    isaGrowth: 4,
    pensionPot: 90000
  };
  const migrated = migratePerson(oldShape);
  assert.strictEqual(migrated.ssIsaBalance, 12345);
  assert.strictEqual(migrated.ssIsaContribution, 250);
  assert.strictEqual(migrated.ssIsaGrowth, 4);
  assert.strictEqual(migrated.cashIsaBalance, 0);
  assert.strictEqual(migrated.cashIsaContribution, 0);
  assert.strictEqual(migrated.lisaBalance, 0);
  assert.strictEqual(migrated.lisaContribution, 0);
  assert.deepStrictEqual(migrated.otherSavings, []);
  assert.strictEqual(migrated.name, 'You');
  assert.strictEqual(migrated.pensionPot, 90000);
  assert.strictEqual(migrated.isaBalance, undefined);
});

check('migratePerson() is a no-op on an already-new-shape save, and on undefined', () => {
  const newShape = { ...DEFAULT_PERSON };
  assert.deepStrictEqual(migratePerson(newShape), newShape);
  assert.strictEqual(migratePerson(undefined), undefined);
});

// Same £1,000/first-retirement/longer-life-expectancy rule findSupportableDelta
// itself uses (spec/done/011-can-i-retire-headline.md) — hand-rolled here
// rather than calling the engine's internal planSucceeds(), consistent with
// this file's existing style of re-deriving depletion from raw projectJoint()
// output (see the Depletion check above) rather than depending on unexported
// helpers.
function succeedsAt(args) {
  const data = projectJoint(args);
  const people = [args.person1, args.person2].filter(Boolean);
  const firstRet = Math.min(...people.map((p) => CURRENT_YEAR + (p.retirementAge - p.currentAge)));
  const planEnd = Math.max(...people.map((p) => CURRENT_YEAR + (p.lifeExpectancy - p.currentAge)));
  for (const row of data) {
    if (row.year < firstRet) continue;
    if (row.totalPension + row.totalIsa + row.totalOtherSavings < 1000) return row.year > planEnd;
  }
  return true;
}
// Bumps every present person's retirementAge by the same delta, mirroring
// findSupportableDelta()'s own shared-delta bump.
function bumpRetirementAge(args, delta) {
  const bump = (p) => (p ? { ...p, retirementAge: p.retirementAge + delta } : p);
  return { ...args, person1: bump(args.person1), person2: bump(args.person2) };
}

check('findSupportableDelta() finds the earliest workable retirement when the plan already succeeds', () => {
  const succeeds = succeedsAt(SCENARIO_SUPPORTABLE_ALREADY_SUCCEEDS);
  assert.strictEqual(succeeds, true, 'expected this scenario to already succeed at its current retirement age');
  const delta = findSupportableDelta(SCENARIO_SUPPORTABLE_ALREADY_SUCCEEDS, succeeds);
  // Person1 is 50, so the earliest retirement age the slider allows is
  // max(50, 50+1) = 51, i.e. a delta of 51 - 65 = -14 — the floor of the
  // search range, since the pot is far larger than this plan ever needs.
  assert.strictEqual(delta, -14);
  assert.strictEqual(succeedsAt(bumpRetirementAge(SCENARIO_SUPPORTABLE_ALREADY_SUCCEEDS, delta)), true);
});

check('findSupportableDelta() finds the smallest fix for a plan that currently fails', () => {
  const succeeds = succeedsAt(SCENARIO_SUPPORTABLE_FIXABLE);
  assert.strictEqual(succeeds, false, 'expected this scenario to fail at its current retirement age');
  const delta = findSupportableDelta(SCENARIO_SUPPORTABLE_FIXABLE, succeeds);
  assert.strictEqual(typeof delta, 'number');
  assert.ok(delta > 0, 'expected a positive (later) delta to fix a currently-failing plan');
  // Every smaller in-range delta must still fail, or `delta` wouldn't be the smallest fix.
  for (let d = 1; d < delta; d++) {
    assert.strictEqual(succeedsAt(bumpRetirementAge(SCENARIO_SUPPORTABLE_FIXABLE, d)), false, `delta ${d} unexpectedly already fixed the plan`);
  }
  assert.strictEqual(succeedsAt(bumpRetirementAge(SCENARIO_SUPPORTABLE_FIXABLE, delta)), true);
});

check('findSupportableDelta() applies one shared delta to both people in couple mode, not two independent ones', () => {
  const succeeds = succeedsAt(SCENARIO_SUPPORTABLE_FIXABLE_COUPLE);
  assert.strictEqual(succeeds, false, 'expected this scenario to fail at its current retirement ages');
  const delta = findSupportableDelta(SCENARIO_SUPPORTABLE_FIXABLE_COUPLE, succeeds);
  assert.ok(delta > 0, 'expected a positive (later) delta to fix a currently-failing plan');
  const bumped = bumpRetirementAge(SCENARIO_SUPPORTABLE_FIXABLE_COUPLE, delta);
  // The same delta was applied to both people, not solved independently.
  assert.strictEqual(bumped.person1.retirementAge, SCENARIO_SUPPORTABLE_FIXABLE_COUPLE.person1.retirementAge + delta);
  assert.strictEqual(bumped.person2.retirementAge, SCENARIO_SUPPORTABLE_FIXABLE_COUPLE.person2.retirementAge + delta);
  assert.strictEqual(succeedsAt(bumped), true);
});

check('findSupportableDelta() returns null when no in-range delta fixes a failing plan', () => {
  const succeeds = succeedsAt(SCENARIO_F);
  assert.strictEqual(succeeds, false, 'expected the deliberately under-funded Scenario F to fail');
  assert.strictEqual(findSupportableDelta(SCENARIO_F, succeeds), null);
});

// computePotBreakdown()'s own household.totalPot row-lookup rule
// (index.html's `household` useMemo) — mirrored here rather than depending
// on an unexported helper, consistent with this file's style elsewhere.
function bothYearFor(args) {
  const people = [args.person1, args.person2].filter(Boolean);
  return Math.max(...people.map((p) => CURRENT_YEAR + (p.retirementAge - p.currentAge)));
}
function householdTotalPot(data, bothYear) {
  const row = data.find((r) => r.year === bothYear) || data[data.length - 1];
  return row.totalPension + row.totalIsa + row.totalOtherSavings;
}

check('computePotBreakdown() reconciles against household.totalPot in individual mode', () => {
  const data = projectJoint(BASELINE_INPUT);
  const bothYear = bothYearFor(BASELINE_INPUT);
  const breakdown = computePotBreakdown([BASELINE_INPUT.person1], data, bothYear);
  assert.strictEqual(
    breakdown.startingBalance + breakdown.contributions + breakdown.growth - breakdown.withdrawals,
    breakdown.totalPot
  );
  assert.strictEqual(breakdown.totalPot, householdTotalPot(data, bothYear));
});

check('computePotBreakdown() reconciles against household.totalPot in couple mode, with nonzero withdrawals before bothYear', () => {
  const data = projectJoint(SCENARIO_POT_BREAKDOWN_COUPLE);
  const bothYear = bothYearFor(SCENARIO_POT_BREAKDOWN_COUPLE);
  const breakdown = computePotBreakdown(
    [SCENARIO_POT_BREAKDOWN_COUPLE.person1, SCENARIO_POT_BREAKDOWN_COUPLE.person2],
    data,
    bothYear
  );
  assert.strictEqual(
    breakdown.startingBalance + breakdown.contributions + breakdown.growth - breakdown.withdrawals,
    breakdown.totalPot
  );
  assert.strictEqual(breakdown.totalPot, householdTotalPot(data, bothYear));

  // person1 retires 14 years before bothYear (person2's later retirement) —
  // confirms withdrawals accrue before bothYear, not only at/after it.
  const withdrawalsBeforeBothYear = data
    .filter((r) => r.year < bothYear)
    .reduce((s, r) => s + r.pensionWithdrawal + r.isaWithdrawal + r.otherSavingsWithdrawal, 0);
  assert.ok(withdrawalsBeforeBothYear > 0, 'expected nonzero withdrawals before bothYear in a staggered-retirement couple');
  assert.strictEqual(breakdown.withdrawals, withdrawalsBeforeBothYear);
});

check('computePotBreakdown() caps pension contributions at £60,000/year, and stops each person\'s contribution years at their own retirementAge', () => {
  const { person1: p1, person2: p2 } = SCENARIO_POT_BREAKDOWN_COUPLE;
  const data = projectJoint(SCENARIO_POT_BREAKDOWN_COUPLE);
  const bothYear = bothYearFor(SCENARIO_POT_BREAKDOWN_COUPLE);
  const breakdown = computePotBreakdown([p1, p2], data, bothYear);

  const cap = 60000;
  const years1 = p1.retirementAge - p1.currentAge; // 1
  const years2 = p2.retirementAge - p2.currentAge; // 15

  // p1's combined pension + employer contribution (£5,500/mo = £66,000/yr)
  // is above the cap, so the capped £60,000/yr (£5,000/mo) must be used.
  const pensionMonthly1 = Math.min(p1.pensionContribution + p1.employerContribution, cap / 12);
  assert.strictEqual(pensionMonthly1, cap / 12, 'expected p1\'s pension contribution to be capped');
  const uncappedPensionMonthly1 = p1.pensionContribution + p1.employerContribution;
  assert.notStrictEqual(pensionMonthly1, uncappedPensionMonthly1);

  const pensionMonthly2 = Math.min(p2.pensionContribution + p2.employerContribution, cap / 12);

  const expectedContributions =
    pensionMonthly1 * 12 * years1 + p1.cashIsaContribution * 12 * years1 + p1.ssIsaContribution * 12 * years1 +
      p1.lisaContribution * 1.25 * 12 * years1 +
    pensionMonthly2 * 12 * years2 + p2.cashIsaContribution * 12 * years2 + p2.ssIsaContribution * 12 * years2 +
      p2.lisaContribution * 1.25 * 12 * years2 + p2.otherSavings.reduce((s, a) => s + a.contribution * 12 * years2, 0);

  assert.strictEqual(breakdown.contributions, expectedContributions);

  // Negative check: using the uncapped rate, or using bothYear (15 years)
  // for both people instead of each person's own retirementAge, would both
  // produce a different (wrong) total.
  const wrongUncapped = expectedContributions + (uncappedPensionMonthly1 - pensionMonthly1) * 12 * years1;
  assert.notStrictEqual(breakdown.contributions, wrongUncapped);

  const bothYearYears = bothYear - p1.currentAge; // 15 — wrong if applied to p1
  const wrongYears =
    pensionMonthly1 * 12 * bothYearYears + p1.cashIsaContribution * 12 * bothYearYears + p1.ssIsaContribution * 12 * bothYearYears +
      p1.lisaContribution * 1.25 * 12 * bothYearYears +
    pensionMonthly2 * 12 * years2 + p2.cashIsaContribution * 12 * years2 + p2.ssIsaContribution * 12 * years2 +
      p2.lisaContribution * 1.25 * 12 * years2 + p2.otherSavings.reduce((s, a) => s + a.contribution * 12 * years2, 0);
  assert.notStrictEqual(breakdown.contributions, wrongYears, 'expected p1\'s contribution years to stop at retirementAge, not bothYear');
});

// ---- spec/018-uk-income-tax.md §14: income tax helpers ----

// Pure-helper cases (no projectJoint() run). Expected tax at 2026 thresholds
// from spec/018 §2's prototype table, exact to the penny.
// Covers: band boundaries at, £1 below and £1 above the Personal Allowance,
// the higher-rate threshold and the additional-rate threshold.
const SCENARIO_TAX_BAND_TABLE = [
  [0, 0],
  [12570, 0],
  [12571, 0.20],
  [50269, 7539.80],
  [50270, 7540.00],
  [50271, 7540.40],
  [100000, 27432.00],
  [100002, 27433.20],
  [110000, 33432.00],
  [125139, 42515.40],
  [125140, 42516.00],
  [125141, 42516.45],
  [150000, 53703.00]
];
const closeTo = (actual, expected, msg) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${msg || ''} expected ${expected}, got ${actual}`);

check('Income tax is correct at, just below and just above every band boundary (2026/27 thresholds)', () => {
  const th = taxThresholdsFor(2026, 3);
  for (const [income, expected] of SCENARIO_TAX_BAND_TABLE) {
    closeTo(incomeTaxFor(income, th), expected, `income ${income}:`);
  }
});

// Covers: the £100k Personal Allowance taper — a 60% effective marginal
// rate between £100,000 and £125,140, with the allowance reaching zero
// exactly at £125,140.
check('The £100k taper gives a 60% effective marginal rate and removes the allowance at £125,140', () => {
  const th = taxThresholdsFor(2026, 3);
  closeTo(incomeTaxFor(100002, th) - incomeTaxFor(100000, th), 1.20, '+£2 above £100k:');
  // At £125,140 the allowance is zero, so the whole income is taxable:
  // 37,700 x 20% + (125,140 - 37,700) x 40% = 7,540 + 34,976 = 42,516.
  closeTo(incomeTaxFor(125140, th), 37700 * 0.20 + (125140 - 37700) * 0.40, 'allowance fully tapered:');
  closeTo(incomeTaxFor(150000, th), 53703, '£150,000:');
});

// Covers: the freeze-then-uprate threshold path (spec/018 R1, R3) —
// frozen through row year 2030 (tax year 2030/31), uprated by the
// inflation input from 2031, never moving at 0% inflation, and the four
// thresholds moving together so taper + 2 x PA === ART in every year.
check('Tax thresholds are frozen through 2030, then uprated by inflation from 2031', () => {
  for (let year = 2026; year <= 2030; year++) {
    assert.strictEqual(taxThresholdsFor(year, 3).personalAllowance, 12570, `year ${year}`);
  }
  closeTo(taxThresholdsFor(2031, 3).personalAllowance, 12570 * 1.03, '2031 at 3%:');
  closeTo(taxThresholdsFor(2035, 2).personalAllowance, 12570 * Math.pow(1.02, 5), '2035 at 2%:');
  const flat = taxThresholdsFor(2060, 0);
  assert.strictEqual(flat.personalAllowance, 12570);
  assert.strictEqual(flat.higherRateThreshold, 50270);
  assert.strictEqual(flat.additionalRateThreshold, 125140);
  assert.strictEqual(flat.taperThreshold, 100000);
  const th2040 = taxThresholdsFor(2040, 3);
  closeTo(th2040.taperThreshold + 2 * th2040.personalAllowance, th2040.additionalRateThreshold, 'taper/ART identity in 2040:');
  assert.strictEqual(UK_REFERENCE.incomeTax.freezeLastYear, 2030);
});

// Shared fixture for the projectJoint() tax cases below (spec/018 §14): an
// individual already retired at y=0, no growth, no contributions, zero
// inflation, no State Pension unless a case overrides it — so every row's
// figures are exact and easy to derive by hand.
const TAX_PERSON = (overrides) => person({
  currentAge: 66,
  retirementAge: 66,
  lifeExpectancy: 95,
  statePensionAge: 99,
  statePensionAmount: 0,
  cashIsaBalance: 0,
  cashIsaContribution: 0,
  cashIsaGrowth: 0,
  ssIsaBalance: 0,
  ssIsaContribution: 0,
  ssIsaGrowth: 0,
  lisaBalance: 0,
  lisaContribution: 0,
  lisaGrowth: 0,
  otherSavings: [],
  pensionPot: 0,
  pensionContribution: 0,
  employerContribution: 0,
  pensionGrowth: 0,
  takeLumpSum: false,
  inheritanceAmount: 0,
  inheritanceAge: 999,
  ...overrides
});
const taxScenario = (household, p1, p2) => ({
  inflationRate: 0,
  withdrawalRate: 4,
  annualExpenses: 0,
  healthcareCosts: 0,
  mortgagePayment: 0,
  mortgageYears: 0,
  person1: TAX_PERSON(p1),
  person2: p2 ? TAX_PERSON(p2) : null,
  ...household
});
const planEndOf = (args) => Math.max(...[args.person1, args.person2].filter(Boolean)
  .map((p) => CURRENT_YEAR + (p.lifeExpectancy - p.currentAge)));
const firstRetOf = (args) => Math.min(...[args.person1, args.person2].filter(Boolean)
  .map((p) => CURRENT_YEAR + (p.retirementAge - p.currentAge)));

// Covers: per-person allowances in joint mode — two £20,000 incomes are
// each taxed against their own Personal Allowance (£1,486 each), not as one
// £40,000 income (£5,486).
const SCENARIO_TAX_COUPLE_ALLOWANCES = taxScenario({}, { pensionPot: 500000 }, { pensionPot: 500000 });
const SCENARIO_TAX_SINGLE_SAME_HOUSEHOLD = taxScenario({}, { pensionPot: 1000000 });

check('Income tax uses each person\'s own Personal Allowance in joint mode', () => {
  const couple = projectJoint(SCENARIO_TAX_COUPLE_ALLOWANCES);
  assert.strictEqual(couple[0].pensionWithdrawal, 40000);
  assert.strictEqual(couple[0].p1Tax, 1486);
  assert.strictEqual(couple[0].p2Tax, 1486);
  assert.strictEqual(couple[0].incomeTax, 2972);
  const single = projectJoint(SCENARIO_TAX_SINGLE_SAME_HOUSEHOLD);
  assert.strictEqual(single[0].pensionWithdrawal, 40000);
  assert.strictEqual(single[0].incomeTax, 5486);
});

// Covers: the Lump Sum Allowance cap (intent/018 decision 12) — tax-free
// cash is min(25%, £268,275), the excess stays in the pension, and the
// initial 4%-rule withdrawal is taken from the larger remaining pot.
const SCENARIO_TAX_LSA_OVER = taxScenario({}, { pensionPot: 2000000, takeLumpSum: true });
const SCENARIO_TAX_LSA_EXACT = taxScenario({}, { pensionPot: 1073100, takeLumpSum: true });
const SCENARIO_TAX_LSA_UNDER = taxScenario({}, { pensionPot: 1000000, takeLumpSum: true });
const SCENARIO_TAX_LSA_COUPLE = taxScenario({},
  { pensionPot: 2000000, takeLumpSum: true },
  { pensionPot: 1000000, takeLumpSum: true });

check('The tax-free lump sum is capped at the Lump Sum Allowance, with the excess left in the pension', () => {
  const over = projectJoint(SCENARIO_TAX_LSA_OVER);
  assert.strictEqual(over[0].p1LumpSum, 268275);
  assert.strictEqual(over[0].p1LumpSumExcess, 231725);
  assert.strictEqual(over[0].p1Pension, 1731725);
  assert.strictEqual(over[0].p1SsIsa, 268275);
  assert.strictEqual(over[0].pensionWithdrawal, 69269);
  assert.strictEqual(over[0].p1Tax, 15140);
  // The lump sum is a one-off: zero in every later row.
  assert.ok(over.slice(1).every((r) => r.p1LumpSum === 0 && r.p1LumpSumExcess === 0));

  const exact = projectJoint(SCENARIO_TAX_LSA_EXACT);
  assert.strictEqual(exact[0].p1LumpSum, 268275);
  assert.strictEqual(exact[0].p1LumpSumExcess, 0);

  const under = projectJoint(SCENARIO_TAX_LSA_UNDER);
  assert.strictEqual(under[0].p1LumpSum, 250000);
  assert.strictEqual(under[0].p1Pension, 750000);
  assert.strictEqual(under[0].p1LumpSumExcess, 0);

  const couple = projectJoint(SCENARIO_TAX_LSA_COUPLE);
  assert.strictEqual(couple[0].p1LumpSum, 268275);
  assert.strictEqual(couple[0].p1LumpSumExcess, 231725);
  assert.strictEqual(couple[0].p2LumpSum, 250000);
  assert.strictEqual(couple[0].p2LumpSumExcess, 0);
});

// Covers: ISA, LISA and other-savings withdrawals are never taxed.
const SCENARIO_TAX_SAVINGS_ONLY = taxScenario({ annualExpenses: 50000 }, {
  ssIsaBalance: 500000,
  cashIsaBalance: 20000,
  otherSavings: [{ id: 'other-1', name: 'Savings', balance: 30000, contribution: 0, growth: 0 }]
});

check('ISA, LISA and other-savings withdrawals are never taxed', () => {
  const data = projectJoint(SCENARIO_TAX_SAVINGS_ONLY);
  assert.ok(data.every((r) => r.incomeTax === 0), 'expected no income tax in any row');
  // £550,000 of savings at £50,000/yr with no growth covers the full spend for 11 years.
  for (const r of data.slice(0, 11)) {
    assert.strictEqual(r.isaWithdrawal + r.otherSavingsWithdrawal, 50000, `year ${r.year}`);
  }
  assert.ok(projectJoint(SCENARIO_DRAW_ORDER).every((r) => r.incomeTax === 0));
});

// Covers: tax reduces net income and the larger gap is funded from savings
// (no gross-up of the 4%-rule draw), and changing the withdrawal rate
// changes the tax (intent/018 decisions 8-9).
const SCENARIO_TAX_WIDENS_SAVINGS_DRAW = taxScenario({ annualExpenses: 40000 }, { pensionPot: 1000000, ssIsaBalance: 100000 });
const SCENARIO_TAX_HIGHER_WITHDRAWAL_RATE = { ...SCENARIO_TAX_WIDENS_SAVINGS_DRAW, withdrawalRate: 5 };

check('Income tax widens the savings draw by exactly the tax when spending equals the gross pension draw', () => {
  const r = projectJoint(SCENARIO_TAX_WIDENS_SAVINGS_DRAW)[0];
  assert.strictEqual(r.pensionWithdrawal, 40000);
  assert.strictEqual(r.incomeTax, 5486);
  assert.strictEqual(r.isaWithdrawal, 5486);
  assert.strictEqual(r.netIncome, 34514);
});

check('Changing the withdrawal rate changes the income tax', () => {
  const r = projectJoint(SCENARIO_TAX_HIGHER_WITHDRAWAL_RATE)[0];
  assert.strictEqual(r.pensionWithdrawal, 50000);
  assert.strictEqual(r.incomeTax, 7486);
  assert.strictEqual(r.isaWithdrawal, 0);
});

// Covers: the State Pension is taxable income, and its interaction with the
// frozen-then-uprated Personal Allowance (2031 = first uprated year).
const SCENARIO_TAX_STATE_PENSION = taxScenario({ inflationRate: 3 }, {
  currentAge: 62,
  retirementAge: 62,
  statePensionAge: 67,
  statePensionAmount: 12548
});

check('The State Pension is taxed against the frozen-then-uprated Personal Allowance', () => {
  const data = projectJoint(SCENARIO_TAX_STATE_PENSION);
  const row2030 = data.find((r) => r.year === 2030);
  const row2031 = data.find((r) => r.year === 2031);
  assert.strictEqual(row2030.p1StatePension, 0);
  assert.strictEqual(row2030.p1Tax, 0);
  assert.strictEqual(row2031.p1StatePension, 14547);
  assert.strictEqual(row2031.p1TaxableIncome, 14547);
  assert.strictEqual(row2031.p1Tax, 320);
});

// Covers: lifetimeTaxTotals() sums tax from first retirement to planEnd, and
// its today's-money figure deflates each year's tax from its own year
// (spec/018 R6) — not the nominal total deflated once.
check('lifetimeTaxTotals() deflates each year\'s tax from its own year and sums them', () => {
  const data = projectJoint(BASELINE_INPUT);
  const firstRet = firstRetOf(BASELINE_INPUT);
  const planEnd = planEndOf(BASELINE_INPUT);
  assert.strictEqual(firstRet, 2056);
  assert.strictEqual(planEnd, 2086);
  const totals = lifetimeTaxTotals(data, firstRet, planEnd, 3);
  const window = data.filter((r) => r.year >= 2056 && r.year <= 2086);
  const nominal = window.reduce((s, r) => s + r.incomeTax, 0);
  const today = window.reduce((s, r) => s + deflate(r.incomeTax, r.year, 3), 0);
  assert.strictEqual(totals.nominal, nominal);
  closeTo(totals.today, today, 'today\'s-money total:');
  assert.ok(nominal > 0, 'expected the default plan to pay some income tax');
  assert.ok(Math.abs(totals.today - deflate(nominal, 2086, 3)) > 1,
    'today\'s-money total must not be the nominal total deflated once from planEnd');
});

// Covers: computeTaxNotes() — first-year facts per person, strict ">"
// boundaries, the taper zone strictly between £100k and the ART, the right
// personIndex in a couple, and rows after planEnd ignored (spec/018 R7).
const SCENARIO_TAX_NOTES_TAPER = taxScenario({}, { pensionPot: 2750000 });
const SCENARIO_TAX_NOTES_ADDITIONAL = taxScenario({}, { pensionPot: 3750000 });
const SCENARIO_TAX_NOTES_AT_HIGHER_THRESHOLD = taxScenario({}, { pensionPot: 1256750 });
const SCENARIO_TAX_NOTES_COUPLE = taxScenario({}, { pensionPot: 500000 }, { pensionPot: 3750000 });
const notesFor = (args, planEnd) => computeTaxNotes(
  projectJoint(args),
  [args.person1, args.person2].filter(Boolean),
  args.inflationRate,
  planEnd === undefined ? planEndOf(args) : planEnd
);
const typesOf = (notes, personIndex) => notes.filter((n) => n.personIndex === personIndex).map((n) => n.type);

check('computeTaxNotes() reports each fact once, in its first year, with strict boundaries', () => {
  const lsa = notesFor(SCENARIO_TAX_LSA_OVER);
  assert.deepStrictEqual(typesOf(lsa, 0), ['higherRate', 'lumpSumCapped']);
  assert.ok(lsa.every((n) => n.year === 2026));
  const capped = lsa.find((n) => n.type === 'lumpSumCapped');
  assert.strictEqual(capped.amount, 268275);
  assert.strictEqual(capped.excess, 231725);

  const taper = notesFor(SCENARIO_TAX_NOTES_TAPER);
  assert.deepStrictEqual(typesOf(taper, 0), ['higherRate', 'taper']);
  assert.strictEqual(taper.find((n) => n.type === 'taper').amount, 110000);

  const additional = notesFor(SCENARIO_TAX_NOTES_ADDITIONAL);
  assert.deepStrictEqual(typesOf(additional, 0), ['higherRate', 'additionalRate']);

  const atThreshold = projectJoint(SCENARIO_TAX_NOTES_AT_HIGHER_THRESHOLD);
  assert.strictEqual(atThreshold[0].p1TaxableIncome, 50270);
  assert.deepStrictEqual(notesFor(SCENARIO_TAX_NOTES_AT_HIGHER_THRESHOLD), []);

  const sp = notesFor(SCENARIO_TAX_STATE_PENSION);
  assert.deepStrictEqual(sp.map((n) => [n.type, n.year, n.amount]), [['statePensionOverAllowance', 2031, 14547]]);
  closeTo(sp[0].threshold, 12570 * 1.03, 'uprated allowance:');
  // Rows after planEnd are ignored.
  assert.deepStrictEqual(notesFor(SCENARIO_TAX_STATE_PENSION, 2030), []);

  const couple = notesFor(SCENARIO_TAX_NOTES_COUPLE);
  assert.deepStrictEqual(typesOf(couple, 0), []);
  assert.deepStrictEqual(typesOf(couple, 1), ['higherRate', 'additionalRate']);
});

check('Individual-mode results are byte-for-byte identical to a known-good baseline', () => {
  const result = projectJoint(BASELINE_INPUT);
  if (UPDATE_BASELINE) {
    fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(result, null, 2) + '\n');
    console.log(`  (wrote ${result.length} rows to ${path.relative(__dirname, BASELINE_PATH)})`);
    return;
  }
  const expected = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  assert.deepStrictEqual(result, expected);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
