ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TECHNICAL_INSTITUTE';
ALTER TYPE "TechnicalStudentSource" ADD VALUE IF NOT EXISTS 'INSTITUTE_PORTAL';

ALTER TABLE "TechnicalInstituteApplication"
  ADD COLUMN "provisionedUserId" TEXT,
  ADD COLUMN "activationTokenHash" TEXT,
  ADD COLUMN "activationExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "TechnicalInstituteApplication_provisionedUserId_key"
  ON "TechnicalInstituteApplication"("provisionedUserId");

CREATE UNIQUE INDEX "TechnicalInstituteApplication_activationTokenHash_key"
  ON "TechnicalInstituteApplication"("activationTokenHash");
