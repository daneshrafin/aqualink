import type {ReportKind} from './reportKinds';
export type SmsIssue='PUMP'|'SHORTAGE'|'QUALITY'|'SANITATION'|'OTHER';
export type SmsReport={area:string;issue:SmsIssue;people:number;details:string;contactPhone:string};
const issues=['PUMP','SHORTAGE','QUALITY','SANITATION','OTHER'];
export function validPhone(phone:string){return /^(?:\+?88)?01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g,''));}
export function encodeSms(r:SmsReport){const clean=(s:string,n:number)=>s.replace(/[|\r\n]/g,' ').trim().slice(0,n);if(!validPhone(r.contactPhone))throw Error('Valid contact mobile number required');return `AQ2|${r.issue}|${clean(r.area,70)}|${Math.floor(r.people)}|${clean(r.contactPhone,14)}|${clean(r.details,180)}`;}
export function parseSms(raw:string):SmsReport{const parts=raw.trim().split('|');if(parts.length!==6||parts[0]!=='AQ2')throw Error('Invalid format. Expected AQ2|ISSUE|AREA|PEOPLE|PHONE|DETAILS');const issue=parts[1];if(!issues.includes(issue))throw Error('Issue must be PUMP, SHORTAGE, QUALITY, SANITATION or OTHER');const area=parts[2].trim(),details=parts[5].trim(),contactPhone=parts[4].trim(),people=Number(parts[3]);if(area.length<2||area.length>70||!Number.isSafeInteger(people)||people<0||people>1000000||details.length>180||!validPhone(contactPhone))throw Error('Invalid area, people estimate or details');return {issue:issue as SmsIssue,area,people,details,contactPhone};}

export const smsReportKinds:Record<SmsIssue,ReportKind>={PUMP:'broken_pump',SHORTAGE:'shortage',QUALITY:'suspected_contamination',SANITATION:'sanitation_hygiene',OTHER:'other'};
