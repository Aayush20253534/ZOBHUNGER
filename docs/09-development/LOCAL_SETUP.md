# Local Setup

## Prerequisites

- Node.js 22
- npm
- PostgreSQL
- optional local Redis

## Backend

```bash
cd server
npm install
cp .env.example .env
```

At minimum configure a local PostgreSQL `DATABASE_URL` and 32+ character `JWT_SECRET`. For features you are not using locally, keep optional providers disabled/unconfigured according to `env.ts` validation.

Initialize a fresh development database:

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

Default API: `http://localhost:5000`.

## Frontend

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

Typical local values:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Default web app: `http://localhost:3000`.

## Redis

Redis is optional for many local correctness checks. To exercise cache/distributed budget paths, run Redis and set a local `redis://` URL.

## Admin seed

`ADMIN_SEED_PASSWORD_HASH` is an Argon2id hash, not the plaintext password. Generate a development-only hash with the installed `argon2` package, place the hash in `.env`, then log in with the plaintext value you hashed.

## Before opening a PR

Run the relevant focused test while developing, then `npm run verify` from the repository root before handoff.
