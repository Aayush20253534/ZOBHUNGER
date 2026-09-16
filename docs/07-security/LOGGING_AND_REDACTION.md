# Logging and Redaction

## Structured logger

`server/src/utils/logger.ts` emits JSON records containing timestamp, level, service, message and sanitized context. Production error serialization avoids raw stack exposure.

## Request targets

Never log `req.originalUrl` directly for credential-bearing routes. `sanitizeRequestTarget` removes/redacts sensitive query/path values before request/error/not-found/telemetry logs.

Sensitive examples include payment/receipt tokens, activation/recovery tokens and other access credentials.

## Context sanitizer

`sanitizeLogContext` recursively sanitizes known credential-like fields before structured output. `redactSensitiveText` is also used for error/message text where secrets may have been interpolated.

## External error monitoring

The optional monitoring webhook receives sanitized data through the same redaction principles. It should be configured as an operational sink, never as a place to dump raw request bodies.

## Request correlation

Request IDs let operators correlate logs/events without recording user secrets. Include a request ID in diagnostics/support references instead of asking users to send auth/payment tokens.
