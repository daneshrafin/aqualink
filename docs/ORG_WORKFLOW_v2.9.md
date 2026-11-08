# Organization workflow — v2.9 preview

1. Configure Supabase and run SQL migrations 001 through 007 in order. Never expose a service-role key in a browser.
2. Any authenticated user may submit an organization application with contact name, phone, address, district and organization type. Submission is **not** verification. Personal details are not in the public directory.
3. Platform operators review applications in the Supabase SQL editor or a separately secured admin service. The public webapp deliberately contains no approval control. Operators must verify identity externally and record evidence.
4. After verification, an authorized operator creates a verified `organizations` record and active `memberships` record for the applicant, then marks the application approved in a trusted transaction. Example (replace UUIDs and fields; run only as trusted DB operator):

```sql
begin;
insert into public.organizations(name,verified,organization_type,district)
values ('Verified community group',true,'community_group','Khulna') returning id;
-- Use returned organization UUID and applicant_id from reviewed application:
insert into public.memberships(user_id,organization_id,role,active)
values ('APPLICANT_UUID','ORGANIZATION_UUID','org_admin',true);
update public.organization_applications set status='approved',reviewed_at=now(),reviewed_by='ADMIN_UUID'
where id='APPLICATION_UUID' and status='pending';
commit;
```

5. A platform admin verifies a report using the existing moderation workflow. Only verified, unclaimed reports can be claimed, using the atomic `claim_verified_case` RPC and an active approved officer membership.
6. A claim is an assignment, **not** proof of work completed. v2.9 includes public case progress and a leaderboard that counts only **administrator-confirmed** resolutions. Organizations cannot directly self-confirm resolution.
7. This release does **not** implement secure evidence uploads, dispute resolution, operator admin dashboard, production-ready audit retention, or cross-browser SMS/online ingestion. Those require backend integration and operational review before real use.
8. A production operator should enforce application review, legal privacy notices, contact verification, rate limits, moderation, case reassignment, dispute handling and audit retention.

## Support contact

No verified project support email or phone was supplied. The Guide shows a truthful placeholder rather than invented contact details. Add approved contact information before deployment.

### Admin-controlled approval helper

Migration 007 includes `admin_decide_org_application(application_uuid, true|false)`. It requires the authenticated user to exist in `platform_admins`, uses a row lock, and writes an audit event. The function is not linked from public navigation. Administrators should use a secured internal console or authenticated SQL/backend workflow to review and invoke it; do not expose admin credentials or service-role keys.
