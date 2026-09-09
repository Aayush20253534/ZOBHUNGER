CREATE TYPE "AttendanceApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED');
ALTER TABLE "Job" ADD COLUMN "requirementId" TEXT, ADD COLUMN "creationKey" TEXT, ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "Job_creationKey_key" ON "Job"("creationKey");
CREATE INDEX "Job_requirementId_status_idx" ON "Job"("requirementId", "status");
ALTER TABLE "Job" ADD CONSTRAINT "Job_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "WorkforceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD COLUMN "approvalStatus" "AttendanceApprovalStatus" NOT NULL DEFAULT 'PENDING', ADD COLUMN "approvalRevision" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "AttendanceRecord_approvalStatus_date_idx" ON "AttendanceRecord"("approvalStatus", "date");
CREATE TABLE "RequirementDraft" (
  "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "data" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0, "submittedAt" TIMESTAMP(3), "submittedRequirementId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RequirementDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RequirementDraft_submittedRequirementId_fkey" FOREIGN KEY ("submittedRequirementId") REFERENCES "WorkforceRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RequirementDraft_submittedRequirementId_key" ON "RequirementDraft"("submittedRequirementId");
CREATE INDEX "RequirementDraft_userId_submittedAt_updatedAt_idx" ON "RequirementDraft"("userId", "submittedAt", "updatedAt");
CREATE TABLE "AttendanceApprovalEvent" (
  "id" TEXT NOT NULL PRIMARY KEY, "recordId" TEXT NOT NULL, "recordRevision" INTEGER NOT NULL,
  "approvalRevision" INTEGER NOT NULL, "action" TEXT NOT NULL, "actorRole" "UserRole" NOT NULL,
  "actorUserId" TEXT, "note" TEXT NOT NULL, "snapshot" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceApprovalEvent_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AttendanceApprovalEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AttendanceApprovalEvent_recordId_createdAt_id_idx" ON "AttendanceApprovalEvent"("recordId", "createdAt", "id");
