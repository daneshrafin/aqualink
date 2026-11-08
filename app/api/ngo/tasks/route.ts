import {NextResponse} from 'next/server';
import {z} from 'zod';
import {authorizedClient, unauthorized} from '@/lib/serverAuth';
const createSchema = z.object({
  organizationId: z.string().uuid(),
  reportId: z.string().uuid().nullable().optional(),
  kind: z.enum(['verification','repair','delivery']),
  costEstimate: z.number().nonnegative().max(100000000).nullable().optional()
});
export async function GET(request: Request) {
  const auth = await authorizedClient(request);
  if (!auth) return unauthorized();
  const org = new URL(request.url).searchParams.get('organizationId');
  if (!org || !z.string().uuid().safeParse(org).success) return NextResponse.json({error:'Valid organizationId required'},{status:400});
  const {data,error} = await auth.db.from('response_tasks')
    .select('id,organization_id,report_id,assigned_to,kind,status,cost_estimate,created_at,updated_at')
    .eq('organization_id',org).order('created_at',{ascending:false}).limit(100);
  if (error) return NextResponse.json({error:'Unable to load tasks'},{status:403});
  return NextResponse.json({tasks:data});
}
export async function POST(request: Request) {
  const auth = await authorizedClient(request);
  if (!auth) return unauthorized();
  const body = createSchema.safeParse(await request.json().catch(()=>null));
  if (!body.success) return NextResponse.json({error:'Invalid task input'},{status:400});
  const v=body.data;
  const {data,error}=await auth.db.from('response_tasks').insert({
    organization_id:v.organizationId,report_id:v.reportId??null,
    kind:v.kind,cost_estimate:v.costEstimate??null
  }).select('id,kind,status,created_at').single();
  if(error) return NextResponse.json({error:'Not authorized or task could not be created'},{status:403});
  return NextResponse.json({task:data},{status:201});
}
