'use client';
import {useEffect, useMemo, useState} from 'react';
import {useDemo} from './store';
import {demoCases, initialCases, saveDemoCases, type DemoCase} from './orgDemo';
import {combineDemoCases} from './demoCoordination';

export function useDemoCoordination() {
  const {reports, update} = useDemo();
  const [saved, setSaved] = useState<DemoCase[]>(initialCases);
  useEffect(() => {
    const sync = () => setSaved(demoCases());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('aqua-demo-org-change', sync);
    return () => {window.removeEventListener('storage', sync); window.removeEventListener('aqua-demo-org-change', sync);};
  }, []);
  const cases = useMemo(() => combineDemoCases(saved, reports), [saved, reports]);
  function save(next: DemoCase[], changedId?: string, assignedTo?: string) {
    // Keep unclaimed projected reports in the incident store; persist partner
    // examples and claimed reports only, avoiding thousands of duplicate seeds.
    const reportIds = new Set(reports.map(r => r.id));
    const retained = next.filter(c => !reportIds.has(c.id) || c.orgId);
    saveDemoCases(retained);
    setSaved(retained);
    if (changedId && reportIds.has(changedId)) {
      const item = next.find(c => c.id === changedId);
      const current = reports.find(r => r.id === changedId);
      if (item && current && (item.status !== current.status || (assignedTo && assignedTo !== current.assignedTo))) update(item.id, item.status, assignedTo);
    }
  }
  return {cases, save};
}
