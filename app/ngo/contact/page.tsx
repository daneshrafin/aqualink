 'use client';
import {useState} from 'react';
import {publicDb} from '@/lib/db';
export default function ContactLookup(){
 const [id,setId]=useState(''),[phone,setPhone]=useState(''),[message,setMessage]=useState(''),[loading,setLoading]=useState(false);
 async function lookup(e:React.FormEvent){e.preventDefault();setPhone('');setMessage('');setLoading(true);
 try{const db=publicDb();if(!db)throw Error('Supabase is not configured.');
 const {data}=await db.auth.getSession();const token=data.session?.access_token;if(!token)throw Error('Sign in to a verified NGO officer account.');
 const res=await fetch('/api/ngo/contact?reportId='+encodeURIComponent(id),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
 const body=await res.json();if(!res.ok)throw Error(body.error||'Not available');setPhone(body.phone);
 }catch(err){setMessage(err instanceof Error?err.message:'Lookup failed')}finally{setLoading(false)}}
 return <main className="page-grid"><section className="surface form-surface"><h1 className="page-title">Private responder callback</h1>
 <p className="page-subtitle">Only active officers of a verified organization assigned to a shared report may retrieve its contact number. A demo role switch does not grant access.</p>
 <form onSubmit={lookup}><label className="field">Assigned shared report UUID<input required value={id} onChange={e=>setId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></label>
 <button className="btn btn-primary" disabled={loading}>{loading?'Checking…':'View private contact'}</button></form>
 {phone&&<p role="status">Private contact: <a href={'tel:'+phone}>{phone}</a>. Do not share publicly.</p>}
 {message&&<p role="alert">{message}</p>}
 <p className="field-hint">Shared reports need trusted moderation and assignment before this works. Do not use real personal information in unreviewed demos.</p>
 </section></main>
}
