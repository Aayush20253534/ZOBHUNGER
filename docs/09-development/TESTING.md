# Testing

## Full repository gate

After dependencies are installed:

```bash
npm run verify
```

This runs foundation/release/RBAC/security-hardening regressions, feature suites, deployment/SEO/acceptance checks, chatbot checks, server tests/build, client lint and client build.

## Patch/security regression suites

The names remain historical only as **test identifiers** because they protect important security/performance behavior:

```bash
npm run test:patch-a   # token redaction, MFA/RBAC, timeout/compression contracts
npm run test:patch-b   # pagination, caps, scanning, budgets, observability
npm run test:patch-c   # CI/load-test/scalability regression contracts
```

Do not create matching phase documentation; these tests are automated safeguards, not product documentation categories.

## Server tests

`server npm test` runs TypeScript tests through `tsx` plus business deployment checks. Integration suites that touch data must use a dedicated disposable PostgreSQL database, never production.

## Client checks

```bash
npm --prefix client run lint
npm --prefix client run build
```

Feature component tests use Vitest where configured.

## Security checks

```bash
npm run security:secrets
npm run security:audit-runtime:self-test
npm run security:ci-policy
npm run audit:regressions
```

GitHub Actions performs the live dependency audit and CodeQL analysis.

## Manual checks still required

Automation does not replace:

- real-device/mobile visual review;
- live email inbox evidence;
- external payment-provider sandbox/production checks;
- provider dashboards/quotas;
- production-like load tests;
- database backup restore drills.
