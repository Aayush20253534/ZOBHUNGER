CREATE TYPE "BusinessCandidateStatus" AS ENUM ('SHARED', 'SHORTLISTED', 'INTERVIEW_REQUESTED', 'SELECTED', 'REJECTED');
CREATE TYPE "CandidateEventKind" AS ENUM ('SHARED', 'STATUS_CHANGED', 'INTERVIEW_REQUESTED', 'FEEDBACK', 'ACCESS_REVOKED');
CREATE TABLE "BusinessCandidate" (
  "id" TEXT NOT NULL, "requirementId" TEXT NOT NULL, "applicationId" TEXT NOT NULL,
  "name" TEXT NOT NULL, "city" TEXT, "experience" TEXT, "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "resumeUrl" TEXT, "availableFrom" TIMESTAMP(3), "summary" TEXT NOT NULL, "jobTitle" TEXT NOT NULL,
  "status" "BusinessCandidateStatus" NOT NULL DEFAULT 'SHARED', "revision" INTEGER NOT NULL DEFAULT 0,
  "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessCandidate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BusinessCandidate_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "WorkforceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BusinessCandidate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BusinessCandidate_requirementId_applicationId_key" ON "BusinessCandidate"("requirementId", "applicationId");
CREATE INDEX "BusinessCandidate_requirement_stage_updated_idx" ON "BusinessCandidate"("requirementId", "revokedAt", "status", "updatedAt", "id");
CREATE INDEX "BusinessCandidate_updatedAt_id_idx" ON "BusinessCandidate"("updatedAt", "id");
CREATE INDEX "BusinessCandidate_applicationId_idx" ON "BusinessCandidate"("applicationId");
CREATE TABLE "CandidateEvent" (
  "id" TEXT NOT NULL, "candidateId" TEXT NOT NULL, "kind" "CandidateEventKind" NOT NULL, "actorRole" "UserRole" NOT NULL,
  "fromStatus" "BusinessCandidateStatus", "toStatus" "BusinessCandidateStatus", "note" TEXT NOT NULL,
  "interviewAt" TIMESTAMP(3), "interviewMode" TEXT, "interviewDetails" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CandidateEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CandidateEvent_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "BusinessCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CandidateEvent_candidateId_createdAt_id_idx" ON "CandidateEvent"("candidateId", "createdAt", "id");
