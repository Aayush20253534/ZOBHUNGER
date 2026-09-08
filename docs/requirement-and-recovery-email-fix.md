# Public requirement validation and recovery-email repair

Apply this patch on top of the completed P2.3 code. It fixes the public `/hire-workforce` submission flow and improves the shared Mailjet transport used by recovery emails and operational notifications. No database migration or new package is added by this hotfix.

## What the reported logs establish

- `GET /api/v1/business/workspace` returning 200 means the business workspace endpoint was responding successfully.
- `POST /api/v1/requirements` returning 400 with “Request validation failed” means the public requirement payload was rejected before it was saved. This endpoint belongs to the public Hire Workforce form; the portal form uses `/api/v1/business/requirements`.
- A reproducible mismatch existed: the frontend allowed a one-character project duration such as `1`, while the backend required at least two characters. The screenshot and request-completion logs do not include the submitted fields, so they cannot prove which field caused those particular requests to fail.
- The frontend discarded `error.details.fieldErrors`, hiding the server's explanation.
- `business.recovery_delivery_failed` was logged without any provider details. That warning alone does not distinguish invalid credentials, an unauthorized sender, provider restrictions or a network error. The installed Mailjet constructor was checked and works; there was no evidence of an SDK constructor failure.

## Changes

The public form now validates the duration consistently and prompts for values such as `1 day` or `3 months`. API validation details reach the form, where affected fields receive inline errors and a clickable correction list. Entries remain available after an unsuccessful submission.

Blank, omitted and null optional start dates remain absent. Null no longer becomes January 1970, and impossible calendar dates cannot roll over into another month. A blank legacy primary-location field can use the supplied locations array. Required fields are still validated.

The server adds a `request.validation_failed` log with request ID and field names, without submitted values. Existing validation responses still have HTTP 400 and `VALIDATION_ERROR`.

The shared Mailjet client now checks each message's acceptance status, including errors returned inside an otherwise successful HTTP response. Requests have a configurable timeout, and the correct Mailjet regional host can be selected. Recovery emails include a reset button and a plain-text link, with click/open tracking disabled. The existing single-use, hashed token flow and account-private recovery responses are preserved. A rejected notification does not undo an already saved requirement.

Recovery failure logs now include safe `reason`, `statusCode`, `errorCode`, allowed field names, provider error identifier when available and a suggested action. Request IDs connect them to the originating request. Raw provider errors, credentials, message bodies, recipients and recovery tokens are excluded from these email logs. Accepted messages are logged as `business.recovery_email_accepted` or `email.accepted`; acceptance is not a claim of inbox delivery.

## Mailjet configuration

Set these in the backend environment:

```dotenv
MAILJET_API_KEY=your_mailjet_email_api_public_key
MAILJET_SECRET_KEY=your_mailjet_email_api_secret_key
MAIL_FROM_EMAIL=your_verified_sender_address
MAIL_FROM_NAME=ZOBHUNGER
SALES_TEAM_EMAIL=your_sales_notification_recipient
PUBLIC_APP_URL=https://client-nine-wheat.vercel.app
MAILJET_API_HOST=api.mailjet.com
MAILJET_TIMEOUT_MS=15000
```

Use the Email API public and secret key pair. `MAIL_FROM_EMAIL` must be an active, validated sender for that account/API key. Mailjet documents this requirement in its [Send API guide](https://dev.mailjet.com/docs/email-api/send-api-v31/send-basic-email).

`MAILJET_API_HOST` and `MAILJET_TIMEOUT_MS` have the defaults above and can be omitted. Use `api.us.mailjet.com` only if your account uses Mailjet's US architecture; see the [official SDK host configuration](https://github.com/mailjet/mailjet-apiv3-nodejs#host-url). No automatic host switching occurs.

For compatibility, `MJ_APIKEY_PUBLIC` can supply a missing `MAILJET_API_KEY`. `MAILJET_API_SECRET`, then `MJ_APIKEY_PRIVATE`, can supply a missing `MAILJET_SECRET_KEY`. Nonblank canonical variables take precedence, so correct or remove any old incorrect value. `SALES_TEAM_EMAIL` is required for default sales notifications; password recovery and explicitly addressed operational emails do not require it.

`PUBLIC_APP_URL` must point to the frontend, where `/business/reset-password` exists. Keep private credentials in the backend environment.

## Check the actual provider configuration

Run in the deployed backend environment, or locally with the same configuration:

```powershell
cd server
npm run check:email
```

This uses Mailjet's [sandbox validation](https://dev.mailjet.com/docs/email-api/send-api-v31/sandbox.mode), so it checks the configured credentials, sender and message without delivering an email. It prints `ready: true` or a safe failure diagnostic and exits nonzero on failure. Missing settings are listed by name. The check validates provider acceptance; it does not check inbox delivery, spam filtering or later bounces.

| Diagnostic | Action |
| --- | --- |
| `reason: configuration` | Add the listed backend settings. |
| `reason: credentials` / HTTP 401 | Check the public/secret pair and account region. |
| `reason: sender` / `send-0008` | Validate the From address/domain under the API key in use. |
| `reason: suspended` / `mj-0001` | Review the Mailjet account/API-key suspension. |
| `reason: permission` / HTTP 403 | Review account permissions and sending restrictions. |
| `reason: rate_limit` / HTTP 429 | Review provider limits and wait for the relevant window. |
| `reason: timeout` or `network` | Check outbound HTTPS/DNS and the configured host. |
| `reason: provider` / HTTP 5xx | Retry after the Mailjet service issue is resolved. |

Provider-specific error meanings follow [Mailjet's error reference](https://dev.mailjet.com/docs/email-api/send-api-v31/send-api-errors). The old warning cannot establish which applies to your account. Sender validation, credentials, account restrictions and actual delivery require checking your live Mailjet configuration.

## Apply, commit and deploy

From the repository root after P2.3:

```powershell
git apply --check zobhunger-requirement-email-fix.patch
git apply zobhunger-requirement-email-fix.patch
git add client/src/components/forms/RequirementForm.tsx client/src/hooks/use-form-submission.ts client/src/lib/api.ts client/src/schemas/requirement.schema.ts server/src server/scripts/check-email.mjs server/tests server/package.json server/.env.example docs/requirement-and-recovery-email-fix.md
git commit -m "fix: align requirement validation and improve Mailjet recovery delivery"
git push
```

Redeploy both frontend and backend. Keep backend root `server`, build command `npm ci --include=dev && npm run deploy`, and start command `npm start`. This hotfix needs no additional database migration; the P2.3 migration must already have been applied if using P2.3.

Check `/hire-workforce`, `/business/forgot-password`, the emailed `/business/reset-password#token=...` link, and `/business/dashboard` after a signed-in public requirement submission. If validation still fails, the form and `request.validation_failed` log identify the fields to correct. If provider validation fails, the new recovery log identifies the reason to investigate.

## Verification

- Frontend production build and TypeScript pass; lint has no errors and retains two existing BrandMarqueeMotion warnings.
- Server build and compiled business-route check pass.
- 55 unit/schema/deployment checks and six focused Mailjet/public-contract tests pass.
- The actual public form schema was tested across the available service and industry choices, optional/ISO dates and maximum field sizes against the server schema. Error-response details reach the client helper correctly.
- 31 integration results pass across the existing business access/dashboard/management suites and the new public submission/recovery suite. They cover a corrected public submission reaching the dashboard, notification rejection preserving the saved request, provider failures removing unusable reset tokens, successful reset consumption and session invalidation.
- Database verification used a temporary PGlite PostgreSQL-compatible database and a test-only single-connection pool. Production connection settings are unchanged. Mailjet calls were stubbed; no live messages were sent and no production Mailjet account was accessed.

From `server/`, run `npm test` and `npm run test:submissions`. To run database checks, set `TEST_DATABASE_URL` to a dedicated migrated test database and run `npm run test:submission-flows`. Browser interaction and real inbox delivery remain to be checked after deployment.
