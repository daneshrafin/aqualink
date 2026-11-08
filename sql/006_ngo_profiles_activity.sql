-- Apply AFTER sql/001_initial.sql and sql/005_admin_review.sql.
-- Authenticated users can edit their OWN contact preferences; no self-verification or role changes.
create table if not exists public.ngo_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (char_length(display_name) <= 100),
 job_title text not null default '' check (char_length(job_title) <= 100),
 contact_phone text not null default '' check (char_length(contact_phone) <= 25),
 bio text not null default '' check (char_length(bio) <= 500),
 notify_by_email boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.ngo_profiles enable row level security;
revoke all on public.ngo_profiles from anon;
grant select,insert,update on public.ngo_profiles to authenticated;
drop policy if exists ngo_profiles_self_select on public.ngo_profiles;
create policy ngo_profiles_self_select on public.ngo_profiles for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists ngo_profiles_self_insert on public.ngo_profiles;
create policy ngo_profiles_self_insert on public.ngo_profiles for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists ngo_profiles_self_update on public.ngo_profiles;
create policy ngo_profiles_self_update on public.ngo_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Read-only audit projection. Only the signed-in actor's events in an active,
-- VERIFIED organization are returned. Never expose event details or phone numbers.
create or replace function public.my_ngo_activity(p_limit integer default 30)
returns table(action text,entity_type text,created_at timestamptz,organization_name text)
language sql stable security definer set search_path = '' as $$
 select e.action,e.entity_type,e.created_at,o.name
 from public.audit_events e
 join public.organizations o on o.id=e.organization_id
 join public.memberships m on m.organization_id=o.id
 where e.actor_id=(select auth.uid())
   and m.user_id=(select auth.uid()) and m.active and o.verified
 order by e.created_at desc limit least(greatest(coalesce(p_limit,30),1),100)
$$;
revoke all on function public.my_ngo_activity(integer) from public;
grant execute on function public.my_ngo_activity(integer) to authenticated;
-- Activity records are created by authorized server workflows, NOT by the user.
-- Existing demo/localStorage actions are intentionally excluded.
