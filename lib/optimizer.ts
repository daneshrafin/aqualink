import type {Action,Plan,Scenario} from './types';
import {validateScenario} from './scenarioValidation';
/** Synthetic water-continuity model. Storage is consumed greedily; no crew, routing or quality constraints. */
export function evaluate(s:Scenario,actions:Action[],method='evaluated'):Plan{
 const dailyUnmetLiters=Array(s.days).fill(0);let total=0;
 for(const c of s.communities){let stored=c.storageLiters;for(let d=0;d<s.days;d++){
 const repaired=actions.some(a=>a.communityId===c.id&&a.type==='repair'&&d>=a.startDay+a.durationDays);
 const delivered=actions.some(a=>a.communityId===c.id&&a.type==='delivery'&&d>=a.startDay&&d<a.startDay+a.durationDays);
 const demand=c.people*s.litersPerPersonPerDay;
 const available=c.dailySupplyLiters+(repaired?c.restoredLitersPerDay:0)+(delivered?c.deliveryLitersPerDay:0);
 const fromStorage=Math.min(stored,Math.max(0,demand-available));stored-=fromStorage;
 const unmet=Math.max(0,demand-available-fromStorage);dailyUnmetLiters[d]+=unmet;total+=unmet;
 }}
 return {actions,cost:actions.reduce((a,b)=>a+b.cost,0),unmetLiters:total,unmetPersonDays:total/s.litersPerPersonPerDay,dailyUnmetLiters,method};
}
export function communityOptions(s:Scenario,id:string):Action[][]{
 const c=s.communities.find(c=>c.id===id);if(!c)throw Error('Unknown community');
 const repair:Action={communityId:id,type:'repair',startDay:0,durationDays:c.repairDays,cost:c.repairCost};
 const options:Action[][]=[[],[repair]];
 for(let start=0;start<s.days;start++)for(let len=1;len<=s.days-start;len++){
 const delivery:Action={communityId:id,type:'delivery',startDay:start,durationDays:len,cost:len*c.deliveryCostPerDay};
 options.push([delivery],[repair,delivery]);
 }
 return options;
}
type State={cost:number;unmet:number;actions:Action[]};
/** Removes dominated states: a cheaper state with <= unmet makes a dearer one irrelevant. */
function pareto(states:State[]):State[]{
 const byCost=new Map<number,State>();
 for(const st of states){const prev=byCost.get(st.cost);if(!prev||st.unmet<prev.unmet)byCost.set(st.cost,st);}
 const sorted=[...byCost.values()].sort((a,b)=>a.cost-b.cost);
 const kept:State[]=[];let best=Infinity;
 for(const st of sorted){if(st.unmet<best-1e-8){kept.push(st);best=st.unmet;}}
 return kept;
}
export function optimize(s:Scenario):Plan{
 validateScenario(s);
 let frontier:State[]=[{cost:0,unmet:0,actions:[]}];
 for(const c of s.communities){
  const opts=pareto(communityOptions(s,c.id).map(actions=>({actions,cost:actions.reduce((sum,a)=>sum+a.cost,0),unmet:evaluate({...s,communities:[c]},actions).unmetLiters})).filter(o=>o.cost<=s.budget));
  const next:State[]=[];
  for(const st of frontier)for(const op of opts){const cost=st.cost+op.cost;if(cost<=s.budget)next.push({cost,unmet:st.unmet+op.unmet,actions:[...st.actions,...op.actions]});}
  frontier=pareto(next);
 }
 const winner=frontier.reduce((best,st)=>st.unmet<best.unmet-1e-8||Math.abs(st.unmet-best.unmet)<1e-8&&st.cost<best.cost?st:best);
 return evaluate(s,winner.actions,'exact within modelled option space (multiple-choice knapsack DP)');
}
export function repairOnly(s:Scenario):Plan{validateScenario(s);const actions:Action[]=[];for(const c of [...s.communities].sort((a,b)=>b.people-a.people)){if(actions.reduce((x,a)=>x+a.cost,0)+c.repairCost<=s.budget)actions.push({communityId:c.id,type:'repair',startDay:0,durationDays:c.repairDays,cost:c.repairCost});}return evaluate(s,actions,'population-first repair-only baseline');}
export function cheapestFirstRepair(s:Scenario):Plan{validateScenario(s);const actions:Action[]=[];for(const c of [...s.communities].sort((a,b)=>a.repairCost-b.repairCost)){if(actions.reduce((x,a)=>x+a.cost,0)+c.repairCost<=s.budget)actions.push({communityId:c.id,type:'repair',startDay:0,durationDays:c.repairDays,cost:c.repairCost});}return evaluate(s,actions,'cheapest-first repair baseline');}
export function deliveryOnly(s:Scenario):Plan{
 validateScenario(s);
 let frontier:State[]=[{cost:0,unmet:0,actions:[]}];
 for(const c of s.communities){const opts=pareto(communityOptions(s,c.id).filter(a=>a.every(x=>x.type==='delivery')).map(actions=>({actions,cost:actions.reduce((sum,a)=>sum+a.cost,0),unmet:evaluate({...s,communities:[c]},actions).unmetLiters})).filter(o=>o.cost<=s.budget));const next:State[]=[];for(const st of frontier)for(const op of opts){const cost=st.cost+op.cost;if(cost<=s.budget)next.push({cost,unmet:st.unmet+op.unmet,actions:[...st.actions,...op.actions]});}frontier=pareto(next);}
 const best=frontier.reduce((a,b)=>b.unmet<a.unmet?b:a);return evaluate(s,best.actions,'delivery-only baseline (exact within modelled option space)');
}
export function noAction(s:Scenario):Plan{validateScenario(s);return evaluate(s,[],'no-action baseline');}
