-- AquaLink sanitation category. Apply AFTER 001–009 in the Supabase SQL editor.
-- Additive category only: same pending intake, private contacts, reviewed visibility,
-- membership checks, claim function and progress updates. No demo rows are inserted.
-- Transactional replacement appends controlled kind metadata to public case progress.
begin;
alter table public.reports drop constraint if exists reports_kind_check;
alter table public.reports add constraint reports_kind_check
 check (kind in ('broken_pump','shortage','suspected_contamination','sanitation_hygiene','other'));

create or replace function public.submit_community_report_with_contact(
 p_title text, p_area text, p_kind text, p_people_affected integer,
 p_phone text, p_description text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
 if p_title is null or length(trim(p_title)) not between 5 and 140
 or p_area is null or length(trim(p_area)) not between 2 and 120
 or p_kind is null or p_kind not in ('broken_pump','shortage','suspected_contamination','sanitation_hygiene','other')
 or p_people_affected is null or p_people_affected not between 0 and 1000000
 or p_phone is null or p_phone !~ '^01[3-9][0-9]{8}$'
 or length(coalesce(p_description,'')) > 2000 then
  raise exception 'Invalid report input';
 end if;
 insert into public.reports(title,area,kind,people_affected,description,status)
 values(trim(p_title),trim(p_area),p_kind,p_people_affected,nullif(trim(p_description),''),'pending')
 returning id into new_id;
 insert into public.report_private_contacts(report_id,phone) values(new_id,p_phone);
 return new_id;
end; $$;
revoke all on function public.submit_community_report_with_contact(text,text,text,integer,text,text) from public;
grant execute on function public.submit_community_report_with_contact(text,text,text,integer,text,text) to anon,authenticated;


create or replace function public.list_public_reports()
returns table(id uuid,title text,area text,kind text,people_affected integer,status text,created_at timestamptz)
language sql stable security definer set search_path = '' as $$
 select r.id,
 case r.kind when 'broken_pump' then 'Broken water point' when 'shortage' then 'Water shortage' when 'suspected_contamination' then 'Water quality concern' when 'sanitation_hygiene' then 'Sanitation / hygiene problem' else 'Water-related report' end::text,
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
 case r.kind when 'broken_pump' then 'Broken water point' when 'shortage' then 'Water shortage' when 'suspected_contamination' then 'Water quality concern' when 'sanitation_hygiene' then 'Sanitation / hygiene problem' else 'Water-related report' end::text as title,
 'Location withheld for privacy'::text as area,
 r.kind,r.people_affected,r.status,r.created_at
 from public.reports r where r.status in ('verified','assigned','resolved');
revoke all on public.public_reports from anon,authenticated;

-- Existing clients may ignore the appended kind column. Free text remains redacted.
drop function public.public_case_progress();
create or replace function public.public_case_progress()
returns table(report_id uuid,title text,area text,status text,organization_name text,kind text)
language sql stable security definer set search_path = '' as $$
 select r.id,
   case r.kind
     when 'broken_pump' then 'Broken water point'
     when 'shortage' then 'Water shortage'
     when 'suspected_contamination' then 'Water quality concern'
     when 'sanitation_hygiene' then 'Sanitation / hygiene problem'
     else 'Water-related report' end::text as title,
   'Location withheld for privacy'::text as area,
   r.status, o.name, r.kind
 from public.reports r
 left join public.organizations o on o.id=r.organization_id and o.verified=true
 where r.status in ('verified','assigned','resolved')
 order by r.updated_at desc limit 250;
$$;
revoke all on function public.public_case_progress() from public;
grant execute on function public.public_case_progress() to anon,authenticated;

commit;
