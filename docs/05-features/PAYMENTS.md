# Payments

## Current scope

Payment integration is currently focused on the internship document-payment workflow and Cashfree hosted checkout.

## Order safety

The server owns order creation and reconciliation. Database uniqueness/idempotency and active/paid guards prevent ordinary duplicate clicks or retries from creating duplicate paid state.

Provider responses are reconciled against expected amount/currency/order data rather than trusting browser state.

## Webhook verification

Cashfree webhook routing is mounted before `express.json()` so verification can use the exact raw bytes delivered by the provider. Signature/timestamp verification uses timing-safe comparison and bounded timestamp acceptance.

## Receipt access

Receipt/document URLs use signed **expiring** tokens rather than permanent deterministic tokens. The configured TTL is controlled by `PAYMENT_RECEIPT_TOKEN_TTL_SECONDS`.

Request logging sanitizes token-bearing paths/query strings so receipt/payment credentials are not copied into platform logs.

## Operational rules

- Never expose Cashfree client secret in frontend configuration.
- Use sandbox outside production.
- Treat provider status refresh as a server reconciliation operation.
- Preserve idempotency keys/unique constraints when modifying payment flows.
- Never make a client-side “success” screen the source of truth for paid status.
