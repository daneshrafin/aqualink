-- v2.9.3: minimize free-text exposure. Apply after 008.
-- Keep existing RPC signature to avoid breaking consumers.
create or replace function public.list_public_reports()
returns table(id uuid,title text,area text,kind text,people_affected integer,status text,created_at timestamptz)
language sql stable security definer set search_path = '' as $$
 select r.id,
 case r.kind when 'broken_pump' then 'Broken water point' when 'shortage' then 'Water shortage' when 'suspected_contamination' then 'Water quality concern' else 'Water-related report' end::text,
 'Location withheld for privacy'::text,
 r.kind,r.people_affected,r.status,r.created_at
 from public.reports r where r.status in ('verified','assigned','resolved')
 order by r.created_at desc limit 100;
$$;
revoke all on function public.list_public_reports() from public;
grant execute on function public.list_public_reports() to anon,authenticated;
-- Legacy view is not publicly granted, but avoid keeping a sensitive projection.
create or replace view public.public_reports with (security_invoker=true) as
 select r.id,
 case r.kind when 'broken_pump' then 'Broken water point' when 'shortage' then 'Water shortage' when 'suspected_contamination' then 'Water quality concern' else 'Water-related report' end::text as title,
 'Location withheld for privacy'::text as area,
 r.kind,r.people_affected,r.status,r.created_at
 from public.reports r where r.status in ('verified','assigned','resolved');
revoke all on public.public_reports from anon,authenticated;
-- Real deployment still needs independent permission, privacy, retention and abuse testing.
