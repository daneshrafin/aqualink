-- v1.5 PRIVATE CALLBACK CONTACTS. Apply after 001, 002, 003.
-- This is a privacy boundary, NOT a complete emergency-response deployment.
create table if not exists public.report_private_contacts (
 report_id uuid primary key references public.reports(id) on delete cascade,
 phone text not null check (phone ~ '^01[3-9][0-9]{8}$'),
 created_at timestamptz not null default now()
);
alter table public.report_private_contacts enable row level security;
revoke all on public.report_private_contacts from public, anon, authenticated;
-- No direct SELECT, INSERT, UPDATE, DELETE policies. Only narrowly scoped RPCs.
-- Revoke legacy anonymous insert so callers cannot bypass mandatory contact via the table.
revoke insert on public.reports from anon, authenticated;
drop policy if exists report_public_submit on public.reports;
-- Disable old intake RPC, which did not require a callback number.
revoke execute on function public.submit_community_report(text,text,text,integer,text) from anon,authenticated;

create or replace function public.submit_community_report_with_contact(
 p_title text, p_area text, p_kind text, p_people_affected integer,
 p_phone text, p_description text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
 if p_title is null or length(trim(p_title)) not between 5 and 140
 or p_area is null or length(trim(p_area)) not between 2 and 120
 or p_kind is null or p_kind not in ('broken_pump','shortage','suspected_contamination','other')
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

-- A verified organization officer can see the number only AFTER the report is assigned
-- to that organization by a trusted, separately administered moderation process.
create or replace function public.get_assigned_report_contact(p_report_id uuid)
returns table(report_id uuid, phone text)
language sql stable security definer set search_path = '' as $$
 select c.report_id, c.phone
 from public.report_private_contacts c
 join public.reports r on r.id = c.report_id
 join public.organizations o on o.id = r.organization_id and o.verified = true
 join public.memberships m on m.organization_id = o.id
 where c.report_id = p_report_id and r.status in ('assigned','resolved')
 and m.user_id = (select auth.uid()) and m.active = true
 and m.role in ('officer','org_admin')
 limit 1
$$;
revoke all on function public.get_assigned_report_contact(uuid) from public;
grant execute on function public.get_assigned_report_contact(uuid) to authenticated;
-- NOTE: Real deployments additionally need CAPTCHA/rate limits, a verified assignment
-- workflow, secure access logs, retention/deletion policies, and privacy review.
