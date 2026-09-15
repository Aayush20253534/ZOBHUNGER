ALTER TABLE "TechnicalInstituteApplication"
  ADD COLUMN "partnershipCode" TEXT,
  ADD COLUMN "reviewNotes" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "TechnicalInstituteApplication_partnershipCode_key"
  ON "TechnicalInstituteApplication"("partnershipCode");
