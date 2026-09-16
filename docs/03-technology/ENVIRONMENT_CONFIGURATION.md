# Environment Configuration

The executable contracts are `server/src/config/env.ts`, `server/.env.example`, `client/config/runtime-env.mjs` and `client/.env.example`. This document groups settings by purpose; it does not replace the schemas.

## Core server

- `NODE_ENV`, `PORT`
- `DATABASE_URL`
- `CLIENT_ORIGIN`
- `PUBLIC_APP_URL`
- `TRUST_PROXY`
- `LOG_LEVEL`

Production requires a PostgreSQL URL and production-safe origins. `PUBLIC_APP_URL` must agree with the browser origin allowlist.

## Authentication/security

- `JWT_SECRET`, expiry/cookie settings, issuer/audience
- `MFA_ENCRYPTION_KEY`
- `HR_PII_ENCRYPTION_KEY`
- authentication/submission rate limits

Encryption secrets must be independent. Do not casually rotate the HR PII key without a data migration because persisted ciphertext depends on it.

## Redis/cache

- `REDIS_ENABLED`
- `REDIS_URL`
- key prefix, TTL and command timeout

Patch-B provider budgets use distributed counters, so production configurations that enable provider budgets require working Redis according to startup validation.

## Email/storage

- Resend API key, from/reply-to and department addresses
- Cloudinary cloud/API credentials, private folder, provider timeout and signed-download TTL

## Payments

- Cashfree enable/environment/client credentials/API version/timeout
- receipt-token TTL

Use sandbox credentials outside production. Cashfree webhook verification depends on the raw request body and provider signature rules.

## AI assistant

Settings cover assistant enablement, rate limits, memory/cache, grounding/reranking, Groq generation and optional Gemini vector retrieval. Provider budgets cap daily requests/tokens or embedding characters.

## File security and operations

- malware scanner provider (`disabled`, `clamav`, `http`)
- scanner connection/token/timeout
- export/matching row caps
- slow-request threshold
- external error-monitoring webhook/token
- provider circuit-breaker threshold/cooldown

Production protected uploads require a working malware scanner. The API may boot with the scanner disabled so non-upload features remain available, but protected uploads fail closed with HTTP 503 until ClamAV or an HTTP scanner is configured.

## Frontend

- `NEXT_PUBLIC_DATA_MODE`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`
- Google verification token
- optional app-store URLs
- optional release SHA

Production builds must use API mode and HTTPS/non-localhost production URLs. Public variables are compiled into browser-accessible code: **never put secrets in `NEXT_PUBLIC_*`.**

## Change process

1. Add/change schema validation first.
2. Update `.env.example` with safe placeholders and comments.
3. Update this document if operational meaning changes.
4. Run server/client environment checks before release.
