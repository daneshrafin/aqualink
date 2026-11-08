import {NextResponse} from 'next/server';
import {z} from 'zod';
import {authorizedClient, unauthorized} from '@/lib/serverAuth';
const schema=z.object({
  status:z.enum(['open','assigned','in_progress','completed','cancelled']),
  assignedTo:z.string().uuid().nullable().optional(),
  completionEvidence:z.string().max(2000).nullable().optional()
});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await authorizedClient(request);
  if(!auth)return unauthorized();
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)return NextResponse.json({error:'Invalid task ID'},{status:400});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Invalid task update'},{status:400});
  const v=parsed.data;
  const {data,error}=await auth.db.from('response_tasks').update({
    status:v.status,
    ...(v.assignedTo!==undefined?{assigned_to:v.assignedTo}:{}),
    ...(v.completionEvidence!==undefined?{completion_evidence:v.completionEvidence}:{}),
    updated_at:new Date().toISOString()
  }).eq('id',id).select('id,status,assigned_to,updated_at').single();
  if(error||!data)return NextResponse.json({error:'Not authorized or task not found'},{status:403});
  return NextResponse.json({task:data});
}
