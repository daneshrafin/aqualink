# AquaLink

From water crisis to community recovery.

A Bangladesh-focused demonstration of community water, sanitation and hygiene reporting, response coordination, and budget-aware repair/delivery planning. English and বাংলা interfaces are available.

## Install, check, then open localhost

Extract the ZIP into a **new folder**. In Windows, open Command Prompt inside the `aqualink` folder containing `package.json`. Use a supported Node.js LTS installation with npm.

Run these commands one at a time. If a command fails, resolve its error before continuing:

```bat
npm.cmd install
npm.cmd run audit:static
npm.cmd run audit:routes
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev -- --port 3001
```

Open **http://localhost:3001** after the terminal says the server is ready. Stop it with **Ctrl+C**. On macOS/Linux, use `npm` in place of `npm.cmd`.

For a local production preview after a successful build, use `npm.cmd run start -- --port 3001` instead of the development command. Run only one server on port 3001 at a time.

## Demo walkthrough

1. **Report a problem** (`/report`): submit a fictional incident and save its tracking code. Categories include broken pump, water shortage, water quality concern, sanitation/hygiene and other problems.
2. **Track report** (`/track`): view its current status. Switch to **Help others · demo** and open **Response desk** (`/operations`) to verify, assign and resolve the same local report.
3. **Cases** (`/cases`): claim the same verified AQ report for an example organization. Open its task in **Responder workspace** (`/ngo/tasks`), set the team, estimated cost and notes, then save progress. Completing the task resolves the linked report. Partners & projects shows the organization’s current case totals.
4. **Price guide** (`/market-prices`): select products, edit prices and quantities, then export a cost worksheet. The six sanitation items are labelled **example (demo)** with reference dates and sources.
5. **Recovery planner** (`/dashboard`): compare repair and water delivery under a budget using editable community assumptions. **Evidence lab** (`/evidence`) compares synthetic scenarios.
6. **Feature guide** (`/guide`): follow the detailed walkthrough, with equal examples for all five issue categories. FOTA can look up an AQ reference from the current browser and explain the next step in English or বাংলা.

Try `AQ-101` (pump), `AQ-102` (shortage), `AQ-103` (quality), `AQ-SAN-001` (sanitation) or `AQ-204` (other). All five categories use the same review, claim and task controls. The responder workspace starts with fictional tasks covering every category, without a Supabase setup requirement. Existing assigned reports can still be managed through Response desk; new organization claims start from a verified, unclaimed report.

## How the modules connect

| Modules | Connection |
|---|---|
| Report, Track, Response desk, Crisis map | Same browser-local incident records |
| Cases, Responder workspace, Partners & projects | Shared browser demo claims/tasks; verified local AQ reports join this workflow. Partner sample cases remain clearly fictional |
| Recovery planner | Manual or imported community inputs; reports and cases are not automatically imported |
| Resources | Separate simulated inventory; no automatic reservations |
| Price worksheet | All categories support estimates and CSV; only Repair and Transport support an explicit reviewed handoff to the planner |

Changing language, role or theme does not reset stored reports. Keep the same browser and port to retain local data. Demo role selection is not authentication. Supabase data and browser demo records remain separate; nothing is automatically uploaded.

## Optional backend

The local demonstration works without Supabase. For database-backed features, copy `.env.example` to `.env.local`, configure the documented Supabase values, and review/apply the SQL migrations in `sql/` in numerical order. Apply `010_sanitation_category.sql` after `001`–`009` for shared sanitation submissions.

Live database permissions, organization approval, concurrent claims and progress updates require integration testing against your configured backend. Do not use real personal or sensitive information in the demonstration.

## Scope and limitations

This is a competition demonstration, not a live emergency service. Incidents, partner cases and model scenarios are fictional. The application does not dispatch actual responders or independently verify water quality.

Optimization is exact only within the modelled discrete options. Sanitation reports use the existing reporting/case workflow; the optimizer still models water-supply repair and delivery. It does not design latrines or schedule sanitation work. Roads, crew capacity, vehicle availability and operational constraints need separate verification.

Price entries distinguish seller references, historical estimates, local observations and demo assumptions. Check the item source, unit and date, and obtain local quotations before real procurement. The sanitation examples are not a complete latrine-construction quotation.

Illustrations depict fictional scenes, not photographs of real incidents. See `docs/ILLUSTRATIONS.md` for asset provenance.

## Project contents

- `app/`, `components/`, `lib/`: application and model source.
- `tests/`, `scripts/`: automated tests and static audits.
- `sql/`: optional backend migrations.
- `public/`, `docs/`: assets and supporting documentation.
- `package-lock.json`: reproducible dependency versions; keep it with `package.json`.

Generated dependencies, build output, caches and historical QA/release files are excluded from the distribution. Current change notes and command outputs are supplied separately from the source ZIP.
