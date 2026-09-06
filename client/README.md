# ZOBHUNGER Client

Next.js frontend for the ZOBHUNGER Phase 1 website.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

For the real backend:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

`NEXT_PUBLIC_DATA_MODE=mock` remains available for isolated frontend preview. API mode is the intended integrated Phase 1 configuration.

## Backend-connected flows

- Jobs list: `GET /jobs`
- Job details: `GET /jobs/:slug`
- Job applications: `POST /jobs/:jobId/applications`
- Blogs list: `GET /articles`
- Blog details: `GET /articles/:slug`
- Workforce requirements: `POST /requirements`
- Contact enquiries: `POST /contact`
- Login/logout/current account: `/auth/*`
- Admin dashboard data: `/admin/*`

Requests include credentials so the backend's httpOnly authentication cookie works. The backend `CLIENT_ORIGIN` must allow the frontend origin.

## Main Phase 1 routes

```text
/
/solutions
/industries
/technology
/for-business
/for-workers
/jobs
/blogs
/contact
/hire-workforce
/login
/admin
```

Individual articles remain at `/blog/:slug`.

## Quality checks

```bash
npm run lint
npm run build
```

For the full repository verification run `npm run verify` from the repository root.
