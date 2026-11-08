-- AquaRescue OS v0.1: run in Supabase SQL editor.
-- RLS is deny-by-default. Public can create unverified reports; public can read only sanitized view.
create extension if not exists pgcrypto;
create table if not exists public.organizations (id uuid primary key default gen_random_uuid(),name text not null,verified boolean not null default false,created_at timestamptz not null default now());
create table if not exists public.memberships (user_id uuid not null references auth.users(id) on delete cascade,organization_id uuid not null references public.organizations(id) on delete cascade,role text not null check(role in ('officer','field_worker','org_admin')),active boolean not null default false,primary key(user_id,organization_id));
create table if not exists public.reports (id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 5 and 140),area text not null,kind text not null check(kind in ('broken_pump','shortage','suspected_contamination','other')),description text,people_affected integer not null default 0 check(people_affected between 0 and 1000000),status text not null default 'pending' check(status in ('pending','verified','rejected','assigned','resolved')),lat numeric(10,7),lng numeric(10,7),reporter_id uuid references auth.users(id) on delete set null,reporter_phone text,organization_id uuid references public.organizations(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.water_points (id uuid primary key default gen_random_uuid(),external_id text,source_name text not null,area text,lat numeric(10,7),lng numeric(10,7),functionality text not null default 'unknown',water_safety text not null default 'unknown' check(water_safety in ('unknown','test_pending','verified_for_specified_use','unsafe')),safety_verified_at timestamptz,safety_evidence_url text,source_dataset text,organization_id uuid references public.organizations(id),created_at timestamptz not null default now());
create table if not exists public.response_resources (id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),resource_type text not null check(resource_type in ('repair_team','delivery_vehicle','water_storage','other')),name text not null,capacity_liters_per_day numeric not null default 0 check(capacity_liters_per_day>=0),available boolean not null default true,notes text,created_at timestamptz not null default now());
create table if not exists public.response_tasks (id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),report_id uuid references public.reports(id),assigned_to uuid references auth.users(id),kind text not null check(kind in ('verification','repair','delivery')),status text not null default 'open' check(status in ('open','assigned','in_progress','completed','cancelled')),cost_estimate numeric check(cost_estimate>=0),completion_evidence text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.planning_scenarios (id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),created_by uuid references auth.users(id),name text not null,inputs jsonb not null,outputs jsonb,assumptions jsonb,created_at timestamptz not null default now());
create table if not exists public.audit_events (id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id),organization_id uuid references public.organizations(id),entity_type text not null,entity_id uuid,action text not null,details jsonb,created_at timestamptz not null default now());
-- A public-facing projection with no reporter identity, sensitive coordinates, or internal notes.
create or replace view public.public_reports with (security_invoker=true) as select id,title,area,kind,people_affected,status,created_at from public.reports where status in ('verified','assigned','resolved');
-- SECURITY NOTE: security_invoker view honors table RLS. Public SELECT on reports is limited to approved statuses.
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.reports enable row level security;
alter table public.water_points enable row level security;
alter table public.response_resources enable row level security;
alter table public.response_tasks enable row level security;
alter table public.planning_scenarios enable row level security;
alter table public.audit_events enable row level security;
-- Block direct public access to potentially sensitive columns by revoking base-table SELECT.
revoke all on public.reports from anon;
revoke all on public.reports from authenticated;
grant insert (title,area,kind,description,people_affected,status) on public.reports to anon,authenticated;
-- Insert policy forces pending and disallows privileged fields.
create policy report_public_submit on public.reports for insert to anon,authenticated with check(status='pending' and organization_id is null and reporter_id is null and reporter_phone is null and lat is null and lng is null);
-- Base table RLS for view reads. Avoid granting base SELECT to anon: instead use a dedicated
-- SECURITY DEFINER RPC returning only sanitized columns. Do not use public_reports view in production.
create or replace function public.list_public_reports() returns table(id uuid,title text,area text,kind text,people_affected integer,status text,created_at timestamptz)
language sql security definer set search_path = '' as $$select r.id,r.title,r.area,r.kind,r.people_affected,r.status,r.created_at from public.reports r where r.status in ('verified','assigned','resolved') order by r.created_at desc limit 100$$;
revoke all on function public.list_public_reports() from public;
grant execute on function public.list_public_reports() to anon,authenticated;
-- Membership visibility is limited to own active memberships.
create policy membership_self on public.memberships for select to authenticated using(user_id=auth.uid());
create policy organization_verified on public.organizations for select to authenticated using(verified=true);
-- No public direct update/delete policies: backend authorization workflows must be added before NGO operations go live.
-- Harden exposed views: don't grant access to the view, which relies on base table permissions.
revoke all on public.public_reports from anon,authenticated;
-- Example internal authorization predicate for future server-side write workflows:
create or replace function public.is_active_member(org uuid) returns boolean language sql stable security definer set search_path = '' as $$select exists(select 1 from public.memberships m join public.organizations o on o.id=m.organization_id where m.user_id=auth.uid() and m.organization_id=org and m.active and o.verified)$$;
revoke all on function public.is_active_member(uuid) from public;
grant execute on function public.is_active_member(uuid) to authenticated;
