CREATE TYPE "WorkerTokenPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

ALTER TABLE "WorkerProfile"
  ADD COLUMN "headline" TEXT,
  ADD COLUMN "about" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "education" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "workExperience" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "preferredLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "preferredCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "preferredEngagements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "availability" TEXT,
  ADD COLUMN "consentAt" TIMESTAMP(3),
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "resumeRevision" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "WorkerAccessToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" "WorkerTokenPurpose" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "sessionVersion" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkerAccessToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkerAccessToken_tokenHash_key" ON "WorkerAccessToken"("tokenHash");
CREATE UNIQUE INDEX "WorkerAccessToken_userId_purpose_key" ON "WorkerAccessToken"("userId", "purpose");
CREATE INDEX "WorkerAccessToken_expiresAt_idx" ON "WorkerAccessToken"("expiresAt");
ALTER TABLE "WorkerAccessToken" ADD CONSTRAINT "WorkerAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WorkerResume" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkerResume_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkerResume_profileId_key" ON "WorkerResume"("profileId");
ALTER TABLE "WorkerResume" ADD CONSTRAINT "WorkerResume_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WorkerSavedJob" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "engagementType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkerSavedJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkerSavedJob_userId_jobId_key" ON "WorkerSavedJob"("userId", "jobId");
CREATE INDEX "WorkerSavedJob_userId_createdAt_id_idx" ON "WorkerSavedJob"("userId", "createdAt", "id");
ALTER TABLE "WorkerSavedJob" ADD CONSTRAINT "WorkerSavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkerSavedJob" ADD CONSTRAINT "WorkerSavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
