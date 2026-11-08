-- v0.8: verified NGO members can manage their own organization tasks.
-- Run AFTER 001_initial.sql in Supabase SQL Editor.
-- Do not grant public or anonymous access to operational records.

create or replace function public.is_org_officer(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = (select auth.uid()) and m.organization_id = org
      and m.active = true and o.verified = true
      and m.role in ('officer', 'org_admin')
  );
$$;
revoke all on function public.is_org_officer(uuid) from public;
grant execute on function public.is_org_officer(uuid) to authenticated;

grant select, insert, update on public.response_tasks to authenticated;
create policy task_org_read_v08 on public.response_tasks for select to authenticated
  using (public.is_active_member(organization_id));
create policy task_org_create_v08 on public.response_tasks for insert to authenticated
  with check (public.is_org_officer(organization_id)
    and (assigned_to is null or exists (
      select 1 from public.memberships m where m.user_id = assigned_to
      and m.organization_id = response_tasks.organization_id and m.active
    )));
create policy task_org_update_v08 on public.response_tasks for update to authenticated
  using (public.is_org_officer(organization_id))
  with check (public.is_org_officer(organization_id)
    and (assigned_to is null or exists (
      select 1 from public.memberships m where m.user_id = assigned_to
      and m.organization_id = response_tasks.organization_id and m.active
    )));
-- Restrict sensitive fields: organization and report ownership cannot be changed after creation.
revoke update on public.response_tasks from authenticated;
grant update (status, assigned_to, completion_evidence, updated_at) on public.response_tasks to authenticated;

-- Only verified members may view their own organization's resources.
grant select on public.response_resources to authenticated;
create policy resources_org_read_v08 on public.response_resources for select to authenticated
  using (public.is_active_member(organization_id));

-- NGO membership is approved out-of-band by a trusted Supabase administrator.
-- No user-facing endpoint in this release can self-approve or verify an organization.
