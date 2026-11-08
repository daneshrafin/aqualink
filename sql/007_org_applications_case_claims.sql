-- v2.9: apply after 001-006. Trusted administrators operate via Supabase SQL editor.
-- Never expose the service-role key or approve applications from the public client.
create table if not exists public.organization_applications (
 id uuid primary key default gen_random_uuid(), applicant_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 3 and 160),
 organization_type text not null check (organization_type in ('ngo','community_group','volunteer_team','foundation','other')),
 district text not null check (char_length(trim(district)) between 2 and 100),
 address text not null check (char_length(trim(address)) between 5 and 400),
 contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
 contact_phone text not null check (char_length(trim(contact_phone)) between 7 and 25),
 description text not null default '' check (char_length(description)<=1000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.organization_applications enable row level security;
revoke all on public.organization_applications from public,anon,authenticated;
grant select on public.organization_applications to authenticated;
create policy org_applicant_own_read on public.organization_applications for select to authenticated using(applicant_id=(select auth.uid()));
-- Server validates auth.uid() and forcibly sets status to pending.
create or replace function public.apply_for_organization(p_name text,p_type text,p_district text,p_address text,p_contact_name text,p_contact_phone text,p_description text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if exists(select 1 from public.organization_applications where applicant_id=auth.uid() and status='pending') then
  raise exception 'You already have a pending application'; end if;
 insert into public.organization_applications(applicant_id,name,organization_type,district,address,contact_name,contact_phone,description)
 values(auth.uid(),trim(p_name),p_type,trim(p_district),trim(p_address),trim(p_contact_name),trim(p_contact_phone),coalesce(trim(p_description),'')) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.apply_for_organization(text,text,text,text,text,text,text) from public;
grant execute on function public.apply_for_organization(text,text,text,text,text,text,text) to authenticated;
-- Approval performed by platform administrator in SQL editor / trusted backend ONLY.
-- On approval: create organizations row with verified=true and active org_admin membership for applicant.
-- Never make an authenticated-client function that self-approves.
alter table public.organizations add column if not exists organization_type text not null default 'other';
alter table public.organizations add column if not exists district text not null default '';
-- Public directory returns only non-sensitive fields and only approved organizations.
create or replace function public.public_org_leaderboard()
returns table(organization_id uuid,organization_name text,organization_type text,district text,resolved_count bigint,ongoing_count bigint)
language sql stable security definer set search_path = '' as $$
 select o.id,o.name,o.organization_type,o.district,
 count(r.id) filter(where r.status='resolved')::bigint,
 count(r.id) filter(where r.status='assigned')::bigint
 from public.organizations o left join public.reports r on r.organization_id=o.id and r.status in ('assigned','resolved')
 where o.verified=true group by o.id,o.name,o.organization_type,o.district
 order by count(r.id) filter(where r.status='resolved') desc,o.name limit 100;
$$;
revoke all on function public.public_org_leaderboard() from public;
grant execute on function public.public_org_leaderboard() to anon,authenticated;
create or replace function public.public_case_progress()
returns table(report_id uuid,title text,area text,status text,organization_name text)
language sql stable security definer set search_path = '' as $$
 select r.id,
 case r.kind when 'broken_pump' then 'Broken water point' when 'shortage' then 'Water shortage' when 'suspected_contamination' then 'Water quality concern' else 'Water-related report' end::text,
 'Location withheld for privacy'::text,r.status,o.name from public.reports r
 left join public.organizations o on o.id=r.organization_id and o.verified=true
 where r.status in ('verified','assigned','resolved') order by r.updated_at desc limit 250;
$$;
revoke all on function public.public_case_progress() from public;
grant execute on function public.public_case_progress() to anon,authenticated;
-- Race-safe verified-only claim; no contact information exposed to claiming organization by this RPC.
create or replace function public.claim_verified_case(p_report_id uuid,p_organization_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
 if not public.is_org_officer(p_organization_id) then raise exception 'Approved organization officer required' using errcode='42501'; end if;
 update public.reports set organization_id=p_organization_id,status='assigned',updated_at=now()
 where id=p_report_id and status='verified' and organization_id is null;
 if not found then raise exception 'Case is unavailable or already claimed'; end if;
 insert into public.audit_events(actor_id,organization_id,entity_type,entity_id,action,details)
 values(auth.uid(),p_organization_id,'report',p_report_id,'organization_claim',jsonb_build_object('status','assigned'));
 return 'assigned';
end $$;
revoke all on function public.claim_verified_case(uuid,uuid) from public;
grant execute on function public.claim_verified_case(uuid,uuid) to authenticated;
-- Admin-confirmed resolution only: do not let a claiming organization inflate the leaderboard.
create or replace function public.admin_confirm_resolution(p_report_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_org uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.platform_admins where user_id=auth.uid()) then
  raise exception 'Platform administrator required' using errcode='42501'; end if;
 update public.reports set status='resolved',updated_at=now() where id=p_report_id and status='assigned'
 returning organization_id into v_org;
 if not found then raise exception 'Case must be assigned'; end if;
 insert into public.audit_events(actor_id,organization_id,entity_type,entity_id,action)
 values(auth.uid(),v_org,'report',p_report_id,'admin_confirm_resolution');
 return 'resolved';
end $$;
revoke all on function public.admin_confirm_resolution(uuid) from public;
grant execute on function public.admin_confirm_resolution(uuid) to authenticated;
-- Authorized platform administrator only; can be called from a separately protected admin backend.
create or replace function public.admin_decide_org_application(p_application_id uuid,p_approve boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare a public.organization_applications%rowtype; v_org uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.platform_admins where user_id=auth.uid()) then
  raise exception 'Platform administrator required' using errcode='42501'; end if;
 select * into a from public.organization_applications where id=p_application_id and status='pending' for update;
 if not found then raise exception 'Pending application not found'; end if;
 if p_approve then
  insert into public.organizations(name,verified,organization_type,district)
  values(a.name,true,a.organization_type,a.district) returning id into v_org;
  insert into public.memberships(user_id,organization_id,role,active)
  values(a.applicant_id,v_org,'org_admin',true);
 end if;
 update public.organization_applications set status=case when p_approve then 'approved' else 'rejected' end,
 reviewed_by=auth.uid(),reviewed_at=now() where id=p_application_id;
 insert into public.audit_events(actor_id,organization_id,entity_type,entity_id,action)
 values(auth.uid(),v_org,'organization_application',p_application_id,case when p_approve then 'admin_approve_org' else 'admin_reject_org' end);
 return case when p_approve then 'approved' else 'rejected' end;
end $$;
revoke all on function public.admin_decide_org_application(uuid,boolean) from public;
grant execute on function public.admin_decide_org_application(uuid,boolean) to authenticated;
