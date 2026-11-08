/** Demo-only cost worksheet handoff; never treats retail inventory as a verified service quote. */
export type CostLine={id:string;category:string;quantity:number;unitPrice:number};
export type CostProposal={version:1;repairCost:number;deliveryCostPerDay:number;deliveryDays:number;createdAt:string;basis:'scenario_assumption';lines:CostLine[]};
export function createCostProposal(lines:CostLine[],deliveryDays:number,createdAt:string):CostProposal{
 if(!Number.isSafeInteger(deliveryDays)||deliveryDays<1||deliveryDays>365)throw Error('Delivery days must be 1–365');
 for(const l of lines)if(!Number.isSafeInteger(l.quantity)||l.quantity<0||!Number.isSafeInteger(l.unitPrice)||l.unitPrice<0)throw Error('Use non-negative whole-number prices and quantities');
 const repairCost=lines.filter(l=>l.category==='Repair').reduce((s,l)=>s+l.quantity*l.unitPrice,0);
 const deliveryTotal=lines.filter(l=>l.category==='Transport').reduce((s,l)=>s+l.quantity*l.unitPrice,0);
 if(!Number.isSafeInteger(repairCost)||!Number.isSafeInteger(deliveryTotal))throw Error('Cost exceeds supported range');
 if(!repairCost&&!deliveryTotal)throw Error('Select at least one repair or transport item');
 return {version:1,repairCost,deliveryCostPerDay:Math.ceil(deliveryTotal/deliveryDays),deliveryDays,createdAt,basis:'scenario_assumption',lines};
}
export function isCostProposal(x:unknown):x is CostProposal{
 if(!x||typeof x!=='object')return false;
 const p=x as Partial<CostProposal>;
 return p.version===1&&p.basis==='scenario_assumption'&&Number.isSafeInteger(p.repairCost)&&Number.isSafeInteger(p.deliveryCostPerDay)&&(p.repairCost as number)>=0&&(p.deliveryCostPerDay as number)>=0&&Number.isSafeInteger(p.deliveryDays)&&(p.deliveryDays as number)>=1&&(p.deliveryDays as number)<=365&&Array.isArray(p.lines);
}
