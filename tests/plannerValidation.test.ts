import test from 'node:test';
import assert from 'node:assert/strict';
import {demoScenario} from '../lib/demo';
import {optimize,repairOnly,cheapestFirstRepair,deliveryOnly,noAction} from '../lib/optimizer';
import {communityColumns,parseCommunitiesCSV} from '../lib/robust';
import type {Community,Scenario} from '../lib/types';

const copy = () => structuredClone(demoScenario);
const fields = ['people','dailySupplyLiters','storageLiters','repairCost','repairDays','restoredLitersPerDay','deliveryCostPerDay','deliveryLitersPerDay'] as const;

for (const field of fields) {
  test(`planner rejects invalid ${field} before returning a plan`, () => {
    for (const value of [-1,NaN,Infinity,-Infinity,1.5,Number.MAX_SAFE_INTEGER+1]) {
      const scenario = copy();
      scenario.communities[0][field] = value;
      assert.throws(() => optimize(scenario), /whole number/, `${field}=${value}`);
    }
  });
}

test('zero repair duration is rejected', () => {
  const scenario = copy();
  scenario.communities[0].repairDays = 0;
  assert.throws(() => optimize(scenario), /Repair duration/);
});

test('duplicate IDs cannot silently reuse another community across any planning strategy', () => {
  const scenario = copy();
  scenario.communities[1].id = scenario.communities[0].id;
  for (const plan of [optimize,repairOnly,cheapestFirstRepair,deliveryOnly,noAction]) {
    assert.throws(() => plan(scenario), /Duplicate community ID/);
  }
});

test('blank identity fields and missing numeric inputs are rejected', () => {
  for (const field of ['id','name'] as const) {
    const scenario = copy();
    scenario.communities[0][field] = '   ';
    assert.throws(() => optimize(scenario));
  }
  const scenario = copy();
  delete (scenario.communities[0] as Partial<Community>).storageLiters;
  assert.throws(() => optimize(scenario), /Stored water/);
});

test('invalid budget, horizon and daily requirement are rejected', () => {
  const invalid: Array<[keyof Pick<Scenario,'budget'|'days'|'litersPerPersonPerDay'>,number]> = [
    ['budget',-1],['budget',1.5],['budget',NaN],['budget',Infinity],['budget',Number.MAX_SAFE_INTEGER+1],
    ['days',0],['days',15],['days',1.5],['days',NaN],
    ['litersPerPersonPerDay',0],['litersPerPersonPerDay',-1],['litersPerPersonPerDay',NaN],['litersPerPersonPerDay',Infinity]
  ];
  for (const [field,value] of invalid) assert.throws(() => optimize({...copy(),[field]:value}));
  assert.throws(() => optimize({...copy(),litersPerPersonPerDay:Number.MAX_VALUE}), /too large/);
});

test('community counts stay within the supported model boundary', () => {
  assert.throws(() => optimize({...copy(),communities:[]}), /1–6/);
  const communities = Array.from({length:7},(_,i)=>({...demoScenario.communities[0],id:`c${i}`}));
  assert.throws(() => optimize({...copy(),communities}), /1–6/);
});

test('zero budget, free actions and zero population remain valid', () => {
  const scenario = copy();
  scenario.budget = 0;
  scenario.communities[0].repairCost = 0;
  scenario.communities[0].deliveryCostPerDay = 0;
  scenario.communities[1].people = 0;
  const plan = optimize(scenario);
  assert.equal(plan.cost,0);
  assert.ok(Number.isFinite(plan.unmetLiters));
  assert.ok(plan.unmetLiters <= noAction(scenario).unmetLiters);
});

test('valid repairs longer than the horizon and fractional per-person demand remain supported', () => {
  const scenario = copy();
  scenario.days = 14;
  scenario.litersPerPersonPerDay = 15.5;
  scenario.communities = Array.from({length:6},(_,i)=>({...scenario.communities[0],id:`c${i}`,repairDays:21}));
  const plan = optimize(scenario);
  assert.ok(plan.cost <= scenario.budget);
  assert.ok(Number.isFinite(plan.unmetLiters));
  assert.equal(plan.actions.some(action=>action.type==='repair'),false);
});

test('CSV blank numeric cells are not silently converted into zero', () => {
  const community = demoScenario.communities[0];
  for (const field of fields) {
    const row = communityColumns.map(key=>key===field?'':community[key]).join(',');
    assert.throws(() => parseCommunitiesCSV(communityColumns.join(',')+'\n'+row), new RegExp(`${field} is required`));
  }
  const row = communityColumns.map(key=>key==='storageLiters'?0:community[key]).join(',');
  assert.equal(parseCommunitiesCSV(communityColumns.join(',')+'\n'+row)[0].storageLiters,0);
});

test('CSV duplicate IDs are rejected with the same identity rule', () => {
  const row = communityColumns.map(key=>demoScenario.communities[0][key]).join(',');
  assert.throws(() => parseCommunitiesCSV(communityColumns.join(',')+'\n'+row+'\n'+row), /Duplicate community ID/);
});

test('documented valid simulations retain their original outcomes', () => {
  for (const [budget,days,litersPerPersonPerDay,cost,unmetLiters] of [
    [20000,7,15,19500,90900],
    [20000,14,15,19500,184700],
    [20000,14,25,19500,381000],
    [45000,7,15,44200,49300]
  ]) {
    const plan = optimize({...copy(),budget,days,litersPerPersonPerDay});
    assert.equal(plan.cost,cost);
    assert.equal(plan.unmetLiters,unmetLiters);
  }
});
