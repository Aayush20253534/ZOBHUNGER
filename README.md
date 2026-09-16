# ZOBHUNGER

ZOBHUNGER is an integrated workforce, sales and business-execution platform. This monorepo contains a public Next.js website, authenticated operational portals and a versioned Express/PostgreSQL API.

## Repository

```text
client/       Next.js 16 + React 19 frontend
server/       Express 5 + TypeScript + Prisma/PostgreSQL API
scripts/      release, security and acceptance checks
load-tests/   k6 production-like load scenarios
docs/         current product, architecture, security and operations documentation
```

## Main product areas

- public services/industries/jobs/articles and intake forms;
- business requirements, candidates, deployments, attendance and reports;
- worker profile/jobs/applications/assignments/attendance/earnings;
- placement-cell and technical-institute partner portals;
- admin operations with department RBAC and production MFA;
- employee joining plus PF/ESIC compliance;
- partner/vendor/career/internship intake;
- Cashfree internship-document payments;
- grounded RAG assistant with managed knowledge;
- Redis caching/counters, private Cloudinary files, Resend email and operational telemetry.

## Local development

### API

```bash
cd server
npm install
cp .env.example .env
# configure DATABASE_URL + JWT_SECRET and required local settings
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Web

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

Typical local client values:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Verification

From the repository root:

```bash
npm run verify
```

Focused security/release checks and k6 commands are documented in [Testing](docs/09-development/TESTING.md) and [Performance and load testing](docs/08-operations/PERFORMANCE_AND_LOAD_TESTING.md).

## Documentation

Start at **[docs/README.md](docs/README.md)**.

Recommended entry points:

- [Product overview](docs/01-product/PRODUCT_OVERVIEW.md)
- [System flow (non-technical)](docs/02-system/SYSTEM_FLOW.md)
- [Technical flow](docs/02-system/TECHNICAL_FLOW.md)
- [Tech stack](docs/03-technology/TECH_STACK.md)
- [Design system](docs/04-design/DESIGN_SYSTEM.md)
- [Security architecture](docs/07-security/SECURITY_ARCHITECTURE.md)
- [Deployment](docs/08-operations/DEPLOYMENT.md)
- [Local setup](docs/09-development/LOCAL_SETUP.md)

Historical phase/patch documentation was intentionally removed. Runtime assistant knowledge under `server/src/modules/chatbot/knowledge/` remains application content and is not part of the developer-docs tree.
