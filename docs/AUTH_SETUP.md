# v0.7 optional Supabase authentication setup

The app remains usable as a **local competition demo** without Supabase. Never enter real emergency reports or sensitive personal data in demo mode.

1. Create a Supabase project under your own account. Enable Email auth in Authentication → Providers. Configure the approved site URL and redirect URLs for your deployed domain before deploying. For local development, allow `http://localhost:3000`.
2. In Supabase SQL Editor, inspect and execute `sql/001_initial.sql`. It creates a membership model and conservative RLS policies. Review them against your own threat model before production.
3. In `aquarescue-os/.env.local` (not committed), add:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

4. Run `npm.cmd install`, then `npm.cmd run dev` on Windows. Visit `/account` and create a **test** account. If email confirmation is enabled, follow the email link. Confirm sign-in and sign-out.
5. Signing up does **not** grant NGO or admin access. Memberships must be provisioned by a trusted administrator through an independently secured process. No self-approval UI or permissive membership-insert policy is included.

## Security boundary / what is not implemented

- `/operations`, `/resources`, `/dashboard`, and `/admin` are still local demo workspaces and **are not protected by server-side authorization**. Do not expose them as real NGO tools.
- The demo reports use localStorage, not the Supabase reports table. Different browsers do not synchronize reports or assignments.
- No real-time NGO workflow, server-authorized dispatch, secure user invitation, public report tracking token, or production abuse prevention has been implemented.
- Never use a Supabase `service_role` key in `NEXT_PUBLIC_` variables or browser code.
- Before production: implement server-side verified membership checks for all sensitive pages and writes, strict RLS, secure invitations, rate limiting/CAPTCHA for public submissions, consent/privacy and retention controls, audit logging, monitoring, and real-world safety verification.
