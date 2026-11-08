-- v1.6 trusted moderation. Apply after 001-004.
-- Bootstrap administrators ONLY through the Supabase SQL editor, never through public APIs.
create table if not exists public.platform_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from public, anon, authenticated;

create or replace function public.admin_review_queue()
returns table(id uuid,title text,area text,kind text,people_affected integer,status text,organization_id uuid,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.platform_admins a where a.user_id=auth.uid()) then
  raise exception 'Not authorized' using errcode='42501';
 end if;
 return query select r.id,r.title,r.area,r.kind,r.people_affected,r.status,r.organization_id,r.created_at
 from public.reports r where r.status in ('pending','verified','assigned','rejected')
 order by r.created_at desc limit 200;
end $$;
revoke all on function public.admin_review_queue() from public;
grant execute on function public.admin_review_queue() to authenticated;

create or replace function public.admin_verified_organizations()
returns table(id uuid,name text)
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.platform_admins a where a.user_id=auth.uid()) then
  raise exception 'Not authorized' using errcode='42501';
 end if;
 return query select o.id,o.name from public.organizations o where o.verified=true order by o.name;
end $$;
revoke all on function public.admin_verified_organizations() from public;
grant execute on function public.admin_verified_organizations() to authenticated;

create or replace function public.admin_review_report(p_report_id uuid,p_action text,p_organization_id uuid default null)
returns text language plpgsql security definer set search_path = '' as $$
declare old_status text; next_status text;
begin
 if auth.uid() is null or not exists(select 1 from public.platform_admins a where a.user_id=auth.uid()) then
  raise exception 'Not authorized' using errcode='42501';
 end if;
 if p_action not in ('verify','reject','assign') then raise exception 'Invalid action'; end if;
 select status into old_status from public.reports where id=p_report_id for update;
 if not found then raise exception 'Report not found'; end if;
 if p_action in ('verify','reject') and old_status <> 'pending' then raise exception 'Report already reviewed'; end if;
 if p_action='assign' and old_status <> 'verified' then raise exception 'Verify report before assignment'; end if;
 if p_action='assign' and not exists(select 1 from public.organizations where id=p_organization_id and verified=true) then
  raise exception 'Choose a verified organization';
 end if;
 next_status:=case p_action when 'verify' then 'verified' when 'reject' then 'rejected' else 'assigned' end;
 update public.reports set status=next_status,
 organization_id=case when p_action='assign' then p_organization_id else null end,
 updated_at=now() where id=p_report_id;
 insert into public.audit_events(actor_id,organization_id,entity_type,entity_id,action,details)
 values(auth.uid(),case when p_action='assign' then p_organization_id else null end,
 'report',p_report_id,'admin_'||p_action,jsonb_build_object('previous_status',old_status,'new_status',next_status));
 return next_status;
end $$;
revoke all on function public.admin_review_report(uuid,text,uuid) from public;
grant execute on function public.admin_review_report(uuid,text,uuid) to authenticated;
-- Bootstrap example (replace with a REAL Supabase Auth user UUID):
-- insert into public.platform_admins(user_id) values ('00000000-0000-0000-0000-000000000000');
