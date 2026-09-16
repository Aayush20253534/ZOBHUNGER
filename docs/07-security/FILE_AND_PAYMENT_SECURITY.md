# File and Payment Security

## Upload validation

Supported upload handlers enforce explicit size limits and allowed media types. PDF/image paths verify file signatures/magic bytes rather than trusting only an extension or browser-provided MIME type.

## Malware scanning

Production protected-file workflows use the configured ClamAV or HTTP scanner. Technical student spreadsheet imports are scanned before parsing. Scanner/provider failures follow fail-safe behavior appropriate to security-sensitive uploads.

A structurally valid PDF or spreadsheet is not assumed safe merely because its header bytes are correct.

## Private storage

Cloudinary is configured for private/authenticated storage. Signed download access is short-lived. Cloudinary usage is protected by request/upload-byte budgets and timeout/circuit behavior.

## Payment security

Cashfree credentials remain server-side. Order creation uses idempotency/active-state protection. Webhooks verify signature/timestamp against raw bytes. Provider payment/order values are reconciled with application expectations.

Receipt tokens are signed and expiring. Logging sanitization removes credential-bearing URL/query values before log output.

## Developer rule

Never add a “temporary” public file URL or query-string secret to simplify UI development. Use the existing private delivery and sanitizer primitives.
