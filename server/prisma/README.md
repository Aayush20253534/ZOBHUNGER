# Database workflow

The Prisma schema is the source of truth for the ZOBHUNGER database.

## First local setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Generate an Argon2id password hash for the seed admin and assign it to `ADMIN_SEED_PASSWORD_HASH`.
4. Run `npm run db:generate`.
5. Run `npm run db:migrate -- --name phase1_foundation`.
6. Run `npm run db:seed`.

The seed is idempotent: the admin is upserted by email and demo jobs are upserted by slug.

Do not place a plaintext admin password in source control or in `ADMIN_SEED_PASSWORD_HASH`. The seed validates that the value is an Argon2id hash (`$argon2id$...`). Part 5 will add the runtime Argon2 hashing utility used by registration/login flows.
