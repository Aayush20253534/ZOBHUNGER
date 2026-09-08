-- Preserve existing requirements. Revisions protect edits from stale clients;
-- nullable submission keys let older/public requests continue working.
ALTER TABLE "WorkforceRequirement"
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "submissionKey" TEXT,
  ADD COLUMN "submissionHash" TEXT;

CREATE UNIQUE INDEX "WorkforceRequirement_submissionKey_key" ON "WorkforceRequirement"("submissionKey");
