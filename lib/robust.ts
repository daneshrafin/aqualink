import type {Scenario,Plan,Community} from './types';
import {evaluate,optimize,repairOnly,deliveryOnly,noAction} from './optimizer';
import {validateCommunities,validateScenario} from './scenarioValidation';
export {validateCommunities} from './scenarioValidation';
export type Uncertainty={repairDaysPct:number;repairCostPct:number;deliveryCostPct:number;seed:number;samples:number};
export type RobustRow={name:string;plan:Plan;median:number;p90:number;overBudgetPct:number};
export type RobustResult={rows:RobustRow[];winner:RobustRow;settings:Uncertainty};
function rng(seed:number){let x=seed>>>0;return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
function percentile(a:number[],q:number){const b=[...a].sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.floor(q*(b.length-1)))];}
export function robustAnalysis(s:Scenario,u:Uncertainty):RobustResult{
 validateScenario(s);
 if(!Number.isInteger(u.samples)||u.samples<10||u.samples>500)throw Error('Samples must be 10–500');
 const pessimistic:Scenario={...s,communities:s.communities.map(c=>({...c,repairDays:Math.max(1,Math.ceil(c.repairDays*(1+u.repairDaysPct/100))),repairCost:Math.ceil(c.repairCost*(1+u.repairCostPct/100)),deliveryCostPerDay:Math.ceil(c.deliveryCostPerDay*(1+u.deliveryCostPct/100))}))};
 const candidates=[{name:'Nominal joint',plan:optimize(s)},{name:'Pessimistic joint',plan:optimize({...pessimistic,budget:s.budget})},{name:'Repair only',plan:repairOnly(s)},{name:'Delivery only',plan:deliveryOnly(s)},{name:'No action',plan:noAction(s)}];
 const random=rng(u.seed),out=candidates.map(()=>({values:[] as number[],over:0}));
 for(let i=0;i<u.samples;i++){
  const actual:Scenario={...s,communities:s.communities.map(c=>({...c,repairDays:Math.max(1,Math.round(c.repairDays*(1+(random()*2-1)*u.repairDaysPct/100))),repairCost:Math.max(0,Math.round(c.repairCost*(1+(random()*2-1)*u.repairCostPct/100))),deliveryCostPerDay:Math.max(0,Math.round(c.deliveryCostPerDay*(1+(random()*2-1)*u.deliveryCostPct/100)))}))};
  candidates.forEach((candidate,j)=>{
   const adjusted=candidate.plan.actions.map(a=>{const c=actual.communities.find(c=>c.id===a.communityId)!;return {...a,durationDays:a.type==='repair'?c.repairDays:a.durationDays,cost:a.type==='repair'?c.repairCost:a.durationDays*c.deliveryCostPerDay};});
   const plan=evaluate(actual,adjusted);out[j].values.push(plan.unmetPersonDays);if(plan.cost>s.budget)out[j].over++;
  });
 }
 const rows=candidates.map((c,i)=>({name:c.name,plan:c.plan,median:percentile(out[i].values,.5),p90:percentile(out[i].values,.9),overBudgetPct:100*out[i].over/u.samples}));
 // Feasibility first: a plan with a higher budget-exceedance rate cannot win by unmet demand alone.
 const winner=[...rows].sort((a,b)=>a.overBudgetPct-b.overBudgetPct||a.p90-b.p90||a.median-b.median)[0];
 return {rows,winner,settings:u};
}
export const communityColumns=['id','name','people','dailySupplyLiters','storageLiters','repairCost','repairDays','restoredLitersPerDay','deliveryCostPerDay','deliveryLitersPerDay'] as const;
export function parseCommunitiesCSV(csv:string):Community[]{const lines=csv.replace(/^\uFEFF/,'').trim().split(/\r?\n/);if(lines.length<2)throw Error('CSV requires header and at least one row');const header=lines[0].split(',').map(s=>s.trim());if(communityColumns.some(k=>!header.includes(k)))throw Error('CSV is missing required columns');const result=lines.slice(1).map((line,i)=>({line,row:i+2})).filter(x=>x.line.trim()).map(({line,row})=>{const cells=line.split(',').map(s=>s.trim());if(cells.length!==header.length)throw Error(`CSV row ${row}: expected ${header.length} columns, found ${cells.length}. Names containing commas must not be used in this simple CSV importer; remove the comma and retry.`);const raw=Object.fromEntries(header.map((k,i)=>[k,cells[i]]));const missing=communityColumns.find(k=>!raw[k]);if(missing)throw Error(`CSV row ${row}: ${missing} is required. Enter 0 explicitly where zero is intended.`);return Object.fromEntries(communityColumns.map(k=>[k,k==='id'||k==='name'?raw[k]:Number(raw[k])])) as Community;});validateCommunities(result);return result;}
