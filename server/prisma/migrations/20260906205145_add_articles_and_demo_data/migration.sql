-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "readingMinutes" INTEGER NOT NULL,
    "takeaway" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_isPublished_publishedAt_idx" ON "Article"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_category_idx" ON "Article"("category");
