# File and Payment Security

## Upload validation

Supported upload handlers enforce explicit size limits and allowed media types. PDF/image paths verify file signatures/magic bytes rather than trusting only an extension or browser-provided MIME type. Spreadsheet imports enforce supported file types, bounded workbook processing and row-level validation before records are accepted.

These structural checks reduce malformed or disguised uploads, but they are not malware detection. Uploaded documents should still be treated as untrusted content when opened outside the application.

## Private storage

Cloudinary is configured for private/authenticated storage. Signed download access is short-lived. Cloudinary usage is protected by request/upload-byte budgets and timeout/circuit behavior.

## Payment security

Cashfree credentials remain server-side. Order creation uses idempotency/active-state protection. Webhooks verify signature/timestamp against raw bytes. Provider payment/order values are reconciled with application expectations.

Receipt tokens are signed and expiring. Logging sanitization removes credential-bearing URL/query values before log output.

## Developer rule

Never add a “temporary” public file URL or query-string secret to simplify UI development. Use the existing private delivery and sanitizer primitives.
