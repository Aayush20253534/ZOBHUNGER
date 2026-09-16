# Errors, Pagination and Idempotency

## Errors

Domain/services should throw typed/safe errors (for example `HttpError`) instead of sending ad-hoc provider exceptions directly to the browser. The central error middleware creates the public response and records a sanitized log/monitoring event.

Client code should distinguish:

- API/domain rejection;
- network failure;
- request timeout;
- caller cancellation/abort.

## Pagination

Large list APIs paginate on the server. Common response metadata uses concepts such as:

```text
items
page
total
totalPages
```

Exact page size varies by domain and schema. Keep maximum page size bounded in the validation schema and perform `skip/take` (or an intentional cursor approach) in the database query.

Do not fetch all rows and then slice in React.

## Exports

Exports are not an excuse to remove all limits. Sensitive/large exports use explicit maximum rows and should require narrower filters when the result would exceed that ceiling.

## Idempotency and optimistic revisions

Several workflows use request IDs/unique constraints/revision values to distinguish retries from conflicting writes. Services should handle database unique races as part of the idempotency design rather than treating every unique exception as an unexpected 500.

A disabled frontend button is a UX improvement, not an idempotency strategy.
