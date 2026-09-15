CREATE TABLE "TechnicalInstituteApplication" (
    "id" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "institutionType" TEXT NOT NULL,
    "ownershipType" TEXT NOT NULL,
    "affiliationBody" TEXT NOT NULL,
    "affiliationNumber" TEXT,
    "website" TEXT,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "contactPersonName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "alternateNumber" TEXT,
    "totalStudents" INTEGER NOT NULL,
    "finalYearStudents" INTEGER NOT NULL,
    "passingYear" TEXT NOT NULL,
    "tradesBranches" TEXT NOT NULL,
    "preferredOpportunityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technicalHiringNotes" TEXT,
    "status" "PlacementCellApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TechnicalInstituteApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TechnicalInstituteApplication_status_createdAt_idx" ON "TechnicalInstituteApplication"("status", "createdAt");
CREATE INDEX "TechnicalInstituteApplication_officialEmail_idx" ON "TechnicalInstituteApplication"("officialEmail");
CREATE INDEX "TechnicalInstituteApplication_city_state_idx" ON "TechnicalInstituteApplication"("city", "state");
CREATE INDEX "TechnicalInstituteApplication_institutionType_idx" ON "TechnicalInstituteApplication"("institutionType");
CREATE INDEX "TechnicalInstituteApplication_affiliationBody_idx" ON "TechnicalInstituteApplication"("affiliationBody");
