import {NextResponse} from 'next/server';
import {z} from 'zod';
import {authorizedClient,unauthorized} from '@/lib/serverAuth';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const ctx=await authorizedClient(req);if(!ctx)return unauthorized();
 const [queue,orgs]=await Promise.all([ctx.db.rpc('admin_review_queue'),ctx.db.rpc('admin_verified_organizations')]);
 if(queue.error||orgs.error)return NextResponse.json({error:'Admin access denied or migration 005 is missing.'},{status:403});
 return NextResponse.json({reports:queue.data,organizations:orgs.data},{headers:{'Cache-Control':'no-store'}});
}
const schema=z.object({reportId:z.string().uuid(),action:z.enum(['verify','reject','assign']),organizationId:z.string().uuid().nullable().optional()}).strict();
export async function POST(req:Request){
 const ctx=await authorizedClient(req);if(!ctx)return unauthorized();
 let input:z.infer<typeof schema>;try{input=schema.parse(await req.json())}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
 const {data,error}=await ctx.db.rpc('admin_review_report',{p_report_id:input.reportId,p_action:input.action,p_organization_id:input.organizationId??null});
 if(error)return NextResponse.json({error:'Review rejected. Check permissions, report status, and verified organization.'},{status:403});
 return NextResponse.json({status:data},{headers:{'Cache-Control':'no-store'}});
}
