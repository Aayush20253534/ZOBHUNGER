# Phase 3 · Part 4 — Operations Intake

Part 4 connects the website's existing submission surfaces to one department-scoped administrator workflow. It deliberately reuses the production admin shell instead of creating separate HR, Technical, Placement Cell or Legal dashboards.

## Captured sources

The database migration captures and backfills these source records:

- website/contact enquiries
- workforce requirements
- partner applications
- vendor empanelment applications after submission
- career profiles
- placement/institution partnership applications
- employee joining records after submission
- job applications, including Placement Cell-managed candidates

The capture snapshot is privacy-minimised. Uploaded files, encrypted Aadhaar/PAN/bank/UAN values and raw resume bytes are not copied into intake.

## Routing

- Career applications, employee joining and ordinary job applications → Career & HR
- Placement/institution applications and Placement Cell-managed job applications → Placement Cell
- Website & App Development enquiries → Technical
- Legal, privacy & compliance enquiries → Legal
- General business, workforce, partner and vendor submissions → Main Administration

Main Administration can reroute a case. Department administrators cannot escape their department scope through query parameters or direct API calls.

## Workflow

`SUBMITTED → IN_REVIEW → CONTACTED → RESOLVED / REJECTED / ARCHIVED`

Each case supports assignment, "Assign to me", internal notes, source context, search/filtering, pagination and CSV export. Updates use optimistic concurrency through the case revision to prevent one administrator silently overwriting another administrator's work.

Existing source workflow updates can advance intake automatically. Terminal intake decisions are never silently reopened by later source updates.

## Production deployment

Part 4 adds Prisma migration `20260915100000_operations_intake`.

```bash
npm --prefix server run db:generate
npm --prefix server run db:deploy
npm run verify
```

The migration backfills existing records and installs idempotent database triggers for future submissions. No new environment variable is required.
