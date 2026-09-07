-- Link job applications submitted by approved Placement Cell partners to their institution and candidate records.
ALTER TABLE "JobApplication"
  ADD COLUMN "placementCandidateId" TEXT,
  ADD COLUMN "placementCellApplicationId" TEXT;

CREATE INDEX "JobApplication_placementCandidateId_idx"
  ON "JobApplication"("placementCandidateId");

CREATE INDEX "JobApplication_placementCellApplicationId_status_createdAt_idx"
  ON "JobApplication"("placementCellApplicationId", "status", "createdAt");

ALTER TABLE "JobApplication"
  ADD CONSTRAINT "JobApplication_placementCandidateId_fkey"
  FOREIGN KEY ("placementCandidateId") REFERENCES "PlacementCandidate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JobApplication"
  ADD CONSTRAINT "JobApplication_placementCellApplicationId_fkey"
  FOREIGN KEY ("placementCellApplicationId") REFERENCES "PlacementCellApplication"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
