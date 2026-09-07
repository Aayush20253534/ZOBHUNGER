CREATE TABLE "PlacementCandidate" (
  "id" TEXT NOT NULL,
  "placementCellApplicationId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "mobileNumber" TEXT NOT NULL,
  "qualification" TEXT NOT NULL,
  "course" TEXT NOT NULL,
  "department" TEXT,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "availability" TEXT NOT NULL,
  "experience" TEXT,
  "preferredWorkTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlacementCandidate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlacementCandidate_placementCellApplicationId_email_key" ON "PlacementCandidate"("placementCellApplicationId", "email");
CREATE INDEX "PlacementCandidate_placementCellApplicationId_createdAt_idx" ON "PlacementCandidate"("placementCellApplicationId", "createdAt");
CREATE INDEX "PlacementCandidate_placementCellApplicationId_fullName_idx" ON "PlacementCandidate"("placementCellApplicationId", "fullName");
CREATE INDEX "PlacementCandidate_placementCellApplicationId_city_idx" ON "PlacementCandidate"("placementCellApplicationId", "city");
ALTER TABLE "PlacementCandidate" ADD CONSTRAINT "PlacementCandidate_placementCellApplicationId_fkey" FOREIGN KEY ("placementCellApplicationId") REFERENCES "PlacementCellApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
