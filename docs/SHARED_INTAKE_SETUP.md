# AquaLink v1.0 shared intake (opt-in prototype)

1. Create a Supabase project and run SQL files in order: `sql/001_initial.sql`, `sql/002_ngo_workflow.sql`, `sql/003_public_intake.sql`.
2. Configure `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never put a service-role key in NEXT_PUBLIC variables.
3. Start the app. In `/report`, select the opt-in checkbox to send a *sanitized copy* to shared intake. The ordinary local report still works without Supabase.
4. `/shared-reports` shows only statuses approved for public listing. New submissions are pending and therefore absent until a separate authorized review process changes their status.

## Limitations / safeguards
- Shared submission does not include precise location, photos, phone, or reporter identity. Local and shared records have separate identifiers.
- This is not an operational dispatch system. No NGO is automatically contacted.
- No public tracking endpoint for pending shared submissions is provided. The local report tracker works only in the same browser.
- No server-side spam protection, CAPTCHA, duplicate detection or public submission rate limiting yet. Add before internet deployment.
- The current legacy Admin page is demo-only, not a secure production moderation interface.
- Do not expose the shared endpoint publicly for real emergency reporting until security and workflow review are complete.
