# AquaLink v0.8 — NGO backend setup

This is a **foundation**, not a live emergency response system. Demo reports and NGO UI remain browser-local. The new API routes store NGO tasks in Supabase and enforce verified organization membership using database RLS.

1. Create a Supabase project and follow `docs/AUTH_SETUP.md` to configure `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Never put a service-role key in browser environment variables.
2. In the Supabase SQL Editor run `sql/001_initial.sql`, then `sql/002_ngo_workflow.sql`.
3. In Supabase Auth create a real user. Using a trusted administrator (SQL Editor), create an organization and set `verified=true`, then add an active membership for that user's UUID with role `officer` or `org_admin`. Do not let users grant themselves memberships.
4. Sign in at `/account`. Get the Supabase session access token in your development client and call the endpoints below with `Authorization: Bearer <access_token>`; the v0.8 NGO UI is **not yet wired** to these endpoints.

Endpoints:
- `GET /api/ngo/tasks?organizationId=<uuid>` — active members of that organization can list tasks.
- `POST /api/ngo/tasks` — officers/org admins create tasks; JSON `{ "organizationId":"<uuid>", "kind":"verification" }`.
- `PATCH /api/ngo/tasks/<uuid>` — officers/org admins update status and optionally assignment/evidence; JSON `{ "status":"in_progress" }`.

Permissions are enforced in Supabase, not by hiding buttons. Requests without a valid token return 401. Cross-organization data is denied by RLS. Public report submission stays pending/unverified.

**Not implemented:** NGO UI integration, secure admin dashboard, audit logging, production report triage, real-time syncing, deployment, location privacy consent and full end-to-end tests. Do not use for real emergency operations.
