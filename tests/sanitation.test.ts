import test from 'node:test';
import assert from 'node:assert/strict';
import {POST,GET} from '../app/api/reports/route';
import {REPORT_KINDS,reportKindLabel} from '../lib/reportKinds';
import {encodeSms,parseSms,smsReportKinds} from '../lib/sms';
import {initialCases,mergeDemoCases,sanitationCases} from '../lib/orgDemo';
import {sanitationPrices} from '../lib/sanitationPrices';
import {worksheetTotal,worksheetCsv} from '../lib/priceWorksheet';
import {createCostProposal} from '../lib/costBridge';

const request=(kind:string)=>new Request('http://localhost/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Fictional sanitation test',area:'Demo ward',kind,peopleAffected:80,contactPhone:'01300000000',website:'validation-only'})});

test('report intake accepts sanitation and all legacy categories while rejecting unknown kinds',async()=>{
  // Honeypot path deliberately avoids writes and exercises the real request schema.
  for(const kind of REPORT_KINDS){
    const response=await POST(request(kind));
    assert.equal(response.status,202,kind);
    assert.equal((await response.json()).status,'pending');
  }
  assert.equal((await POST(request('sanitation_unknown'))).status,400);
});

test('public demo reports expose reviewed sanitation records with public API fields only',async()=>{
  const before={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY};
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try{
    const data=await (await GET()).json();
    const records=data.reports.filter((r:{kind:string})=>r.kind==='sanitation_hygiene');
    assert.equal(data.mode,'demo');assert.equal(records.length,2);
    for(const r of data.reports){
      assert.ok(['verified','assigned','resolved'].includes(r.status));
      assert.equal(typeof r.people_affected,'number');
      for(const key of ['lat','lng','contactPhone','notes','description'])assert.equal(r[key],undefined);
    }
  }finally{
    if(before.url===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=before.url;
    if(before.key===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=before.key;
  }
});

test('sanitation SMS round trip maps to the same report category and translated label',()=>{
  const input={issue:'SANITATION' as const,area:'Demo ward',people:80,details:'Handwashing tap broken',contactPhone:'01300000000'};
  const report=parseSms(encodeSms(input));
  assert.deepEqual(report,input);
  assert.equal(smsReportKinds[report.issue],'sanitation_hygiene');
  assert.equal(reportKindLabel(smsReportKinds[report.issue],'en'),'Sanitation / hygiene problem');
  assert.equal(reportKindLabel(smsReportKinds[report.issue],'bn'),'স্যানিটেশন / স্বাস্থ্যবিধির সমস্যা');
  assert.equal(smsReportKinds.OTHER,'other');
});

test('upgrading legacy partner data preserves claims and adds sanitation cases only once',()=>{
  const saved=initialCases.filter(c=>!c.id.includes('-SAN-')).map(({kind,...c})=>({...c}));
  saved[0]={...saved[0],status:'resolved',orgId:'fictional-org-3'};
  const first=mergeDemoCases(saved);
  assert.equal(first.length,initialCases.length);
  assert.equal(first.find(c=>c.id===saved[0].id)?.orgId,'fictional-org-3');
  assert.equal(first.find(c=>c.id===saved[0].id)?.status,'resolved');
  assert.ok(first.find(c=>c.id===saved[0].id)?.kind);
  assert.deepEqual(mergeDemoCases(first),first);
});

test('saved sanitation claim and resolution survive seed merging and reload',()=>{
  const claimed=mergeDemoCases([]).map(c=>c.id===sanitationCases[0].id?{...c,status:'assigned' as const,orgId:'fictional-org-1'}:c);
  const reloaded=mergeDemoCases(JSON.parse(JSON.stringify(claimed)));
  assert.equal(reloaded.find(c=>c.id===sanitationCases[0].id)?.status,'assigned');
  const resolved=reloaded.map(c=>c.id===sanitationCases[0].id?{...c,status:'resolved' as const}:c);
  const again=mergeDemoCases(JSON.parse(JSON.stringify(resolved)));
  assert.equal(again.find(c=>c.id===sanitationCases[0].id)?.status,'resolved');
  assert.equal(again.find(c=>c.id===sanitationCases[0].id)?.orgId,'fictional-org-1');
  assert.equal(again.filter(c=>c.id===sanitationCases[0].id).length,1);
});

test('sanitation worksheet quantities, price edits, removal and CSV evidence use the standard flow',()=>{
  const quantities=Object.fromEntries(sanitationPrices.map(x=>[x.id,1]));
  assert.equal(worksheetTotal(sanitationPrices,quantities,{}),8520);
  quantities.san_soap=3;
  assert.equal(worksheetTotal(sanitationPrices,quantities,{san_soap:80}),8690);
  quantities.san_latrine_pan=0;
  assert.equal(worksheetTotal(sanitationPrices,quantities,{san_soap:80}),8140);
  const csv=worksheetCsv(sanitationPrices,quantities,{san_soap:80});
  assert.match(csv,/"100 g bar","3","80","240","example \(demo\)"/);
  assert.match(csv,/"pack of 500 tablets","1","1750"/);
  assert.equal(csv.split('\r\n').length,6);
  assert.ok(!csv.includes('ceramic example'));
  assert.ok(csv.includes('2026-11-07'));
});

test('sanitation worksheet lines cannot change repair or delivery optimizer costs',()=>{
  const sanitation=sanitationPrices.map(x=>({id:x.id,category:x.category,quantity:1,unitPrice:x.price}));
  assert.throws(()=>createCostProposal(sanitation,1,'2026-11-07'),/repair or transport/);
  const oldLines=[{id:'repair',category:'Repair',quantity:1,unitPrice:17000},{id:'transport',category:'Transport',quantity:2,unitPrice:2500}];
  const old=createCostProposal(oldLines,2,'2026-11-07');
  const mixed=createCostProposal([...oldLines,...sanitation],2,'2026-11-07');
  assert.equal(mixed.repairCost,old.repairCost);assert.equal(mixed.deliveryCostPerDay,old.deliveryCostPerDay);
});
