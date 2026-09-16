# Data Protection

## Classification by treatment

### Public
Marketing pages, published articles and public job information.

### Account/private operational
Business requirements, candidate history, deployments, attendance, worker applications and earnings.

### Sensitive HR/compliance
Aadhaar, PAN, bank information, UAN, PF/ESIC data, joining documents and related private records.

### Security credentials
Passwords, JWT/MFA/encryption secrets, recovery tokens, API keys, payment/provider secrets.

## HR encryption

Sensitive joining/compliance identifiers use application-layer AES-256-GCM encryption through the dedicated `HR_PII_ENCRYPTION_KEY`. The key is required in production and must not be reused as the JWT or MFA key.

## Password/token storage

- passwords: Argon2id;
- recovery/access tokens: hashed where the raw value must be delivered externally;
- MFA secrets: encrypted;
- browser access JWT: stored in HttpOnly cookie rather than localStorage.

## Private files

Private documents are not placed in public Next.js assets. Database records reference protected storage objects and authenticated endpoints issue time-bounded access when needed.

## Logging

PII/secrets should not be passed into log context unnecessarily. Shared sanitizer functions redact recognized secret keys/tokens and sanitize request targets. Production stack exposure is restricted.

## Export handling

Sensitive exports are generated only for authorized roles/permissions and have maximum-row safeguards. Generated files should be treated as sensitive after download; the server cannot control a user's local copy once delivered.
