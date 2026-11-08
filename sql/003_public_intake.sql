-- v1.0 public intake: run after 001_initial.sql and 002_ngo_workflow.sql.
-- Anonymous submissions are always pending. No personal details or coordinates are stored.
create or replace function public.submit_community_report(
  p_title text, p_area text, p_kind text, p_people_affected integer, p_description text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if p_title is null or length(trim(p_title)) not between 5 and 140
     or p_area is null or length(trim(p_area)) not between 2 and 120
     or p_kind not in ('broken_pump','shortage','suspected_contamination','other')
     or p_people_affected is null or p_people_affected < 0 or p_people_affected > 1000000
     or length(coalesce(p_description,'')) > 2000 then
    raise exception 'Invalid report input';
  end if;
  insert into public.reports(title,area,kind,people_affected,description,status)
  values(trim(p_title),trim(p_area),p_kind,p_people_affected,nullif(trim(p_description),''),'pending')
  returning id into new_id;
  return new_id;
end; $$;
revoke all on function public.submit_community_report(text,text,text,integer,text) from public;
grant execute on function public.submit_community_report(text,text,text,integer,text) to anon,authenticated;
-- Operational note: put abuse prevention (CAPTCHA / rate limits) in front of public intake before deployment.
-- Pending reports are NOT exposed by list_public_reports().
