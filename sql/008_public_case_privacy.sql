-- v2.9.2: Privacy hardening for public organization progress. Apply AFTER 007.
-- Free-form titles and areas may contain personal information.
-- Keep the existing RPC result shape to avoid breaking older clients.
-- Display only a controlled issue label and a withheld location.
create or replace function public.public_case_progress()
returns table(report_id uuid,title text,area text,status text,organization_name text)
language sql stable security definer set search_path = '' as $$
 select r.id,
   case r.kind
     when 'broken_pump' then 'Broken water point'
     when 'shortage' then 'Water shortage'
     when 'suspected_contamination' then 'Water quality concern'
     else 'Water-related report' end::text as title,
   'Location withheld for privacy'::text as area,
   r.status, o.name
 from public.reports r
 left join public.organizations o on o.id=r.organization_id and o.verified=true
 where r.status in ('verified','assigned','resolved')
 order by r.updated_at desc limit 250;
$$;
revoke all on function public.public_case_progress() from public;
grant execute on function public.public_case_progress() to anon,authenticated;
-- This migration does NOT audit other public RPCs such as list_public_reports.
-- Review their free-text fields before accepting real personal data.
