# ZOBHUNGER Client

Next.js frontend for the ZOBHUNGER public website and authenticated platform portals.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

For the integrated backend:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_PLAY_URL=
NEXT_PUBLIC_APP_STORE_URL=
```

`NEXT_PUBLIC_DATA_MODE=mock` remains available for isolated frontend previews. API mode is the intended integrated configuration.

## App-store configuration

Keep `NEXT_PUBLIC_GOOGLE_PLAY_URL` and `NEXT_PUBLIC_APP_STORE_URL` blank until each application is published. The footer shows the corresponding store as coming soon while the value is blank and turns it into an external download link after a valid URL is supplied and the client is rebuilt.

## Backend-connected areas

The client consumes the versioned `/api/v1` backend through the configured API base URL. Major integrations include:

- jobs and public job applications
- articles/blogs
- workforce requirements and contact enquiries
- business authentication, dashboard, requirements, candidates, deployments, attendance and reports
- worker account, profile, resume, jobs, saved jobs, applications, assignments, attendance and earnings
- placement/institution activation, candidate management and opportunity applications
- partner, career and vendor application flows
- protected admin/operations workflows

Requests include credentials so the backend's httpOnly authentication cookie works for the browser client. The backend `CLIENT_ORIGIN` must allow the deployed frontend origin.

## Main public routes

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
/about
/presence
/brand-experience
/case-studies
/careers
/careers/apply
/become-a-partner
/placement-cell-partnership
/vendor-empanelment
```

Authenticated portal routes live under `/business`, `/worker`, `/placement-portal` and `/admin` route families.

## Quality checks

```bash
npm run lint
npm run build
```

For the complete repository verification, run `npm run verify` from the repository root.
