'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {X,RotateCcw,ArrowUp} from 'lucide-react';
import {usePreferences,t} from '@/lib/preferences';
import {useDemo} from '@/lib/store';
import {useDemoCoordination} from '@/lib/useDemoCoordination';
import {answerFota,type FotaAnswer} from '@/lib/fota';
type Message={who:'user'|'bot';text:string;answer?:FotaAnswer};
export default function Fota(){
  const {lang}=usePreferences();const tr=(en:string,bn:string)=>t(lang,en,bn);const route=usePathname();
  const {reports}=useDemo();const {cases}=useDemoCoordination();
  const [open,setOpen]=useState(false),[value,setValue]=useState(''),[messages,setMessages]=useState<Message[]>([]),[reference,setReference]=useState<string>();
  const input=useRef<HTMLInputElement>(null),body=useRef<HTMLDivElement>(null),launch=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(open){input.current?.focus();body.current?.scrollTo({top:body.current.scrollHeight})}},[open,messages]);
  useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);launch.current?.focus()}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close)},[open]);
  useEffect(()=>{setMessages([]);setReference(undefined)},[lang]);
  function ask(question:string){const q=question.trim().slice(0,250);if(!q)return;const answer=answerFota(q,{lang,route,reports,cases,reference});if(answer.reference)setReference(answer.reference);setMessages(old=>[...old.slice(-16),{who:'user',text:q},{who:'bot',text:answer.text,answer}]);setValue('');}
  const topics=[tr('Help on this page','এখানে কী করব'),tr('Track a report','রিপোর্টের অবস্থা'),tr('Claim a case','দায়িত্ব গ্রহণ'),tr('Task progress','কাজের অগ্রগতি'),tr('Estimate costs','খরচের হিসাব')];
  return <><button ref={launch} className="fota-launch" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="fota-panel">{open?tr('× Close','× বন্ধ করুন'):tr('✦ FOTA · Help','✦ FOTA · সাহায্য')}</button>{open&&<section id="fota-panel" className="fota-panel" aria-label={tr('FOTA guided assistant','FOTA সহকারী')}><header className="fota-head"><div><strong>✦ FOTA</strong><small>{tr('Works offline · guided answers','অফলাইনে কাজ করে · নির্দেশিত উত্তর')}</small></div><div><button onClick={()=>{setMessages([]);setReference(undefined);input.current?.focus()}} aria-label={tr('Clear conversation','কথোপকথন মুছুন')} title={tr('Start again','আবার শুরু')}><RotateCcw size={17}/></button><button onClick={()=>{setOpen(false);launch.current?.focus()}} aria-label={tr('Close FOTA','FOTA বন্ধ করুন')}><X size={19}/></button></div></header><div className="fota-body" ref={body}><div className="fota-msg">{tr('Hi, I’m FOTA. Tell me what you want to do, or paste an AQ report ID. I can explain the next step using your demo records.','আমি FOTA। কী করতে চান বলুন অথবা AQ রিপোর্ট নম্বর দিন। আপনার ডেমো রিপোর্ট দেখে পরবর্তী ধাপ বুঝিয়ে দিতে পারি।')}</div><div role="log" aria-live="polite" aria-relevant="additions">{messages.map((m,i)=><div className={'fota-msg '+(m.who==='user'?'user':'')} key={i}><p>{m.text}</p>{m.answer?.steps&&<ol>{m.answer.steps.map(step=><li key={step}>{step}</li>)}</ol>}{m.answer?.links.map(l=><Link className="fota-link" key={l.href} href={l.href} onClick={()=>setOpen(false)}>{l.label} →</Link>)}</div>)}</div><div className="fota-quick">{topics.map(label=><button key={label} onClick={()=>ask(label)}>{label}</button>)}</div></div><form className="fota-controls" onSubmit={e=>{e.preventDefault();ask(value)}}><input ref={input} value={value} onChange={e=>setValue(e.target.value)} maxLength={250} aria-label={tr('Ask FOTA','FOTA-কে জিজ্ঞেস করুন')} placeholder={tr('Ask here, or try AQ-101…','প্রশ্ন বা AQ-101 লিখুন…')}/><button type="submit" disabled={!value.trim()} aria-label={tr('Send question','প্রশ্ন পাঠান')}><ArrowUp size={20}/></button></form></section>}</>;
}
