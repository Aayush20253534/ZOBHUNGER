# Storage and External Services

## PostgreSQL

Durable business state lives in PostgreSQL and is accessed through Prisma. Database recovery/PITR automation is intentionally outside the current repository hardening scope and must be implemented as a separate operational project.

## Redis

Used for bounded cache/counters. It does not replace PostgreSQL business records.

## Cloudinary

Private HR/resume/vendor and other protected documents use authenticated/private storage paths. Application records store references/metadata; access is mediated by the API and short-lived delivery URLs rather than exposing a permanent public file URL.

Provider request and uploaded-byte budgets limit runaway usage.

## Resend

Used for account recovery/invitations and operational notifications. Sender-domain verification and correct From/Reply-To configuration are deployment prerequisites for real delivery. Provider usage is budgeted and protected by timeout/circuit logic.

## Cashfree

Used for the internship document-payment checkout. The server creates/reconciles orders and verifies webhook signatures against the exact raw body. Receipt access uses signed expiring tokens.

## Groq and Gemini

Groq supplies assistant generation. Gemini embeddings are optional for vector retrieval. Both have timeouts, budget controls and circuit-breaker behavior; assistant retrieval falls back according to feature logic when dense retrieval is unavailable.

## Malware scanning

`FILE_MALWARE_SCAN_PROVIDER` selects ClamAV or an HTTP scanning service. Supported upload paths are scanned before acceptance/storage or parsing. If production starts with scanning disabled, non-upload API features remain available while protected uploads fail closed with HTTP 503 until a scanner is configured. Scanner/provider failures are also handled conservatively.

## External error monitoring

An optional generic webhook can receive sanitized error events. It is not a replacement for application logs or metrics and must never receive raw credentials/PII.
