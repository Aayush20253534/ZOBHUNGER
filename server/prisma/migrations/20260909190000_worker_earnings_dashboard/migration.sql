-- P3.6 worker earnings and operations-maintained payment history.
-- Monetary values are exact integer paise; approved statements are corrected through append-only adjustments.

CREATE TYPE "EarningsStatementStatus" AS ENUM ('DRAFT', 'APPROVED');
CREATE TYPE "EarningsLineType" AS ENUM ('AGREED_EARNINGS', 'ALLOWANCE', 'REIMBURSEMENT', 'DEDUCTION');
CREATE TYPE "EarningsAdjustmentType" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "PaymentRecordStatus" AS ENUM ('RECORDED', 'VOIDED');

CREATE TABLE "EarningsStatement" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "EarningsStatementStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" TEXT,
    "approvalAttendanceSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EarningsStatement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EarningsLine" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "type" "EarningsLineType" NOT NULL,
    "label" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reason" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarningsLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EarningsAdjustment" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "type" "EarningsAdjustmentType" NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarningsAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "requestKey" TEXT NOT NULL,
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'RECORDED',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "recordedByUserId" TEXT NOT NULL,
    "voidedByUserId" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EarningsStatement_requestKey_key" ON "EarningsStatement"("requestKey");
CREATE UNIQUE INDEX "EarningsStatement_assignmentId_periodStart_periodEnd_key" ON "EarningsStatement"("assignmentId", "periodStart", "periodEnd");
CREATE INDEX "EarningsStatement_assignmentId_status_periodStart_periodEnd_idx" ON "EarningsStatement"("assignmentId", "status", "periodStart", "periodEnd");
CREATE INDEX "EarningsStatement_status_createdAt_id_idx" ON "EarningsStatement"("status", "createdAt", "id");
CREATE INDEX "EarningsLine_statementId_sortOrder_id_idx" ON "EarningsLine"("statementId", "sortOrder", "id");
CREATE UNIQUE INDEX "EarningsAdjustment_requestKey_key" ON "EarningsAdjustment"("requestKey");
CREATE INDEX "EarningsAdjustment_statementId_createdAt_id_idx" ON "EarningsAdjustment"("statementId", "createdAt", "id");
CREATE UNIQUE INDEX "PaymentRecord_requestKey_key" ON "PaymentRecord"("requestKey");
CREATE INDEX "PaymentRecord_statementId_status_paidAt_id_idx" ON "PaymentRecord"("statementId", "status", "paidAt", "id");

ALTER TABLE "EarningsStatement" ADD CONSTRAINT "EarningsStatement_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EarningsLine" ADD CONSTRAINT "EarningsLine_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "EarningsStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EarningsAdjustment" ADD CONSTRAINT "EarningsAdjustment_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "EarningsStatement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "EarningsStatement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
