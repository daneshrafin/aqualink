import type {Report} from './types';
import {sampleOrgs, type DemoCase} from './orgDemo';

/** Project reviewed browser reports into the existing case list, for every kind. */
export function combineDemoCases(saved: DemoCase[], reports: Report[]): DemoCase[] {
  const reportIds = new Set(reports.map(r => r.id));
  const records = new Map(saved.filter(c => !c.id.startsWith('AQ-') || reportIds.has(c.id)).map(c => [c.id, c]));
  for (const r of reports) {
    if (r.status === 'pending' || r.status === 'rejected') { records.delete(r.id); continue; }
    const previous = records.get(r.id);
    records.set(r.id, {id:r.id, title:r.title, area:r.area, kind:r.kind,
      status:r.status, orgId:r.status === 'verified' ? null : previous?.orgId ?? null, date:r.createdAt});
  }
  return [...records.values()];
}

export function claimDemoCase(cases: DemoCase[], id: string, orgId: string): DemoCase[] {
  if (!sampleOrgs.some(o => o.id === orgId)) throw new Error('Choose an example organization.');
  const item = cases.find(c => c.id === id);
  if (!item || item.status !== 'verified' || item.orgId) throw new Error('Only an unclaimed, verified case can be claimed.');
  return cases.map(c => c.id === id ? {...c, status:'assigned', orgId} : c);
}

export const taskStatuses = ['assigned','in_progress','completed','cancelled'] as const;
export type DemoTaskStatus = typeof taskStatuses[number];
export type DemoResponseTask = {
  id: string; caseId: string; orgId: string; status: DemoTaskStatus;
  team: string; estimate: number; notes: string;
};


/** Ignore corrupt or obsolete local rows rather than crashing the workspace. */
export function parseDemoTasks(value: unknown): DemoResponseTask[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is DemoResponseTask => row !== null && typeof row === 'object'
    && typeof row.id === 'string' && typeof row.caseId === 'string' && typeof row.orgId === 'string'
    && (taskStatuses as readonly unknown[]).includes(row.status)
    && typeof row.team === 'string' && !!row.team.trim() && row.team.length <= 100
    && typeof row.estimate === 'number' && Number.isFinite(row.estimate) && row.estimate >= 0 && row.estimate <= 100000000
    && typeof row.notes === 'string' && row.notes.length <= 2000);
}

function taskNote(kind: DemoCase['kind']): string {
  switch (kind) {
    case 'broken_pump': return 'Demo: inspect the pump handle and seals; list replacement parts before scheduling the repair.';
    case 'shortage': return 'Demo: review remaining storage and arrange a temporary delivery estimate. Confirm the receiving location with the field team.';
    case 'suspected_contamination': return 'Demo: sample collection is planned and laboratory assessment is pending. Water safety has not been established.';
    case 'sanitation_hygiene': return 'Demo: assess the damaged facility and check handwashing water, soap and repair supplies before scheduling work.';
    default: return 'Demo: inspect access to the collection point and record the work needed to restore the route.';
  }
}

/** A claimed case gets one task in the existing responder workspace. */
export function mergeResponseTasks(cases: DemoCase[], saved: DemoResponseTask[]): DemoResponseTask[] {
  const previous = new Map(parseDemoTasks(saved).map(t => [t.caseId, t]));
  return cases.filter(c => c.orgId && (c.status === 'assigned' || c.status === 'resolved')).map((c,i) => {
    const old = previous.get(c.id);
    const sameOwner = old?.orgId === c.orgId;
    return {id:'TASK-'+c.id, caseId:c.id, orgId:c.orgId!,
      status:c.status === 'resolved' ? 'completed' : sameOwner && old.status !== 'completed' ? old.status : c.id === 'DEMO-CASE-QUALITY-001' ? 'in_progress' : 'assigned',
      team:sameOwner ? old.team : i%2 ? 'Field team B' : 'Field team A',
      estimate:sameOwner ? old.estimate : c.kind === 'shortage' ? 2500 : c.kind === 'broken_pump' ? 4000 : 1500,
      notes:sameOwner ? old.notes : c.status === 'resolved' ? 'Demo follow-up completed; example record only.' : taskNote(c.kind)};
  });
}

export function updateDemoTask(tasks: DemoResponseTask[], cases: DemoCase[], id: string,
  patch: Pick<DemoResponseTask,'status'|'team'|'estimate'|'notes'>) {
  const task = tasks.find(t => t.id === id);
  if (!task) throw new Error('Task not found.');
  if (!(taskStatuses as readonly string[]).includes(patch.status)) throw new Error('Choose a valid status.');
  if (!Number.isFinite(patch.estimate) || patch.estimate < 0 || patch.estimate > 100000000) throw new Error('Enter a cost from 0 to 100,000,000.');
  if (!patch.team.trim() || patch.team.length > 100 || patch.notes.length > 2000) throw new Error('Check the team name and note length.');
  const linked = cases.find(c => c.id === task.caseId);
  if (!linked || linked.orgId !== task.orgId) throw new Error('The case assignment has changed. Refresh and try again.');
  if (linked.status === 'resolved' && patch.status === 'cancelled') throw new Error('A completed case cannot be cancelled. Choose In progress to reopen it.');
  const status = patch.status === 'completed' ? 'resolved' as const : patch.status === 'cancelled' ? linked.status : 'assigned' as const;
  return {
    tasks:tasks.map(t => t.id === id ? {...t, ...patch, team:patch.team.trim(), notes:patch.notes.trim()} : t),
    cases:cases.map(c => c.id === task.caseId ? {...c, status} : c),
    caseId:task.caseId, caseStatus:status,
  };
}
