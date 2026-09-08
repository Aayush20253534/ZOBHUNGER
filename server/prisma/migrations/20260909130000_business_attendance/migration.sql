CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE', 'OFF');
CREATE TYPE "AttendanceCorrectionStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');
CREATE TABLE "WorkforceAssignment" (
  "id" TEXT NOT NULL, "candidateId" TEXT NOT NULL, "requirementId" TEXT NOT NULL,
  "name" TEXT NOT NULL, "role" TEXT NOT NULL, "location" TEXT NOT NULL, "supervisor" TEXT NOT NULL,
  "startDate" DATE NOT NULL, "endDate" DATE NOT NULL, "shiftStart" INTEGER NOT NULL, "shiftEnd" INTEGER NOT NULL,
  "graceMinutes" INTEGER NOT NULL DEFAULT 10, "workingDays" INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6]::INTEGER[],
  "cancelledAt" TIMESTAMP(3), "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkforceAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkforceAssignment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "BusinessCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkforceAssignment_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "WorkforceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkforceAssignment_dates_check" CHECK ("endDate" >= "startDate"),
  CONSTRAINT "WorkforceAssignment_shift_check" CHECK ("shiftStart" BETWEEN 0 AND 1439 AND "shiftEnd" BETWEEN 0 AND 1439 AND "shiftStart" <> "shiftEnd")
);
CREATE UNIQUE INDEX "WorkforceAssignment_candidateId_key" ON "WorkforceAssignment"("candidateId");
CREATE INDEX "WorkforceAssignment_requirementId_startDate_endDate_idx" ON "WorkforceAssignment"("requirementId","startDate","endDate");
CREATE INDEX "WorkforceAssignment_cancelledAt_startDate_endDate_idx" ON "WorkforceAssignment"("cancelledAt","startDate","endDate");
CREATE TABLE "AttendanceRecord" (
  "id" TEXT NOT NULL, "assignmentId" TEXT NOT NULL, "date" DATE NOT NULL, "status" "AttendanceStatus" NOT NULL,
  "checkInAt" TIMESTAMP(3), "checkOutAt" TIMESTAMP(3), "breakMinutes" INTEGER NOT NULL DEFAULT 0,
  "workedMinutes" INTEGER, "lateMinutes" INTEGER NOT NULL DEFAULT 0, "note" TEXT NOT NULL, "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AttendanceRecord_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AttendanceRecord_minutes_check" CHECK ("breakMinutes" >= 0 AND "lateMinutes" >= 0 AND ("workedMinutes" IS NULL OR "workedMinutes" >= 0))
);
CREATE UNIQUE INDEX "AttendanceRecord_assignmentId_date_key" ON "AttendanceRecord"("assignmentId","date");
CREATE INDEX "AttendanceRecord_date_status_idx" ON "AttendanceRecord"("date","status");
CREATE TABLE "AttendanceEvent" (
  "id" TEXT NOT NULL, "recordId" TEXT NOT NULL, "status" "AttendanceStatus" NOT NULL,
  "checkInAt" TIMESTAMP(3), "checkOutAt" TIMESTAMP(3), "breakMinutes" INTEGER NOT NULL,
  "workedMinutes" INTEGER, "lateMinutes" INTEGER NOT NULL, "note" TEXT NOT NULL, "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AttendanceEvent_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AttendanceEvent_recordId_createdAt_id_idx" ON "AttendanceEvent"("recordId","createdAt","id");
CREATE TABLE "AttendanceCorrection" (
  "id" TEXT NOT NULL, "assignmentId" TEXT NOT NULL, "date" DATE NOT NULL, "openKey" TEXT,
  "recordRevision" INTEGER, "reason" TEXT NOT NULL, "status" "AttendanceCorrectionStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttendanceCorrection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AttendanceCorrection_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AttendanceCorrection_openKey_key" ON "AttendanceCorrection"("openKey");
CREATE INDEX "AttendanceCorrection_assignmentId_date_createdAt_idx" ON "AttendanceCorrection"("assignmentId","date","createdAt");
CREATE INDEX "AttendanceCorrection_status_createdAt_idx" ON "AttendanceCorrection"("status","createdAt");
