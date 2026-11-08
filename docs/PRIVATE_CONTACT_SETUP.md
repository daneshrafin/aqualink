# AquaLink v1.5: private callback numbers (prototype)

1. In Supabase SQL Editor run `sql/001_initial.sql`, `002_ngo_workflow.sql`, `003_public_intake.sql`, then `004_private_contacts.sql` IN ORDER. Migration 004 disables the previous phone-free public intake RPC.
2. Set `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; restart Next.js. Never place a service/secret key in the browser or repository.
3. In `/report`, contact number is required for both local and opt-in shared reports. The shared endpoint now submits the phone to `report_private_contacts` (private table), and public reports list never includes it. The opt-in checkbox stays off by default.
4. A trusted Supabase database administrator must verify an organization, activate an officer membership, and assign a shared report (`reports.organization_id`, `status='assigned'`). No public UI can self-approve these roles or assignments.
5. The officer signs in on `/account`, then opens `/ngo/contact` and enters the shared report UUID. The server validates the Supabase token and calls a security-definer RPC that checks verified org, active officer membership and assigned report. Unauthorized requests return 404 without revealing whether a phone exists.
6. No automatic SMS sending or NGO dispatch exists. Browser-local demo reports are NOT synchronized with shared reports and should not be used with real phone numbers.

**Not production-ready:** rate limiting, CAPTCHA, abuse controls, consent and privacy policy, data retention/deletion, audit logging of contact reads, and independent security review are required before collecting real personal data. A honeypot is a minimal anti-bot measure, not sufficient protection. Test authorization with two organizations and an anonymous user in an isolated Supabase project.
