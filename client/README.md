# ZOBHUNGER Client

Next.js frontend for the public ZOBHUNGER website and authenticated business, worker, placement, technical-institute and admin portals.

## Local start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Typical integrated configuration:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production runtime/build validation rejects mock mode and unsafe localhost/non-HTTPS production configuration according to `config/runtime-env.mjs`.

## Code map

```text
src/app/          routes/layouts/loading/error boundaries
src/components/   public + portal components
src/services/     API/domain clients
src/lib/          shared utilities
src/styles/       brand and feature CSS
public/           static media/fonts/logos
```

## Checks

```bash
npm run check:env
npm run lint
npm run build
```

For the full repository gate run `npm run verify` from the repository root.

## Documentation

- [Public website](../docs/05-features/PUBLIC_WEBSITE.md)
- [Portal feature docs](../docs/05-features/)
- [Design system](../docs/04-design/DESIGN_SYSTEM.md)
- [Responsive/accessibility](../docs/04-design/RESPONSIVE_AND_ACCESSIBILITY.md)
- [API overview](../docs/06-api/API_OVERVIEW.md)
