# Testing and verification

## Automated server tests

The Phase 1 test suite uses Node's built-in test runner through `tsx`; no additional test framework is required.

```bash
cd server
npm install
npm test
```

Coverage focuses on deterministic behavior that must not regress:

- auth validation and public-role restrictions
- password input requirements
- requirement normalization/location rules
- job filter compatibility aliases
- application validation/date conversion
- admin status validation and pagination bounds
- article pagination defaults
- API response envelopes
- role authorization middleware

These are unit/contract tests. They intentionally do not create or destroy PostgreSQL data.

## Server build verification

```bash
npm run verify
```

This runs tests followed by Prisma generation and TypeScript compilation.

## Running API smoke tests

Start the API first with a migrated/seeded database:

```bash
npm run dev
```

In another terminal:

```bash
npm run test:smoke
```

By default this checks:

- `GET /api/v1/health`
- `GET /api/v1/jobs`
- `GET /api/v1/articles`

To test another deployment:

```bash
SMOKE_API_URL=https://api.example.com/api/v1 npm run test:smoke
```

PowerShell:

```powershell
$env:SMOKE_API_URL="https://api.example.com/api/v1"
npm run test:smoke
```

## End-to-end Phase 1 checklist

With `NEXT_PUBLIC_DATA_MODE=api`, verify manually:

1. `/jobs` loads database jobs and filtering changes results.
2. A job detail page loads by slug.
3. A job application creates a `JobApplication`; submitting the same email for the same job returns a duplicate error.
4. `/contact` creates `ContactEnquiry`.
5. `/hire-workforce` creates `WorkforceRequirement`.
6. `/blogs` loads articles from PostgreSQL and article detail pages open.
7. `/login` accepts the seeded admin's plain password and redirects to `/admin`.
8. `/admin` loads enquiries, requirements, jobs and applications.
9. BUSINESS/WORKER accounts cannot access admin APIs.
10. Logout clears access and protected admin requests become unauthorized.
11. If Mailjet is configured, enquiry/requirement/application notifications arrive at `SALES_TEAM_EMAIL`.
12. `X-Request-Id` appears on API responses and matching request events appear in server logs.

Use Prisma Studio to confirm writes during local QA:

```bash
npm run db:studio
```
