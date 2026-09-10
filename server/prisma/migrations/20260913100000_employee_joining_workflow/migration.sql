CREATE TYPE "EmployeeJoiningStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "EmployeeJoiningDocumentKind" AS ENUM ('PHOTO', 'AADHAAR', 'PAN', 'BANK_PROOF', 'ADDRESS_PROOF', 'EDUCATION', 'EXPERIENCE', 'OTHER');
CREATE TYPE "EmployeeOfferStatus" AS ENUM ('DRAFT', 'APPROVED', 'ISSUING', 'ISSUED');

CREATE TABLE "EmployeeJoining" (
  "id" TEXT NOT NULL,
  "submissionKey" TEXT NOT NULL,
  "submissionHash" TEXT NOT NULL,
  "employeeNumber" TEXT,
  "projectCode" TEXT NOT NULL,
  "projectAssignment" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "fatherGuardianName" TEXT NOT NULL,
  "personalEmail" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "alternatePhone" TEXT,
  "dateOfBirth" TIMESTAMP(3) NOT NULL,
  "gender" TEXT NOT NULL,
  "maritalStatus" TEXT,
  "bloodGroup" TEXT,
  "shirtSize" TEXT,
  "currentAddressLine1" TEXT NOT NULL,
  "currentAddressLine2" TEXT,
  "currentCity" TEXT NOT NULL,
  "currentState" TEXT NOT NULL,
  "currentPostalCode" TEXT NOT NULL,
  "permanentSameAsCurrent" BOOLEAN NOT NULL DEFAULT true,
  "permanentAddressLine1" TEXT NOT NULL,
  "permanentAddressLine2" TEXT,
  "permanentCity" TEXT NOT NULL,
  "permanentState" TEXT NOT NULL,
  "permanentPostalCode" TEXT NOT NULL,
  "emergencyContactName" TEXT NOT NULL,
  "emergencyRelationship" TEXT NOT NULL,
  "emergencyPhone" TEXT NOT NULL,
  "aadhaarEncrypted" TEXT NOT NULL,
  "aadhaarLast4" TEXT NOT NULL,
  "panEncrypted" TEXT NOT NULL,
  "panLast4" TEXT NOT NULL,
  "bankAccountHolder" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "bankAccountEncrypted" TEXT NOT NULL,
  "bankAccountLast4" TEXT NOT NULL,
  "ifscCode" TEXT NOT NULL,
  "bankBranch" TEXT NOT NULL,
  "upiId" TEXT,
  "uanEncrypted" TEXT,
  "highestQualification" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "boardUniversity" TEXT,
  "graduationYear" INTEGER,
  "grade" TEXT,
  "previousEmployment" JSONB NOT NULL DEFAULT '[]',
  "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "EmployeeJoiningStatus" NOT NULL DEFAULT 'DRAFT',
  "reviewNotes" TEXT,
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "uploadTokenHash" TEXT,
  "uploadExpiresAt" TIMESTAMP(3),
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeJoining_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmployeeJoiningDocument" (
  "id" TEXT NOT NULL,
  "joiningId" TEXT NOT NULL,
  "kind" "EmployeeJoiningDocumentKind" NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "data" BYTEA,
  "storagePublicId" TEXT,
  "storageResourceType" TEXT,
  "storageDeliveryType" TEXT,
  "storageFormat" TEXT,
  "storageVersion" TEXT,
  "storageAssetId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeJoiningDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmployeeNumberSequence" (
  "key" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeNumberSequence_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "EmployeeOfferLetter" (
  "id" TEXT NOT NULL,
  "joiningId" TEXT NOT NULL,
  "status" "EmployeeOfferStatus" NOT NULL DEFAULT 'DRAFT',
  "designation" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "projectAssignment" TEXT NOT NULL,
  "workLocation" TEXT NOT NULL,
  "joiningDate" TIMESTAMP(3) NOT NULL,
  "employmentType" TEXT NOT NULL,
  "monthlyGrossSalary" INTEGER NOT NULL,
  "annualCtc" INTEGER NOT NULL,
  "probationMonths" INTEGER NOT NULL DEFAULT 3,
  "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
  "additionalTerms" TEXT,
  "authorizedSignatoryName" TEXT,
  "authorizedSignatoryTitle" TEXT,
  "signatureFileName" TEXT,
  "signatureMimeType" TEXT,
  "signatureSize" INTEGER,
  "signatureSha256" TEXT,
  "signatureStoragePublicId" TEXT,
  "signatureStorageResourceType" TEXT,
  "signatureStorageDeliveryType" TEXT,
  "signatureStorageFormat" TEXT,
  "signatureStorageVersion" TEXT,
  "signatureStorageAssetId" TEXT,
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "issuedByUserId" TEXT,
  "issuedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "resendMessageId" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeOfferLetter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployeeJoining_submissionKey_key" ON "EmployeeJoining"("submissionKey");
CREATE UNIQUE INDEX "EmployeeJoining_employeeNumber_key" ON "EmployeeJoining"("employeeNumber");
CREATE UNIQUE INDEX "EmployeeJoining_uploadTokenHash_key" ON "EmployeeJoining"("uploadTokenHash");
CREATE INDEX "EmployeeJoining_status_createdAt_idx" ON "EmployeeJoining"("status", "createdAt");
CREATE INDEX "EmployeeJoining_personalEmail_idx" ON "EmployeeJoining"("personalEmail");
CREATE INDEX "EmployeeJoining_projectCode_submittedAt_idx" ON "EmployeeJoining"("projectCode", "submittedAt");
CREATE INDEX "EmployeeJoining_employeeNumber_idx" ON "EmployeeJoining"("employeeNumber");
CREATE UNIQUE INDEX "EmployeeJoiningDocument_joiningId_kind_key" ON "EmployeeJoiningDocument"("joiningId", "kind");
CREATE INDEX "EmployeeJoiningDocument_joiningId_idx" ON "EmployeeJoiningDocument"("joiningId");
CREATE INDEX "EmployeeJoiningDocument_storagePublicId_idx" ON "EmployeeJoiningDocument"("storagePublicId");
CREATE UNIQUE INDEX "EmployeeOfferLetter_joiningId_key" ON "EmployeeOfferLetter"("joiningId");
CREATE INDEX "EmployeeOfferLetter_status_updatedAt_idx" ON "EmployeeOfferLetter"("status", "updatedAt");

ALTER TABLE "EmployeeJoiningDocument" ADD CONSTRAINT "EmployeeJoiningDocument_joiningId_fkey" FOREIGN KEY ("joiningId") REFERENCES "EmployeeJoining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeOfferLetter" ADD CONSTRAINT "EmployeeOfferLetter_joiningId_fkey" FOREIGN KEY ("joiningId") REFERENCES "EmployeeJoining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
