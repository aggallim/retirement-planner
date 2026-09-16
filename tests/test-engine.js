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
  const src = extractEngineSource(html) + '\nvar __CURRENT_YEAR = CURRENT_YEAR;\n';
  const sandbox = { Math };
  const context = vm.createContext(sandbox);
  new vm.Script(src, { filename: 'index.html (extracted engine)' }).runInContext(context);

  const rawProjectJoint = sandbox.projectJoint;
  const rawMigratePerson = sandbox.migratePerson;
  const CURRENT_YEAR = sandbox.__CURRENT_YEAR;

  if (typeof rawProjectJoint !== 'function') {
    throw new Error('Extraction sanity check failed: projectJoint is not a function after eval');
  }
  if (typeof rawMigratePerson !== 'function') {
    throw new Error('Extraction sanity check failed: migratePerson is not a function after eval');
  }
  if (typeof CURRENT_YEAR !== 'number') {
    throw new Error('Extraction sanity check failed: CURRENT_YEAR is not a number after eval');
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
  return { projectJoint, migratePerson, CURRENT_YEAR };
}

let projectJoint, migratePerson, CURRENT_YEAR;
try {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  ({ projectJoint, migratePerson, CURRENT_YEAR } = loadEngine(html));
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
