CREATE TYPE "TechnicalStudentStatus" AS ENUM ('PENDING', 'VERIFIED', 'INACTIVE');
CREATE TYPE "TechnicalStudentSource" AS ENUM ('SELF_REGISTRATION', 'ADMIN_ENTRY', 'BULK_IMPORT');

CREATE TABLE "TechnicalStudent" (
    "id" TEXT NOT NULL,
    "technicalInstituteApplicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "enrollmentNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "qualification" TEXT NOT NULL,
    "tradeBranch" TEXT NOT NULL,
    "passingYear" TEXT NOT NULL,
    "currentSemesterYear" TEXT,
    "academicScore" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentCity" TEXT NOT NULL,
    "currentState" TEXT NOT NULL,
    "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredOpportunityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "TechnicalStudentStatus" NOT NULL DEFAULT 'PENDING',
    "source" "TechnicalStudentSource" NOT NULL DEFAULT 'SELF_REGISTRATION',
    "importBatch" TEXT,
    "submittedByUserId" TEXT,
    "consentAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TechnicalStudent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TechnicalStudent_technicalInstituteApplicationId_email_key"
  ON "TechnicalStudent"("technicalInstituteApplicationId", "email");
CREATE UNIQUE INDEX "TechnicalStudent_technicalInstituteApplicationId_enrollmentNumber_key"
  ON "TechnicalStudent"("technicalInstituteApplicationId", "enrollmentNumber");
CREATE INDEX "TechnicalStudent_technicalInstituteApplicationId_status_createdAt_idx"
  ON "TechnicalStudent"("technicalInstituteApplicationId", "status", "createdAt");
CREATE INDEX "TechnicalStudent_technicalInstituteApplicationId_tradeBranch_idx"
  ON "TechnicalStudent"("technicalInstituteApplicationId", "tradeBranch");
CREATE INDEX "TechnicalStudent_technicalInstituteApplicationId_passingYear_idx"
  ON "TechnicalStudent"("technicalInstituteApplicationId", "passingYear");
CREATE INDEX "TechnicalStudent_email_idx" ON "TechnicalStudent"("email");
CREATE INDEX "TechnicalStudent_mobileNumber_idx" ON "TechnicalStudent"("mobileNumber");

ALTER TABLE "TechnicalStudent"
  ADD CONSTRAINT "TechnicalStudent_technicalInstituteApplicationId_fkey"
  FOREIGN KEY ("technicalInstituteApplicationId") REFERENCES "TechnicalInstituteApplication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
