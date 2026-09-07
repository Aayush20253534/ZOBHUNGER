CREATE TYPE "PlacementCellApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "PlacementCellApplication" (
    "id" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "institutionType" TEXT NOT NULL,
    "placementCellName" TEXT NOT NULL,
    "contactPersonName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "website" TEXT,
    "numberOfStudents" INTEGER NOT NULL,
    "coursesDepartments" TEXT NOT NULL,
    "preferredOpportunityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PlacementCellApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlacementCellApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlacementCellApplication_status_createdAt_idx" ON "PlacementCellApplication"("status", "createdAt");
CREATE INDEX "PlacementCellApplication_officialEmail_idx" ON "PlacementCellApplication"("officialEmail");
CREATE INDEX "PlacementCellApplication_city_state_idx" ON "PlacementCellApplication"("city", "state");
CREATE INDEX "PlacementCellApplication_institutionType_idx" ON "PlacementCellApplication"("institutionType");
