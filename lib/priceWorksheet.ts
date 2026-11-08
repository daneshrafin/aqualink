export type WorksheetItem = {id:string;en:string;category:string;unit:string;price:number;kind:'published'|'assumption'|'demo';source?:string;date:string};
export function priceEvidenceLabel(kind:WorksheetItem['kind']) {
  return kind==='demo'?'example (demo) / উদাহরণ (ডেমো)':kind==='published'?'Listed price (date, source) / তালিকাভুক্ত দাম':'Scenario assumption / পরিস্থিতিগত অনুমান';
}
export function worksheetTotal(items:WorksheetItem[],quantity:Record<string,number>,prices:Record<string,number>) {
  return items.filter(x=>(quantity[x.id]||0)>0).reduce((sum,x)=>sum+quantity[x.id]*(prices[x.id]??x.price),0);
}
export function worksheetCsv(items:WorksheetItem[],quantity:Record<string,number>,prices:Record<string,number>) {
  const rows=[['item','category','unit','quantity','unit_price_bdt','subtotal_bdt','price_evidence','source','reference_reviewed'],
    ...items.filter(x=>(quantity[x.id]||0)>0).map(x=>[x.en,x.category,x.unit,quantity[x.id],prices[x.id]??x.price,quantity[x.id]*(prices[x.id]??x.price),x.kind==='demo'?'example (demo)':x.kind,x.source||'',x.date])];
  return rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
}
