import type {ReportKind} from './reportKinds';
import type {ReportStatus} from './types';
export const categoryExamples: Record<ReportKind,{id:string;icon:string;en:string;bn:string}> = {
  broken_pump:{id:'AQ-101',icon:'/images/report-pump.svg',en:'Describe what stopped working, when it happened and how many people use the water point.',bn:'কী নষ্ট হয়েছে, কখন থেকে সমস্যা এবং কতজন পানির উৎসটি ব্যবহার করেন তা লিখুন।'},
  shortage:{id:'AQ-102',icon:'/images/report-shortage.svg',en:'Describe the remaining water stock, affected households and how long the shortage has lasted.',bn:'কতটুকু পানি আছে, কত পরিবার ক্ষতিগ্রস্ত এবং কত দিন ধরে সংকট তা লিখুন।'},
  suspected_contamination:{id:'AQ-103',icon:'/images/report-quality.svg',en:'Describe the observed change and any available test information. A report does not establish water safety.',bn:'পানির কী পরিবর্তন দেখেছেন এবং পরীক্ষার তথ্য থাকলে লিখুন। শুধু রিপোর্ট দিয়ে পানির নিরাপত্তা নির্ধারণ হয় না।'},
  sanitation_hygiene:{id:'AQ-SAN-001',icon:'/images/report-sanitation.svg',en:'Describe the affected latrine or handwashing point, missing supplies and approximate users.',bn:'কোন ল্যাট্রিন বা হাত ধোয়ার স্থানে কী সমস্যা, কী অনুপস্থিত এবং কতজন ব্যবহার করেন তা লিখুন।'},
  other:{id:'AQ-204',icon:'/images/report-other.svg',en:'Describe the access or service problem, the location and the people affected.',bn:'যাতায়াত বা সেবার সমস্যা, অবস্থান ও ক্ষতিগ্রস্ত মানুষের তথ্য লিখুন।'},
};
export function reportStatusLabel(status:ReportStatus,lang='en') {
  const labels:Record<ReportStatus,[string,string]>={pending:['Pending review','যাচাইয়ের অপেক্ষায়'],verified:['Verified','যাচাইকৃত'],assigned:['Response assigned','সহায়তার দায়িত্ব দেওয়া হয়েছে'],resolved:['Resolved','সমাধান হয়েছে'],rejected:['Rejected','বাতিল']};
  return labels[status]?.[lang==='bn'?1:0]??status;
}
