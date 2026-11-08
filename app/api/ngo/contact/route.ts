import {NextResponse} from 'next/server';
import {authorizedClient,unauthorized} from '@/lib/serverAuth';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const auth=await authorizedClient(req); if(!auth)return unauthorized();
 const reportId=new URL(req.url).searchParams.get('reportId')||'';
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId))
  return NextResponse.json({error:'Valid shared report UUID required'},{status:400});
 const {data,error}=await auth.db.rpc('get_assigned_report_contact',{p_report_id:reportId});
 if(error)return NextResponse.json({error:'Contact lookup unavailable; check migration 004'},{status:500});
 if(!data?.length)return NextResponse.json({error:'Not available or not authorized'},{status:404});
 return NextResponse.json({reportId,phone:data[0].phone},{headers:{'Cache-Control':'no-store'}});
}
