import test from 'node:test';
import assert from 'node:assert/strict';
import {REPORT_KINDS} from '../lib/reportKinds';
import type {Report} from '../lib/types';
import {initialCases,mergeDemoCases} from '../lib/orgDemo';
import {combineDemoCases,claimDemoCase,mergeResponseTasks,updateDemoTask,parseDemoTasks} from '../lib/demoCoordination';
const fixture=(kind:Report['kind']):Report=>({id:'AQ-TEST-'+kind,title:'Example incident',area:'Demo ward',kind,peopleAffected:30,status:'pending',createdAt:'2026-11-07T00:00:00Z'});

for(const kind of REPORT_KINDS)test(`${kind}: report, verification, claim, task progress and resolution share one flow`,()=>{
  const report=fixture(kind);
  assert.equal(combineDemoCases([], [report]).length,0);
  report.status='verified';
  const verified=combineDemoCases([], [report]);
  const claimed=claimDemoCase(verified,report.id,'fictional-org-1');
  assert.equal(verified[0].orgId,null,'input is not mutated');
  report.status='assigned'; // Same update performed by the coordination hook.
  const cases=combineDemoCases(claimed,[report]);
  const tasks=mergeResponseTasks(cases,[]);
  assert.equal(tasks.length,1);
  const progressed=updateDemoTask(tasks,cases,tasks[0].id,{status:'in_progress',team:' Field team C ',estimate:6400,notes:'Supplies assessed; follow-up scheduled.'});
  const restored=mergeResponseTasks(progressed.cases,JSON.parse(JSON.stringify(progressed.tasks)));
  assert.equal(restored[0].team,'Field team C');assert.equal(restored[0].estimate,6400);assert.equal(restored[0].status,'in_progress');
  assert.equal(restored[0].notes,'Supplies assessed; follow-up scheduled.');
  const completed=updateDemoTask(restored,progressed.cases,restored[0].id,{...restored[0],status:'completed'});
  report.status=completed.caseStatus;
  const result=combineDemoCases(completed.cases,[report]);
  assert.equal(report.status,'resolved');assert.equal(result[0].status,'resolved');assert.equal(result[0].orgId,'fictional-org-1');
  assert.equal(mergeResponseTasks(result,completed.tasks)[0].status,'completed');
});

test('claims reject unverified, rejected, already claimed and unknown-organization cases',()=>{
  const report=fixture('shortage');
  for(const status of ['pending','rejected'] as const){report.status=status;assert.throws(()=>claimDemoCase(combineDemoCases([], [report]),report.id,'fictional-org-1'),/verified/)}
  report.status='verified';const cases=combineDemoCases([], [report]);
  assert.throws(()=>claimDemoCase(cases,report.id,'unknown'),/organization/);
  const claimed=claimDemoCase(cases,report.id,'fictional-org-1');
  assert.throws(()=>claimDemoCase(claimed,report.id,'fictional-org-2'),/verified/);
});

test('workspace has example tasks in all five categories without a backend',()=>{
  const tasks=mergeResponseTasks(initialCases,[]);
  for(const kind of REPORT_KINDS)assert.ok(tasks.some(t=>initialCases.some(c=>c.id===t.caseId&&c.kind===kind)),kind);
  assert.ok(tasks.some(t=>t.status==='in_progress'));assert.ok(tasks.some(t=>t.status==='assigned'));assert.ok(tasks.some(t=>t.status==='completed'));
});

test('corrupt task storage and invalid costs do not overwrite valid progress',()=>{
  const cases=claimDemoCase(combineDemoCases([],[{...fixture('other'),status:'verified'}]),'AQ-TEST-other','fictional-org-1');
  const task=mergeResponseTasks(cases,[])[0];
  assert.deepEqual(parseDemoTasks([null,{}, {...task,status:'invented'}, {...task,estimate:-1},task]),[task]);
  assert.deepEqual(parseDemoTasks('wrong shape'),[]);
  for(const estimate of [-1,NaN,Infinity,100000001])assert.throws(()=>updateDemoTask([task],cases,task.id,{...task,estimate}),/cost/);
  assert.throws(()=>updateDemoTask([task],cases,task.id,{...task,team:' '}),/team/);
  assert.throws(()=>updateDemoTask([task],cases,task.id,{...task,notes:'x'.repeat(2001)}),/note/);
  assert.equal(task.status,'assigned');
});

test('ownership changes discard old task edits and prevent stale writes',()=>{
  const owned=initialCases.find(c=>c.status==='assigned'&&c.orgId)!;
  const task=mergeResponseTasks([owned],[])[0];
  const changed={...owned,orgId:'fictional-org-12'};
  assert.throws(()=>updateDemoTask([task],[changed],task.id,task),/assignment/);
  const newTask=mergeResponseTasks([changed],[{...task,notes:'old private draft',estimate:999}])[0];
  assert.notEqual(newTask.notes,'old private draft');assert.notEqual(newTask.estimate,999);
});

test('existing claims survive upgrade; report state remains authoritative',()=>{
  const report={...fixture('broken_pump'),status:'verified' as const};
  const claimed=claimDemoCase(combineDemoCases([], [report]),report.id,'fictional-org-2');
  const migrated=mergeDemoCases(JSON.parse(JSON.stringify(claimed)));
  assert.equal(migrated.find(c=>c.id===report.id)?.orgId,'fictional-org-2');
  assert.equal(combineDemoCases(migrated,[{...report,status:'resolved'}]).find(c=>c.id===report.id)?.status,'resolved');
  assert.equal(combineDemoCases(migrated,[{...report,status:'rejected'}]).find(c=>c.id===report.id),undefined);
  assert.equal(combineDemoCases(migrated,[report]).find(c=>c.id===report.id)?.orgId,null);
  assert.equal(combineDemoCases(migrated,[]).find(c=>c.id===report.id),undefined);
});
