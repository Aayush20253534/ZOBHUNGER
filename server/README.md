# ZOBHUNGER Server

Express 5 + TypeScript API backed by Prisma/PostgreSQL.

## Local start

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

The environment schema in `src/config/env.ts` is authoritative. Production intentionally fails fast when required security/provider configuration is missing.

## Build and tests

```bash
npm test
npm run build
```

For the complete monorepo verification run `npm run verify` from the repository root.

## Code map

```text
src/modules/        domain routes/controllers/services/repositories/schemas
src/middlewares/    auth/RBAC/MFA/validation/rate limits/errors/compression
src/services/       email/storage/malware/common provider services
src/observability/  metrics and error monitoring
src/config/         environment/database/redis/CORS
prisma/             schema/migrations/seed
```

## Documentation

Server documentation is centralized under the repository `docs/` tree:

- [Technical flow](../docs/02-system/TECHNICAL_FLOW.md)
- [API](../docs/06-api/API_OVERVIEW.md)
- [Security](../docs/07-security/SECURITY_ARCHITECTURE.md)
- [Deployment](../docs/08-operations/DEPLOYMENT.md)
- [Database and Prisma](../docs/09-development/DATABASE_AND_PRISMA.md)

The previous `server/docs/` directory was removed to avoid maintaining a second, drifting documentation tree.
