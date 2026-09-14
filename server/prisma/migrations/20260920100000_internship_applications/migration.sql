ALTER TABLE "CareerApplication"
ADD COLUMN "applicationType" TEXT NOT NULL DEFAULT 'CAREER';

DROP INDEX IF EXISTS "CareerApplication_status_createdAt_idx";
CREATE INDEX "CareerApplication_applicationType_status_createdAt_idx"
ON "CareerApplication"("applicationType", "status", "createdAt");
