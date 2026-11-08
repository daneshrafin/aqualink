'use client';
import {useEffect,useState} from 'react';
import {reportKindLabel} from '@/lib/reportKinds';
import {usePreferences} from '@/lib/preferences';
import Link from 'next/link';
type SharedReport={id:string;title:string;area:string;kind:string;people_affected:number;status:string;created_at:string};
export default function SharedReportsPage(){
 const {lang}=usePreferences();
 const [items,setItems]=useState<SharedReport[]>([]),[message,setMessage]=useState('Loading…'),[mode,setMode]=useState('');
 useEffect(()=>{let active=true;fetch('/api/reports').then(async r=>{const result=await r.json();if(!r.ok)throw Error(result.error||'Request failed');if(active){setItems(result.reports||[]);setMode(result.mode);setMessage('')}}).catch(e=>active&&setMessage(e.message));return()=>{active=false}},[]);
 return <main className="page-grid"><section><h1 className="page-title">Shared incident directory</h1><p className="page-subtitle">Only reviewed reports appear when a database is connected. Unverified submissions are private to the review queue.</p><p className="notice">{mode==='demo'?'DEMO DATA — not verified emergencies':mode==='database'?'DATABASE MODE — approved statuses only':'Loading source…'}</p>{message&&<p role="status">{message}</p>}<div className="surface">{items.length===0&&!message?<p>No public reports available yet.</p>:items.map(r=><article key={r.id} style={{padding:'1rem',borderBottom:'1px solid #ddd'}}><h3>{r.title}</h3><p>{r.area} · {reportKindLabel(r.kind,lang)} · {r.status}</p><small>{r.people_affected} people estimated · {new Date(r.created_at).toLocaleDateString()}</small></article>)}</div></section><aside className="side-column"><div className="surface tip-card"><h3>Data safety</h3><p>Precise locations, photos and reporter identity are not exposed in this directory.</p><Link className="btn btn-primary" href="/report">Report an issue</Link></div></aside></main>
}
