# Public requirement validation and recovery-email delivery

This note documents the public `/hire-workforce` validation repair and the shared Resend transport used by password recovery and operational notifications. No database migration is required for the email-provider change.

## What the validation repair does

- Public requirement validation uses the same practical duration rules on the client and server.
- Server validation details reach the form so affected fields can show inline errors.
- Blank optional dates remain absent rather than becoming invalid or epoch dates.
- `request.validation_failed` logs request IDs and field names without submitted values.
- A notification failure never rolls back an already saved workforce requirement.

## Resend transport

The backend sends transactional and operational email through Resend's HTTPS Email API. It requires one API key rather than a public/secret credential pair. Requests have a configurable timeout and provider failures are converted into safe diagnostics before logging.

Recovery messages keep the existing single-use, hash-only reset-token flow. Raw provider errors, API keys, recipients, subjects, message bodies and reset tokens are never written to the safe provider diagnostic. Accepted API responses are logged as provider acceptance only; they are not treated as proof that a message reached a customer's inbox.

Resend open/click tracking is configured at the sending-domain level. Keep tracking disabled for sensitive transactional mail such as password reset and verification links.

## Resend configuration

Set these values in the backend environment:

```dotenv
RESEND_API_KEY=re_your_api_key
MAIL_FROM_EMAIL=mail@your-verified-domain.com
MAIL_FROM_NAME=ZOBHUNGER
SALES_TEAM_EMAIL=business@your-domain.com
PUBLIC_APP_URL=https://your-frontend.example.com
RESEND_TIMEOUT_MS=15000
```

`MAIL_FROM_EMAIL` must use a domain verified in Resend. Keep `RESEND_API_KEY` only on the backend. `SALES_TEAM_EMAIL` is required for default sales/requirement notifications; password recovery and explicitly addressed operational messages do not depend on it.

`PUBLIC_APP_URL` must point to the frontend where the reset-password page is hosted.

## Check provider configuration

Run:

```powershell
cd server
npm run check:email
```

The check sends to Resend's documented `delivered@resend.dev` test recipient. It validates that Resend accepts the API key, sender and message shape without sending to a real customer address. It prints `ready: true` on acceptance or a safe failure diagnostic and exits nonzero on failure.

| Diagnostic | Action |
| --- | --- |
| `reason: configuration` | Add the listed backend settings. |
| `reason: credentials` | Check `RESEND_API_KEY`. |
| `reason: sender` | Verify the From domain/address in Resend. |
| `reason: permission` | Review API-key permissions and account restrictions. |
| `reason: rate_limit` | Review provider limits and retry after the rate-limit window. |
| `reason: timeout` / `network` | Check outbound HTTPS and DNS access to `api.resend.com`. |
| `reason: payload` | Review the From, To, subject and message fields. |
| `reason: provider` | Retry after the Resend service issue is resolved. |

## Verification

Run from `server/`:

```powershell
npm test
npm run test:submissions
npm run check:email
```

Database-backed submission/recovery integration tests require `TEST_DATABASE_URL` pointing to a dedicated migrated test database. The automated Resend tests mock the provider API; real inbox delivery still needs a post-deployment test with the verified production domain.
