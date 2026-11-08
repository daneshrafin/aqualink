import test from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/plan/route';
import {demoScenario} from '../lib/demo';

const request = (payload:unknown) => new Request('http://localhost/api/plan',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
});

test('planning API returns the known valid model result', async () => {
  const response = await POST(request(demoScenario));
  const data = await response.json();
  assert.equal(response.status,200);
  assert.equal(data.joint.unmetLiters,49300);
  assert.equal(data.joint.cost,44200);
});

test('planning API rejects duplicate community IDs instead of returning a misleading plan', async () => {
  const scenario = structuredClone(demoScenario);
  scenario.communities[1].id = scenario.communities[0].id;
  const response = await POST(request(scenario));
  const data = await response.json();
  assert.equal(response.status,400);
  assert.match(data.error,/Duplicate community ID/);
  assert.equal(data.joint,undefined);
});

test('planning API rejects negative, missing, fractional and non-numeric community inputs', async () => {
  for (const value of [-1,null,'',1.5,'150']) {
    const scenario = structuredClone(demoScenario);
    const payload = {...scenario,communities:[{...scenario.communities[0],people:value}]};
    const response = await POST(request(payload));
    const data = await response.json();
    assert.equal(response.status,400);
    assert.match(data.error,/Population/);
  }
  const scenario = structuredClone(demoScenario);
  scenario.communities[0].repairDays = 0;
  assert.equal((await POST(request(scenario))).status,400);
});

test('planning API handles malformed JSON and invalid payload shapes as input errors', async () => {
  const malformed = new Request('http://localhost/api/plan',{method:'POST',body:'{'});
  assert.equal((await POST(malformed)).status,400);
  for (const payload of [null,[],{}, {...demoScenario,communities:[]}, {...demoScenario,communities:[null]}]) {
    const response = await POST(request(payload));
    assert.equal(response.status,400);
    assert.equal(typeof (await response.json()).error,'string');
  }
});

test('planning API accepts the same legitimate boundary cases as the manual planner', async () => {
  const scenario = structuredClone(demoScenario);
  scenario.budget = 0;
  scenario.communities[0].deliveryCostPerDay = 0;
  scenario.communities[0].repairDays = 21;
  const response = await POST(request(scenario));
  const data = await response.json();
  assert.equal(response.status,200);
  assert.equal(data.joint.cost,0);
  assert.ok(Number.isFinite(data.joint.unmetLiters));
});
