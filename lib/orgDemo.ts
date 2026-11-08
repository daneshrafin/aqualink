import type {ReportKind} from './reportKinds';
// Browser-only fictional demonstration. NEVER use as authentication or verification.
export type DemoOrg={id:string;name:string;type:string;district:string;focus:string};
export type DemoCase={kind?:ReportKind;id:string;title:string;area:string;status:'verified'|'assigned'|'resolved';orgId:string|null;date:string};
export type DemoApplication={id:string;name:string;type:string;district:string;address:string;contact:string;email:string;description:string;status:'draft / simulated';createdAt:string};
export const sampleOrgs:DemoOrg[]=[
['Coastal Water Response Collective','community_group','Satkhira','Handpump repair, sanitation maintenance and household water access'],
['Bhola Island Water Volunteers','volunteer_team','Bhola','Island water delivery and water-point assessment'],
['Delta Safe Water Initiative','ngo','Khulna','Water-quality testing referrals and handwashing supplies'],
['Sunamganj Haor Support Circle','community_group','Sunamganj','Flood-season emergency water access'],
['Riverbank Recovery Partnership','foundation','Kurigram','Repair planning and emergency supply'],
['Char Community Water Team','volunteer_team','Patuakhali','Remote char water transport'],
['Noakhali Community Resilience Forum','ngo','Noakhali','Water point rehabilitation'],
['Hatiya Water Access Network','community_group','Noakhali','Island delivery coordination'],
['Cox Coastal Support Group','volunteer_team','Cox’s Bazar','Water distribution logistics'],
['Barguna Water Repair Circle','community_group','Barguna','Pump inspection and repair'],
['Sylhet Flood Response Forum','ngo','Sylhet','Flooded source assessments'],
['Barishal Water Recovery Team','foundation','Barishal','Water storage and repair support']
].map(([name,type,district,focus],i)=>({id:`fictional-org-${i+1}`,name,type,district,focus}));
const areas=['Shyamnagar, Satkhira','Char Fasson, Bhola','Dacope, Khulna','Tahirpur, Sunamganj','Chilmari, Kurigram','Kalapara, Patuakhali','Hatiya, Noakhali','Subarnachar, Noakhali','Teknaf, Cox’s Bazar','Patharghata, Barguna','Companiganj, Sylhet','Mehendiganj, Barishal'];
const titles=['Handpump inspection needed','Emergency water delivery requested','Water point repair assessment','Storage replenishment needed'];
const existingCases:DemoCase[]=Array.from({length:48},(_,i)=>({id:`DEMO-CASE-${String(i+1).padStart(3,'0')}`,title:titles[i%4],kind:(i%2===0?'broken_pump':'shortage') as ReportKind,area:areas[(i*7+Math.floor(i/12))%areas.length],status:i%7===0?'verified':i%3===0?'assigned':'resolved',orgId:i%7===0?null:sampleOrgs[(i*5+Math.floor(i/12))%sampleOrgs.length].id,date:new Date(Date.UTC(2026,9,1+(i%29))).toISOString()}));
export const sanitationCases:DemoCase[]=[
{id:'DEMO-CASE-SAN-001',kind:'sanitation_hygiene',title:'Demo: latrine repair assessment awaiting a team',area:'Shyamnagar, Satkhira',status:'verified',orgId:null,date:'2026-11-07T08:00:00Z'},
{id:'DEMO-CASE-SAN-002',kind:'sanitation_hygiene',title:'Demo: handwashing station and soap replenishment',area:'Dacope, Khulna',status:'assigned',orgId:'fictional-org-3',date:'2026-11-07T08:10:00Z'},
{id:'DEMO-CASE-SAN-003',kind:'sanitation_hygiene',title:'Demo: sanitation maintenance follow-up completed',area:'Shyamnagar, Satkhira',status:'resolved',orgId:'fictional-org-1',date:'2026-11-07T08:20:00Z'},
];
const moreIssueExamples:DemoCase[]=[
{id:'DEMO-CASE-QUALITY-001',kind:'suspected_contamination',title:'Water sample collection and laboratory referral',area:'Dacope, Khulna',status:'assigned',orgId:'fictional-org-3',date:'2026-11-08T08:00:00Z'},
{id:'DEMO-CASE-OTHER-001',kind:'other',title:'Restore access to the community water collection point',area:'Shyamnagar, Satkhira',status:'assigned',orgId:'fictional-org-1',date:'2026-11-08T08:10:00Z'},
{id:'DEMO-CASE-QUALITY-002',kind:'suspected_contamination',title:'Water-quality assessment awaiting a team',area:'Char Fasson, Bhola',status:'verified',orgId:null,date:'2026-11-08T08:20:00Z'},
{id:'DEMO-CASE-OTHER-002',kind:'other',title:'Accessible collection path assessment',area:'Tahirpur, Sunamganj',status:'verified',orgId:null,date:'2026-11-08T08:30:00Z'},
];
export const initialCases:DemoCase[]=[...existingCases.slice(0,2),...moreIssueExamples,...sanitationCases,...existingCases.slice(2)];
/** Add new seed IDs and category metadata while preserving saved claims/progress. */
export function mergeDemoCases(saved:DemoCase[]):DemoCase[]{
 const seed=new Map(initialCases.map(c=>[c.id,c]));
 const merged=new Map(saved.map(c=>[c.id,{...seed.get(c.id),...c,kind:c.kind??seed.get(c.id)?.kind}]));
 return [...initialCases.filter(c=>!merged.has(c.id)),...merged.values()];
}
const CASE_KEY='aquarescue_org_cases_demo_v1',APP_KEY='aquarescue_org_applications_demo_v1';
export function demoCases():DemoCase[]{if(typeof window==='undefined')return initialCases;try{const data=JSON.parse(localStorage.getItem(CASE_KEY)||'null');if(Array.isArray(data))return mergeDemoCases(data);}catch{}return initialCases;}
export function saveDemoCases(cases:DemoCase[]){localStorage.setItem(CASE_KEY,JSON.stringify(cases));window.dispatchEvent(new Event('aqua-demo-org-change'));}
export function demoApplications():DemoApplication[]{if(typeof window==='undefined')return [];try{const data=JSON.parse(localStorage.getItem(APP_KEY)||'[]');return Array.isArray(data)?data:[]}catch{return []}}
export function addDemoApplication(a:DemoApplication){localStorage.setItem(APP_KEY,JSON.stringify([a,...demoApplications()].slice(0,20)));window.dispatchEvent(new Event('aqua-demo-org-change'));}

/** Restore the clearly fictional demonstration to its original state. */
export function resetDemoCases(){if(typeof window==='undefined')return;const seeds=new Set(initialCases.map(c=>c.id));const retained=demoCases().filter(c=>!seeds.has(c.id));localStorage.setItem(CASE_KEY,JSON.stringify(retained));window.dispatchEvent(new Event('aqua-demo-org-change'));}
