# Browser demo coordination

Without Supabase configuration, Report, Response desk, Track, Cases, Responder workspace and Partners use browser demo records. These are fictional and do not contact real organizations.

1. Submit a report in any of the five categories. It starts pending.
2. Find its AQ reference in Response desk and verify it.
3. The same verified reference appears in Cases. Choose an example organization and claim it.
4. Open the linked response task. Edit team, estimate, status and progress notes.
5. Save In progress or Completed. Completed resolves the case and its original AQ report. Team assignment appears in Track report. Task notes and estimates remain in the responder workspace.
6. Partners shows the current organization assignment and ongoing/resolved counts.

Pending or rejected reports cannot be claimed. A claimed case cannot be claimed a second time. Legacy reports already assigned through Response desk retain that workflow; unclaimed cases must be in verified state before an organization claim. Case status is projected from the report record so later review changes remain authoritative.

Task cancellation leaves an assigned case unresolved. A completed case cannot be cancelled directly; reopening it as In progress is explicit. Resetting sample cases restores the partner examples while preserving claimed submitted reports. Browser storage is local to the origin, including its port.

The workspace is populated with fictional tasks for pump repair, water shortage, water quality, sanitation/hygiene and other access problems. Every category uses identical claim and progress controls. Task costs are examples, not market quotations.

## Shared backend

When Supabase is configured, `/ngo/tasks` uses the existing authenticated database workspace. Browser demo records are not silently promoted into live data. Organization approval, memberships, row-level permissions and live RPCs are unchanged. See NGO_BACKEND_SETUP.md and the SQL migrations.

## FOTA

FOTA uses deterministic built-in guidance and current browser demo records. It can look up a full AQ or DEMO-CASE reference, explain status/next steps, and link into the app. EN, BN and common Banglish phrases are supported. It does not use a remote AI model, browse, send messages, change records or dispatch responders. Conversation text stays in component memory and is cleared on a language change or with Start again.

## Planner hydration

`/dashboard?demo=1` previously chose different content during server rendering and the first browser render by reading `window.location` inline. The demo query is now read in an effect after hydration. A regression test compares the actual first-render markup with and without a browser location, for desktop and mobile viewport values. This is a server-render regression test, not a substitute for a full browser run.
