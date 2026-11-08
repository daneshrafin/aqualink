export type LabourInput={workers:number;days:number;singleRate:1000|1500;foodExtra:boolean};
export function estimateLabour({workers,days,singleRate,foodExtra}:LabourInput){
 if(!Number.isSafeInteger(workers)||workers<1||workers>20||!Number.isSafeInteger(days)||days<1||days>365||![1000,1500].includes(singleRate))throw Error('Invalid labour estimate');
 const daily=workers===1?singleRate:1800+(workers-2)*800;
 const labour=daily*days,food=foodExtra?workers*150*days:0;
 return {labour,food,total:labour+food};
}
