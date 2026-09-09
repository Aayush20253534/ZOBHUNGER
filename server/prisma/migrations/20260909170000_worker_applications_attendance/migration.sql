-- CreateEnum
CREATE TYPE "WorkerAttendanceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "jobSnapshot" JSONB,
ADD COLUMN     "profileSnapshot" JSONB,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "withdrawalReason" TEXT,
ADD COLUMN     "withdrawnAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CandidateEvent" ADD COLUMN     "workerMessage" TEXT;

-- CreateTable
CREATE TABLE "WorkerApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "interviewAt" TIMESTAMP(3),
    "interviewMode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplicationResume" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplicationResume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAttendanceRequest" (
    "id" TEXT NOT NULL,
    "workerUserId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "openKey" TEXT,
    "date" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "WorkerAttendanceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "attendanceStatus" "AttendanceStatus" NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "workedMinutes" INTEGER,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "recordRevision" INTEGER,
    "recordApprovalRevision" INTEGER,
    "assignmentRevision" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "recordId" TEXT,
    "approvedRecordRevision" INTEGER,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerAttendanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerApplicationEvent_applicationId_createdAt_id_idx" ON "WorkerApplicationEvent"("applicationId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplicationResume_applicationId_key" ON "JobApplicationResume"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerAttendanceRequest_openKey_key" ON "WorkerAttendanceRequest"("openKey");

-- CreateIndex
CREATE INDEX "WorkerAttendanceRequest_workerUserId_status_createdAt_id_idx" ON "WorkerAttendanceRequest"("workerUserId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "WorkerAttendanceRequest_status_createdAt_id_idx" ON "WorkerAttendanceRequest"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "WorkerAttendanceRequest_assignmentId_date_status_idx" ON "WorkerAttendanceRequest"("assignmentId", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerAttendanceRequest_workerUserId_requestKey_key" ON "WorkerAttendanceRequest"("workerUserId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_workerUserId_key" ON "JobApplication"("jobId", "workerUserId");

-- AddForeignKey
ALTER TABLE "WorkerApplicationEvent" ADD CONSTRAINT "WorkerApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplicationResume" ADD CONSTRAINT "JobApplicationResume_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendanceRequest" ADD CONSTRAINT "WorkerAttendanceRequest_workerUserId_fkey" FOREIGN KEY ("workerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendanceRequest" ADD CONSTRAINT "WorkerAttendanceRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendanceRequest" ADD CONSTRAINT "WorkerAttendanceRequest_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendanceRequest" ADD CONSTRAINT "WorkerAttendanceRequest_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
