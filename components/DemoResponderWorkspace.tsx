'use client';
import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {ClipboardCheck, Clock3, Users, CheckCircle2, ArrowRight} from 'lucide-react';
import {usePreferences, t} from '@/lib/preferences';
import {sampleOrgs} from '@/lib/orgDemo';
import {useDemoCoordination} from '@/lib/useDemoCoordination';
import {mergeResponseTasks, updateDemoTask, taskStatuses, type DemoResponseTask} from '@/lib/demoCoordination';
import {REPORT_KINDS, reportKindLabel} from '@/lib/reportKinds';

const TASK_KEY = 'aqualink_response_tasks_demo_v1';
const statusLabels = {
  assigned:['Assigned','দায়িত্বপ্রাপ্ত'], in_progress:['In progress','কাজ চলছে'],
  completed:['Completed','সম্পন্ন'], cancelled:['Cancelled','বাতিল'],
};

function TaskCard({task, title, area, kind, onSave}:{task:DemoResponseTask;title:string;area:string;kind:string|undefined;onSave:(task:DemoResponseTask)=>void}) {
  const {lang}=usePreferences();const tr=(en:string,bn:string)=>t(lang,en,bn);
  const [draft,setDraft]=useState(task);
  useEffect(()=>setDraft(task),[task]);
  return <article className="response-task-card">
    <div className="task-card-heading"><span className="case-category">{reportKindLabel(kind,lang)}</span><span className={'task-status status-'+task.status}>{statusLabels[task.status][lang==='bn'?1:0]}</span></div>
    <h3>{title}</h3><p className="muted">{area}</p>
    <p className="task-reference">{task.caseId} · {sampleOrgs.find(o=>o.id===task.orgId)?.name}</p>
    <form onSubmit={e=>{e.preventDefault();onSave(draft)}}>
      <div className="task-fields">
        <label>{tr('Field team','কর্মরত দল')}<input maxLength={100} required value={draft.team} onChange={e=>setDraft({...draft,team:e.target.value})}/></label>
        <label>{tr('Progress','অগ্রগতি')}<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as DemoResponseTask['status']})}>{taskStatuses.map(s=><option key={s} value={s}>{statusLabels[s][lang==='bn'?1:0]}</option>)}</select></label>
        <label>{tr('Estimated cost (৳)','আনুমানিক খরচ (৳)')}<input type="number" min={0} max={100000000} step="any" required value={Number.isNaN(draft.estimate)?'':draft.estimate} onChange={e=>setDraft({...draft,estimate:e.target.value===''?NaN:Number(e.target.value)})}/></label>
      </div>
      <label>{tr('Progress / completion notes','অগ্রগতি / কাজ শেষের নোট')}<textarea rows={3} maxLength={2000} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label>
      <div className="button-row"><button className="btn btn-primary" type="submit">{tr('Save progress','অগ্রগতি সংরক্ষণ')}</button><Link className="text-link" href={'/cases?q='+encodeURIComponent(task.caseId)}>{tr('View linked case','সংশ্লিষ্ট রিপোর্ট')} <ArrowRight size={15}/></Link>{task.caseId.startsWith('AQ-')&&<Link className="text-link" href={'/track?id='+encodeURIComponent(task.caseId)}>{tr('Track report','রিপোর্ট দেখুন')}</Link>}</div>
    </form>
  </article>;
}

export default function DemoResponderWorkspace() {
  const {lang}=usePreferences();const tr=(en:string,bn:string)=>t(lang,en,bn);
  const {cases,save}=useDemoCoordination();
  const [saved,setSaved]=useState<DemoResponseTask[]>([]);
  const [org,setOrg]=useState('all'),[filter,setFilter]=useState('all'),[category,setCategory]=useState('all'),[query,setQuery]=useState(''),[limit,setLimit]=useState(12),[message,setMessage]=useState('');
  useEffect(()=>{
    const sync=()=>{try{const value=JSON.parse(localStorage.getItem(TASK_KEY)||'[]');if(Array.isArray(value))setSaved(value)}catch{}};
    sync();const caseId=new URLSearchParams(window.location.search).get('case');if(caseId)setQuery(caseId);
    window.addEventListener('storage',sync);window.addEventListener('aqua-demo-task-change',sync);
    return()=>{window.removeEventListener('storage',sync);window.removeEventListener('aqua-demo-task-change',sync)};
  },[]);
  const tasks=useMemo(()=>mergeResponseTasks(cases,saved),[cases,saved]);
  const byId=useMemo(()=>new Map(cases.map(c=>[c.id,c])),[cases]);
  const filtered=tasks.filter(task=>{
    const c=byId.get(task.caseId)!;
    return (org==='all'||task.orgId===org)&&(filter==='all'||task.status===filter)&&(category==='all'||c.kind===category)&&[c.id,c.title,c.area,task.team].some(s=>s.toLowerCase().includes(query.trim().toLowerCase()));
  }).sort((a,b)=>Number(a.status==='completed')-Number(b.status==='completed'));
  function saveProgress(draft:DemoResponseTask) {
    try {
      const result=updateDemoTask(tasks,cases,draft.id,draft);
      localStorage.setItem(TASK_KEY,JSON.stringify(result.tasks));
      setSaved(result.tasks);save(result.cases,result.caseId,draft.team);
      window.dispatchEvent(new Event('aqua-demo-task-change'));
      setMessage(tr('Progress saved in this browser. The linked case and report status are updated.','এই ব্রাউজারে অগ্রগতি সংরক্ষিত। সংশ্লিষ্ট case ও রিপোর্টের অবস্থাও আপডেট হয়েছে।'));
    } catch(e) {setMessage(e instanceof Error?e.message:tr('Could not save progress.','অগ্রগতি সংরক্ষণ হয়নি।'));}
  }
  const summaries=[
    {label:tr('Assigned tasks','দায়িত্বপ্রাপ্ত কাজ'),value:tasks.filter(t=>t.status==='assigned').length,Icon:ClipboardCheck},
    {label:tr('In progress','কাজ চলছে'),value:tasks.filter(t=>t.status==='in_progress').length,Icon:Clock3},
    {label:tr('Example organizations','নমুনা প্রতিষ্ঠান'),value:new Set(tasks.map(t=>t.orgId)).size,Icon:Users},
    {label:tr('Completed','সম্পন্ন'),value:tasks.filter(t=>t.status==='completed').length,Icon:CheckCircle2},
  ];
  return <section className="responder-demo">
    <div className="page-header"><div><span className="eyebrow">{tr('RESPONSE COORDINATION','সহায়তা সমন্বয়')}</span><h1 className="page-title">{tr('Verified responder workspace','যাচাইকৃত রেসপন্ডারের কর্মক্ষেত্র')}</h1><p className="page-subtitle">{tr('Assign teams, record costs and follow each case through to completion.','দল নির্ধারণ করুন, খরচ লিখুন এবং কাজ শেষ হওয়া পর্যন্ত অগ্রগতি দেখুন।')}</p></div><Link className="btn btn-primary" href="/cases">{tr('Claim a verified case','যাচাইকৃত রিপোর্টের দায়িত্ব নিন')} <ArrowRight size={16}/></Link></div>
    <div className="demo-context"><b>{tr('Interactive demo','ইন্টারঅ্যাকটিভ ডেমো')}</b><span>{tr('Fictional teams and tasks · changes are saved in this browser.','কাল্পনিক দল ও কাজ · পরিবর্তন এই ব্রাউজারে সংরক্ষিত থাকে।')}</span></div>
    <div className="workspace-metrics">{summaries.map(({label,value,Icon})=><div key={label}><Icon size={22}/><strong>{value}</strong><span>{label}</span></div>)}</div>
    <div className="workflow-strip"><span><b>01</b>{tr('Claim a verified case','যাচাইকৃত রিপোর্ট গ্রহণ')}</span><span><b>02</b>{tr('Set team, cost & progress','দল, খরচ ও অগ্রগতি')}</span><span><b>03</b>{tr('Complete & track the result','সম্পন্ন করে ফল দেখুন')}</span></div>
    <div className="surface task-filter-panel"><label>{tr('Search case, area or team','রিপোর্ট, এলাকা বা দল খুঁজুন')}<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(12)}} placeholder="AQ-102 / Khulna"/></label><label>{tr('Organization','প্রতিষ্ঠান')}<select value={org} onChange={e=>{setOrg(e.target.value);setLimit(12)}}><option value="all">{tr('All organizations','সব প্রতিষ্ঠান')}</option>{sampleOrgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label><label>{tr('Issue category','সমস্যার ধরন')}<select value={category} onChange={e=>{setCategory(e.target.value);setLimit(12)}}><option value="all">{tr('All categories','সব ধরন')}</option>{REPORT_KINDS.map(k=><option key={k} value={k}>{reportKindLabel(k,lang)}</option>)}</select></label><label>{tr('Status','অবস্থা')}<select value={filter} onChange={e=>{setFilter(e.target.value);setLimit(12)}}><option value="all">{tr('All statuses','সব অবস্থা')}</option>{taskStatuses.map(s=><option key={s} value={s}>{statusLabels[s][lang==='bn'?1:0]}</option>)}</select></label></div>
    {message&&<p className="notice" role="status">{message}</p>}
    <p className="field-hint">{tr('Showing','দেখাচ্ছে')} {Math.min(limit,filtered.length)} / {filtered.length} {tr('tasks. Completing a linked task updates the case; submitted reports also update in Track report.','কাজ। কাজ সম্পন্ন করলে case আপডেট হয়; জমা দেওয়া রিপোর্ট Track report-এও আপডেট হয়।')}</p>
    <div className="response-task-grid">{filtered.slice(0,limit).map(task=>{const c=byId.get(task.caseId)!;return <TaskCard key={task.id} task={task} title={c.title} area={c.area} kind={c.kind} onSave={saveProgress}/>})}</div>
    {!filtered.length&&<div className="surface guide-card"><h2>{tr('No matching tasks','মিলেছে এমন কাজ নেই')}</h2><p>{tr('Clear filters or claim a verified case to add its response task.','ফিল্টার সরান অথবা যাচাইকৃত রিপোর্টের দায়িত্ব নিন।')}</p><button className="btn btn-outline" onClick={()=>{setQuery('');setOrg('all');setCategory('all');setFilter('all')}}>{tr('Clear filters','ফিল্টার মুছুন')}</button></div>}
    {filtered.length>limit&&<button className="btn btn-outline" onClick={()=>setLimit(n=>n+12)}>{tr('Show more tasks','আরও কাজ দেখুন')}</button>}
  </section>;
}
