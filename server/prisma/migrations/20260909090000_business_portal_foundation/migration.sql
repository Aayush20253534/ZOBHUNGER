-- Additive foundation: public enquiries and existing role records are retained.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BusinessProfile" ADD COLUMN "state" TEXT, ADD COLUMN "onboardedAt" TIMESTAMP(3);
ALTER TABLE "WorkforceRequirement" ADD COLUMN "businessProfileId" TEXT;
CREATE INDEX "WorkforceRequirement_businessProfileId_createdAt_idx" ON "WorkforceRequirement"("businessProfileId", "createdAt");
ALTER TABLE "WorkforceRequirement" ADD CONSTRAINT "WorkforceRequirement_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Only an existing, explicit submitter relation can establish ownership.
-- Anonymous records are never claimed by matching an email address.
UPDATE "WorkforceRequirement" AS r SET "businessProfileId" = b."id"
FROM "BusinessProfile" AS b JOIN "User" AS u ON u."id" = b."userId"
WHERE r."submittedByUserId" = b."userId" AND u."role" = 'BUSINESS';
CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_userId_key" ON "PasswordResetToken"("userId");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
