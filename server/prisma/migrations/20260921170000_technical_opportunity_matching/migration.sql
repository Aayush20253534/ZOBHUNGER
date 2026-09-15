-- CreateEnum
CREATE TYPE "TechnicalOpportunityType" AS ENUM ('JOB', 'INTERNSHIP', 'APPRENTICESHIP', 'TRAINING');

-- CreateEnum
CREATE TYPE "TechnicalOpportunityStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TechnicalOpportunityApplicationStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'JOINED');

-- CreateTable
CREATE TABLE "TechnicalOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "opportunityType" "TechnicalOpportunityType" NOT NULL,
    "status" "TechnicalOpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "workMode" TEXT,
    "eligibleQualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibleTradesBranches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligiblePassingYears" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibleStates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vacancies" INTEGER,
    "compensation" TEXT,
    "duration" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "joiningDate" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TechnicalOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalOpportunityApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "TechnicalOpportunityApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "matchScore" INTEGER NOT NULL,
    "matchReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "selectedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TechnicalOpportunityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechnicalOpportunity_status_opportunityType_createdAt_idx" ON "TechnicalOpportunity"("status", "opportunityType", "createdAt");
CREATE INDEX "TechnicalOpportunity_city_state_idx" ON "TechnicalOpportunity"("city", "state");
CREATE INDEX "TechnicalOpportunity_applicationDeadline_idx" ON "TechnicalOpportunity"("applicationDeadline");
CREATE UNIQUE INDEX "TechnicalOpportunityApplication_opportunityId_studentId_key" ON "TechnicalOpportunityApplication"("opportunityId", "studentId");
CREATE INDEX "TechnicalOpportunityApplication_opportunityId_status_createdAt_idx" ON "TechnicalOpportunityApplication"("opportunityId", "status", "createdAt");
CREATE INDEX "TechnicalOpportunityApplication_studentId_createdAt_idx" ON "TechnicalOpportunityApplication"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "TechnicalOpportunityApplication" ADD CONSTRAINT "TechnicalOpportunityApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "TechnicalOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TechnicalOpportunityApplication" ADD CONSTRAINT "TechnicalOpportunityApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "TechnicalStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
