# CI/CD

## GitHub Actions

### Phase/business-worker release workflow
Runs the repository's portal/release verification against an isolated PostgreSQL + pgvector service container. It is intended to catch route, database and integration regressions in a real PostgreSQL environment.

### Security gates
The security workflow runs:

- repository secret scan;
- CI policy self-check;
- Patch A/B/C regression suites;
- production dependency audit;
- CodeQL JavaScript/TypeScript analysis.

## Runtime-aware dependency audit

Server tooling includes Prisma CLI and other development-only dependencies that can appear in npm advisories without being part of the deployable runtime graph. `scripts/security/audit-runtime-deps.mjs` reads the audit report and lockfile classification:

- high/critical runtime dependency finding → fail;
- finding proven entirely `dev`/`devOptional` → report without treating it as a runtime blocker;
- unclassifiable affected node → fail closed.

Do not replace this with `npm audit fix --force` when npm proposes an ORM major-version downgrade.

## Dependabot

Dependabot covers root, server, client and GitHub Actions dependencies. Dependency PRs still need build/test review; an automatic PR is not proof of compatibility.

## Deployment sequencing

Prefer database migration/backend deployment before a frontend change that depends on new API routes. Deploy compatible revisions and run the live production gate after both are available.
