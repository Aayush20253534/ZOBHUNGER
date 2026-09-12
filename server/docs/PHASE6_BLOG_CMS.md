# Phase 6 — Admin Blog & Content Studio

Phase 6 moves ZOBHUNGER's public articles from release-managed seed content into a permission-controlled editorial workflow inside the existing Admin Portal.

## Access

The workspace is available at `/admin/blogs` and requires an authenticated administrator with MFA plus `BLOGS_MANAGE`. Main Administration inherits all permissions. Department access remains configurable through the existing Admin Access workspace.

## Editorial lifecycle

Articles support four operational states: Draft, Scheduled, Published and Archived. Editing a published article writes to its `ArticleDraft` snapshot first, so the public article does not change until an administrator explicitly publishes the revision. Publishing copies the validated draft into the live `Article` record. Scheduling uses a future `publishedAt`; public queries exclude future, draft and archived records.

All writes use the Article `revision` field for optimistic concurrency. Conflicting stale updates are rejected instead of silently overwriting a newer editor's work. Create, save, publish/schedule, unpublish, archive and restore actions are written to the existing audit log.

## Content model

The editor manages title, slug, topic, author, tags, excerpt, takeaway, cover image, SEO metadata and ordered sections. Sections can contain paragraphs, bullet points, pull quotes and HTTPS images with alt text/captions. Inline paragraph formatting is deliberately constrained to bold, italic and HTTPS/relative links and is rendered without raw HTML.

## Public delivery

In API mode the public `/blogs` and `/blog/[slug]` experiences read published content from the server. Published article pages use CMS metadata for title, description, canonical URL and Open Graph imagery and expose Article JSON-LD. Existing mock article data remains available only when the client is explicitly configured for mock mode.

## Data safety and deployment

Migration `20260917100000_blog_cms` adds editorial metadata and an `ArticleDraft` table, then backfills clean draft snapshots for existing articles. It does not delete existing article records. The project seed uses create-only article semantics and therefore cannot overwrite content subsequently edited in the CMS.

For deployment:

```bash
npm --prefix server run db:generate
npm run verify
npm --prefix server run db:deploy
```

No new environment variables are required by Phase 6. Editorial images currently use public HTTPS image URLs; private HR/document storage is intentionally not reused for public blog media.
