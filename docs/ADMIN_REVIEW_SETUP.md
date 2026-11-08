# AquaLink v1.6 — trusted moderation setup

**Prototype only. Do not collect real emergency contacts before a security and privacy review.**

1. Create a Supabase project and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Never put a service-role key in a browser or repository.
2. Apply SQL files **in order**: `001_initial.sql`, `002_ngo_workflow.sql`, `003_public_intake.sql`, `004_private_contacts.sql`, `005_admin_review.sql` in the Supabase SQL editor.
3. Create an administrator through Supabase Auth (email signup/login). Copy their **actual Auth user UUID** from the Supabase dashboard.
4. In the trusted SQL editor only, run `insert into public.platform_admins(user_id) values ('REPLACE-WITH-REAL-UUID');`. Never add a public endpoint for admin self-enrollment.
5. Add verified organizations using the trusted SQL editor, e.g. `insert into public.organizations(name,verified) values ('Demo NGO',true);`. For a responder, approve their organization membership in the trusted SQL editor with their actual Auth user UUID, organization UUID, `role='officer'`, `active=true`.
6. Log in as the platform administrator at `/account`, open `/admin/review`, load the queue, verify a **synthetic** pending report, then assign it to a verified organization.
7. Log out; log in as an approved officer from that organization; visit `/ngo/contact` with the shared report UUID. A user from a different organization, inactive membership, field worker, or anonymous visitor must not see the phone.
8. Confirm public `/shared-reports` and `/map` do not expose phone numbers. Confirm unverified and rejected reports are not public.

## Important limits
- No real SMS gateway, SMS delivery, or emergency dispatch is provided.
- Admins are bootstrapped manually; organization verification and member approval remain trusted SQL-editor operations.
- No CAPTCHA, server-enforced rate limit, security monitoring, phone-number encryption-at-rest policy, retention schedule, incident response plan, or independent security audit is included.
- The API uses Supabase Auth JWTs; RLS and narrowly scoped SECURITY DEFINER functions enforce privileges. Never expose the admin table directly.
- This is **not a production-ready emergency system**. Use fictional test contacts only.
