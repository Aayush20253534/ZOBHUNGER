# Project Structure

```text
ZOBHUNGER/
├── client/                 Next.js application
│   ├── src/app/            App Router pages/layouts/error/loading boundaries
│   ├── src/components/     Public, portal and shared UI
│   ├── src/services/       Browser API/domain service wrappers
│   ├── src/lib/            Shared client utilities
│   ├── src/styles/         Feature and design-system CSS
│   ├── public/             Images, logos, fonts and other static assets
│   └── tests/              Frontend tests
├── server/                 Express/Prisma API
│   ├── prisma/             Schema, migrations, seed
│   ├── src/config/         Environment, DB, Redis, CORS
│   ├── src/middlewares/    Auth/security/validation/error/compression
│   ├── src/modules/        Domain modules
│   ├── src/services/       Shared provider/file/email services
│   ├── src/observability/  Metrics and external error monitoring
│   ├── src/utils/          Logging, JWT, password, response utilities
│   ├── scripts/            Backend build/check/migration helpers
│   └── tests/              Backend unit/integration tests
├── scripts/                Repository release/security/acceptance checks
├── load-tests/k6/          Production-like load scenarios
├── .github/                CI and Dependabot configuration
└── docs/                   Current-state product/technical documentation
```

## Backend module convention

Most domain modules use some combination of:

```text
*.routes.ts
*.controller.ts
*.service.ts
*.repository.ts
*.schema.ts
```

Not every module needs all layers. Small route families may use route handlers directly while still delegating business/database work to services.

## Frontend convention

- `src/app/*` owns route composition, metadata and route-level loading/error boundaries.
- `src/components/*` owns reusable or feature UI.
- `src/services/*` owns API calls rather than embedding raw `fetch()` throughout pages.
- `src/types/*` owns shared TypeScript response/view-model types where present.
- `src/styles/*` contains the existing feature-scoped CSS system layered on Tailwind/shadcn foundations.

## Documentation convention

Developer documentation lives only under `docs/` plus short `README.md` entrypoints. Do not reintroduce a separate `server/docs` tree or phase-numbered implementation notes.
