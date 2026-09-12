-- Phase 6: production blog CMS metadata, lifecycle, editable draft snapshots and optimistic concurrency.
ALTER TABLE "Article"
  ADD COLUMN "authorName" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "seoDescription" TEXT,
  ADD COLUMN "canonicalUrl" TEXT,
  ADD COLUMN "ogImageUrl" TEXT,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ArticleDraft" (
  "articleId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "readingMinutes" INTEGER NOT NULL,
  "takeaway" TEXT NOT NULL,
  "sections" JSONB NOT NULL,
  "authorName" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "coverImageUrl" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "canonicalUrl" TEXT,
  "ogImageUrl" TEXT,
  "isDirty" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleDraft_pkey" PRIMARY KEY ("articleId"),
  CONSTRAINT "ArticleDraft_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ArticleDraft_slug_key" ON "ArticleDraft"("slug");
CREATE INDEX "ArticleDraft_category_idx" ON "ArticleDraft"("category");
CREATE INDEX "ArticleDraft_updatedAt_idx" ON "ArticleDraft"("updatedAt");

-- Existing published/sample articles become clean draft snapshots. Future edits
-- happen here first, so saving editor changes never mutates the live article.
INSERT INTO "ArticleDraft" (
  "articleId", "slug", "title", "excerpt", "category", "readingMinutes", "takeaway", "sections",
  "authorName", "tags", "coverImageUrl", "seoTitle", "seoDescription", "canonicalUrl", "ogImageUrl", "isDirty", "updatedAt"
)
SELECT
  "id", "slug", "title", "excerpt", "category", "readingMinutes", "takeaway", "sections",
  "authorName", "tags", "coverImageUrl", "seoTitle", "seoDescription", "canonicalUrl", "ogImageUrl", false, "updatedAt"
FROM "Article";

DROP INDEX IF EXISTS "Article_isPublished_publishedAt_idx";
CREATE INDEX "Article_isPublished_archivedAt_publishedAt_idx"
  ON "Article"("isPublished", "archivedAt", "publishedAt");
CREATE INDEX "Article_archivedAt_updatedAt_idx"
  ON "Article"("archivedAt", "updatedAt");
