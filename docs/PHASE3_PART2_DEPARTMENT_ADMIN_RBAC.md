# Phase 3 · Part 2 — Department Administrator RBAC

This release keeps one ZOBHUNGER Operations workspace and makes it permission-driven. It does **not** create separate HR, Technical, Placement Cell or Legal applications.

## Access model

- **Main Administration** — existing `ADMIN` accounts are migrated to `MAIN_ADMIN` and receive every administrator permission so the deployment cannot lock out the current administrator.
- **Career & HR** — career intake, employee joining, worker/candidate workflows, hiring briefs, deployment, attendance, earnings and operational reporting.
- **Technical** — department overview plus Technical and website-content capability flags. The request/content desks are wired in their dedicated later implementation parts; no unrelated admin workspace is exposed meanwhile.
- **Placement Cell** — department overview and institution onboarding decisions. Additional placement workflow surfaces remain isolated until their dedicated implementation part.
- **Legal** — department overview plus Legal capability flags, ready for the routed Legal request desk in the forms/integration part.

Every protected admin API remains behind `ADMIN` authentication and mandatory administrator MFA. A central permission middleware runs before the existing admin route modules, so client-side navigation filtering is only presentation, never the security boundary.

## Administrator lifecycle

Main Administration can open **Admin → Administration → Admin access** to create, review, edit, disable and reactivate department administrators.

New department administrators do not receive a password from another user. The server creates a cryptographically random one-time invitation, stores only its SHA-256 hash, and sends a 48-hour activation link. The credential is placed in the URL fragment so it is not part of normal HTTP request URLs or referrers. Activation chooses a strong password, consumes the token transactionally and invalidates prior sessions. The first admin sign-in then routes through the existing MFA enrollment flow.

Changing access or disabling an account increments `sessionVersion`, closing existing sessions so permission changes take effect immediately.

## Production database migration

The migration is:

`server/prisma/migrations/20260914100000_department_admin_rbac/migration.sql`

Production must run:

```bash
npm --prefix server run db:deploy
```

before starting application code that depends on the new administrator fields. The server already has a `deploy` script that performs build + migration + storage migration; use the deployment workflow configured for the production service rather than `prisma migrate dev`.

## Email configuration

Administrator invitations use the existing Resend production email transport. Ensure the production sender configuration already required by the server is valid before creating department administrators. If delivery is temporarily unavailable, the account remains pending and Main Administration can use **Resend invite** after the mail configuration is corrected.

## Verification

A dependency-free RBAC source-contract test is included:

```bash
npm run test:rbac
```

It is also part of the root `npm run verify` pipeline. Full production validation remains:

```bash
npm run verify
```
