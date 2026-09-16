# API Overview

## Base path

Backend application routes are versioned under:

```text
/api/v1
```

Public process/health routes also exist outside the globally rate-limited application router for deployment monitoring.

## Response shape

Most JSON success responses use the common `apiSuccessResponse` helper and include a human-readable message plus data. Error handling is centralized so production errors use a safe normalized format rather than leaking stack/provider details.

## Route layers

```text
routes -> middleware -> validation -> controller/handler -> service -> repository/Prisma
```

Some compact modules omit a separate controller/repository file, but validation/authorization and domain/data responsibilities remain separated conceptually.

## Public vs private

Public API families include jobs/articles and intake routes. Private portal families require their role and return `no-store` responses. Admin routes additionally require MFA and mapped permissions.

## Browser transport

The Next.js application uses a shared API client and same-site proxy/rewrite behavior so HttpOnly portal cookies remain usable without exposing them to JavaScript. Ordinary browser calls have a default timeout; upload/export calls use longer explicit policies.

See [Endpoint families](ENDPOINT_FAMILIES.md) for the main route groups.
