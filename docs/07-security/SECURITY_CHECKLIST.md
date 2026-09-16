# Security Checklist

Use this checklist when adding a new backend feature.

- [ ] Is every input validated server-side?
- [ ] Is the route public by design, or does it have the correct role middleware?
- [ ] If it is under `/admin`, is its permission family mapped explicitly?
- [ ] Does a mutation use the portal-write protection where appropriate?
- [ ] Does the endpoint need a stricter rate limit?
- [ ] Are private responses `no-store`?
- [ ] Are list queries paginated/bounded at the database?
- [ ] Are exports/matching operations bounded before expensive decrypt/render work?
- [ ] Could logs contain tokens, PII, uploaded data or provider errors?
- [ ] Are new credential names recognized by the log sanitizer/secret scanner?
- [ ] Are uploaded files validated and scanned before trust/storage/parsing?
- [ ] Does the provider call have a timeout, budget and circuit behavior if needed?
- [ ] Does a payment/write retry preserve idempotency?
- [ ] Are new secrets backend-only and documented with safe `.env.example` placeholders?
- [ ] Are regression tests added for the control, not only the happy-path feature?
- [ ] Does `npm run verify` remain green?

## Before production

- [ ] production admin MFA tested;
- [ ] CORS/public origin exactly configured;
- [ ] Redis/provider-budget expectations satisfied;
- [ ] malware scanner configured;
- [ ] email/storage/payment/AI secrets scoped correctly;
- [ ] no secrets committed;
- [ ] security CI/CodeQL green;
- [ ] production health/readiness checks green;
- [ ] database backup/restore plan reviewed separately (not currently implemented in repo).
