ALTER TYPE "PartnerApplicationStatus" ADD VALUE 'APPROVED';
ALTER TYPE "PartnerApplicationStatus" ADD VALUE 'REJECTED';
CREATE TYPE "CareerApplicationStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'CONTACTED', 'HIRED', 'REJECTED');

-- Existing self-registered businesses retain their data but must be reviewed.
ALTER TABLE "User"
  ADD COLUMN "partnerCode" TEXT,
  ADD COLUMN "businessAccessApproved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "temporaryPasswordExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_partnerCode_key" ON "User"("partnerCode");
ALTER TABLE "PartnerApplication"
  ADD COLUMN "reviewNotes" TEXT,
  ADD COLUMN "reviewedByUserId" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "provisionedUserId" TEXT,
  ADD COLUMN "credentialsIssuedAt" TIMESTAMP(3),
  ADD COLUMN "credentialsEmailStatus" TEXT;
CREATE UNIQUE INDEX "PartnerApplication_provisionedUserId_key" ON "PartnerApplication"("provisionedUserId");
ALTER TABLE "PartnerApplication" ADD CONSTRAINT "PartnerApplication_provisionedUserId_fkey"
  FOREIGN KEY ("provisionedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CareerApplication" (
  "id" TEXT NOT NULL,
  "submissionKey" TEXT NOT NULL,
  "submissionHash" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "preferredRole" TEXT NOT NULL,
  "experienceYears" INTEGER NOT NULL,
  "education" JSONB NOT NULL,
  "workExperience" JSONB NOT NULL,
  "skills" TEXT[] NOT NULL,
  "preferredLocations" TEXT[] NOT NULL,
  "availability" TEXT NOT NULL,
  "portfolioUrl" TEXT,
  "coverNote" TEXT,
  "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resumeFileName" TEXT,
  "resumeMimeType" TEXT,
  "resumeData" BYTEA,
  "resumeUploadTokenHash" TEXT,
  "resumeUploadExpiresAt" TIMESTAMP(3),
  "resumeSha256" TEXT,
  "status" "CareerApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reviewNotes" TEXT,
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareerApplication_submissionKey_key" ON "CareerApplication"("submissionKey");
CREATE UNIQUE INDEX "CareerApplication_resumeUploadTokenHash_key" ON "CareerApplication"("resumeUploadTokenHash");
CREATE INDEX "CareerApplication_status_createdAt_idx" ON "CareerApplication"("status", "createdAt");
CREATE INDEX "CareerApplication_email_idx" ON "CareerApplication"("email");
CREATE INDEX "CareerApplication_city_idx" ON "CareerApplication"("city");
