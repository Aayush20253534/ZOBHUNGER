# Database and Prisma

## Source files

- `server/prisma/schema.prisma`
- `server/prisma/migrations/`
- `server/prisma/seed.ts`
- `server/prisma.config.ts`

Prisma Client is generated into `server/src/generated/prisma` by the backend build/generate scripts.

## Development workflow

1. modify `schema.prisma`;
2. create a named development migration with Prisma;
3. inspect generated SQL;
4. regenerate client;
5. update services/repositories/tests;
6. test against a disposable PostgreSQL database;
7. commit schema + migration + code together.

## Production workflow

Use:

```bash
npm --prefix server run db:deploy
```

This runs committed migrations. Do not use interactive development migration commands against production.

## Query rules

- select only fields required by the service/view;
- paginate large lists in SQL/Prisma, not after loading them;
- use count/aggregate/groupBy for summaries when full rows are unnecessary;
- preserve transactions/locking on race-sensitive workflows;
- prefer Prisma parameterization; do not introduce unsafe raw string interpolation;
- add indexes based on actual query predicates/order, not indiscriminately.

## Sensitive exports

Count/filter before retrieving and decrypting large HR datasets. Maintain existing export caps unless a measured operational requirement justifies a carefully reviewed change.

## Recovery note

Schema/migrations are not a database backup. Repository automation does not currently implement backup/restore/PITR; operations must provide and test that separately.
