# Technology Stack

## Frontend

| Technology | Role |
|---|---|
| Next.js `16.3.4` | App Router, server/client rendering, routing, metadata and API proxy behavior |
| React `19.2.8` | UI component model |
| TypeScript | Type-safe client code |
| Tailwind CSS 4 | Utility styling foundation |
| shadcn / Base UI | Reusable UI primitives |
| Lucide React | Interface icons |
| React Hook Form + Zod | Form state and validation on applicable screens |
| Vitest + Testing Library | Frontend unit/component tests |

## Backend

| Technology | Role |
|---|---|
| Node.js 22 | Runtime contract |
| Express 5 | HTTP API |
| TypeScript | Backend application language |
| Prisma 7.10 | Data model, migrations and generated database client |
| `@prisma/adapter-pg` + `pg` | PostgreSQL driver path |
| PostgreSQL | System of record |
| Redis client 6 | Cache/distributed counters when enabled |
| Zod 4 | Runtime request/config validation |
| Argon2 | Password hashing |
| JSON Web Token | Signed browser session token carried in secure cookie |
| Helmet / CORS / express-rate-limit | HTTP security policy and rate limiting |

## External services

| Service | Use |
|---|---|
| Resend | Operational and account email |
| Cloudinary | Authenticated private document storage |
| Cashfree | Hosted checkout for internship document-payment workflow |
| Groq | Chat-completion generation for the assistant |
| Gemini embeddings | Optional vector embeddings for dense retrieval |
| ClamAV or HTTP scanner | Production malware scanning of supported uploads |
| External monitoring webhook | Optional sanitized application-error forwarding |

## Delivery and quality tooling

- GitHub Actions
- CodeQL JavaScript/TypeScript scanning
- Dependabot
- custom secret scanner and runtime-aware dependency audit
- Node test runner for repository regression suites
- k6 scripts for smoke/baseline/stress load testing
- ESLint for the client

## Hosting assumptions

Repository deployment checks are built around a Next.js frontend and separately deployed Node API. Existing production guidance uses Vercel for the frontend and Render for the API, but the code is not conceptually tied to those vendors if equivalent environment, HTTPS, persistence and process guarantees are supplied.
