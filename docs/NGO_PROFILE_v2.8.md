# NGO profile & audit activity (v2.8)

## Enable
1. Create a Supabase project and enable email authentication.
2. Apply the existing SQL migrations in order, including `001_initial.sql` and `005_admin_review.sql` (and their prerequisites), then `006_ngo_profiles_activity.sql`.
3. Configure `.env.local` with the public URL and anon key (see `AUTH_SETUP.md`). **Never put a service-role key in client code.**
4. Sign in at `/account`. A user can edit only their own `ngo_profiles` row via RLS.
5. A trusted administrator must separately verify an organization and provision/activate memberships. Signup, editing profile, or choosing Help Others cannot approve an organization.

## Security and scope
- The organization name/verification badge is read from `organizations` under existing RLS; it is not a user-editable claim.
- `my_ngo_activity` returns only the actor's own events in verified organizations with an active membership. It excludes event details and contact information. No audit insert permission is given to the browser.
- Events from `admin_review_report` may have `organization_id = null` for verify/reject; those are intentionally not exposed by this organization-scoped activity list.
- The existing local Response Desk, Planner, Resources, and role-switcher are **not protected production NGO systems**. Do not use them for sensitive real cases.
- Profile notification preference is stored but **no email notifications are sent**.
- This does not implement an administrator organization-verification UI, real secure invitations, cross-browser report workflow, or a full compliance-grade audit dashboard.
- Before deployment: secure all NGO routes server-side, enforce organization scope and RLS on every write, implement invitation/verification procedures, data retention/deletion, consent, monitoring, and security review.
