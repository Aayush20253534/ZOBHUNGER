# ZOBHUNGER Client

Next.js frontend for the ZOBHUNGER public website.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The frontend supports two operational-data modes:

- `NEXT_PUBLIC_DATA_MODE=mock` keeps jobs and forms on local preview data.
- `NEXT_PUBLIC_DATA_MODE=api` connects jobs, contact enquiries, workforce requirements and job applications to the Express backend.

For the local backend use:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

The Express server must allow the frontend origin through `CLIENT_ORIGIN` (normally `http://localhost:3000`). Requests include credentials so the same API client is ready for the secure httpOnly auth cookie introduced in backend Part 5.

## Phase 1 API connections

- Jobs list: `GET /jobs`
- Job details: `GET /jobs/:slug`
- Job applications: `POST /jobs/:jobId/applications` (the backend accepts a job ID or slug)
- Workforce requirements: `POST /requirements`
- Contact enquiries: `POST /contact`

Blog & Insights remains on reviewed sample editorial content in Phase 1 because no public article API has been introduced yet. Switching operational data to API mode therefore does not break the editorial pages or incorrectly present sample articles as backend-managed content.
