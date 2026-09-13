CREATE TYPE "ComplianceStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'RESUBMITTED', 'VERIFIED', 'PROCESSED');
CREATE TYPE "ComplianceArea" AS ENUM ('PF_EPFO', 'ESIC');
CREATE TYPE "ComplianceDocumentKind" AS ENUM ('PF_DOCUMENT', 'ESIC_DOCUMENT', 'FAMILY_MEMBER_PHOTO', 'OTHER');

-- Existing Main Admin accounts retain full access after the compliance module is deployed.
UPDATE "User"
SET "adminPermissions" = "adminPermissions" || ARRAY[
  'PF_VIEW'::"AdminPermission",
  'PF_VERIFY'::"AdminPermission",
  'PF_UPDATE'::"AdminPermission",
  'PF_EXPORT'::"AdminPermission",
  'ESIC_VIEW'::"AdminPermission",
  'ESIC_VERIFY'::"AdminPermission",
  'ESIC_UPDATE'::"AdminPermission",
  'ESIC_EXPORT'::"AdminPermission"
]
WHERE "role" = 'ADMIN' AND "adminDepartment" = 'MAIN_ADMIN';

CREATE TABLE "EmployeePfCompliance" (
  "id" TEXT NOT NULL,
  "joiningId" TEXT NOT NULL,
  "appointmentDate" TIMESTAMP(3),
  "epfWages" INTEGER,
  "monthlyGross" INTEGER,
  "department" TEXT,
  "designation" TEXT,
  "husbandName" TEXT,
  "presentDistrict" TEXT,
  "permanentDistrict" TEXT,
  "bankAccountType" TEXT,
  "existingUanEncrypted" TEXT,
  "existingUanLast4" TEXT,
  "status" "ComplianceStatus" NOT NULL DEFAULT 'DRAFT',
  "correctionRemarks" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,
  "processedAt" TIMESTAMP(3),
  "processedByUserId" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeePfCompliance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmployeeEsicCompliance" (
  "id" TEXT NOT NULL,
  "joiningId" TEXT NOT NULL,
  "esiApplicable" BOOLEAN,
  "esiNumberEncrypted" TEXT,
  "esiNumberLast4" TEXT,
  "nomineeName" TEXT,
  "nomineeRelationship" TEXT,
  "nomineeAddress" TEXT,
  "nomineeMobile" TEXT,
  "nomineeEmail" TEXT,
  "status" "ComplianceStatus" NOT NULL DEFAULT 'DRAFT',
  "correctionRemarks" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,
  "processedAt" TIMESTAMP(3),
  "processedByUserId" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeEsicCompliance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmployeeEsicFamilyMember" (
  "id" TEXT NOT NULL,
  "esicComplianceId" TEXT NOT NULL,
  "nameAsAadhaar" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "dateOfBirth" TIMESTAMP(3) NOT NULL,
  "residesWithEmployee" BOOLEAN NOT NULL,
  "address" TEXT,
  "aadhaarEncrypted" TEXT NOT NULL,
  "aadhaarLast4" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeEsicFamilyMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmployeeComplianceDocument" (
  "id" TEXT NOT NULL,
  "joiningId" TEXT NOT NULL,
  "area" "ComplianceArea" NOT NULL,
  "kind" "ComplianceDocumentKind" NOT NULL,
  "familyMemberId" TEXT,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "storagePublicId" TEXT NOT NULL,
  "storageResourceType" TEXT NOT NULL,
  "storageDeliveryType" TEXT NOT NULL,
  "storageFormat" TEXT NOT NULL,
  "storageVersion" TEXT,
  "storageAssetId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeComplianceDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployeePfCompliance_joiningId_key" ON "EmployeePfCompliance"("joiningId");
CREATE INDEX "EmployeePfCompliance_status_updatedAt_idx" ON "EmployeePfCompliance"("status", "updatedAt");
CREATE INDEX "EmployeePfCompliance_department_status_idx" ON "EmployeePfCompliance"("department", "status");

CREATE UNIQUE INDEX "EmployeeEsicCompliance_joiningId_key" ON "EmployeeEsicCompliance"("joiningId");
CREATE INDEX "EmployeeEsicCompliance_status_updatedAt_idx" ON "EmployeeEsicCompliance"("status", "updatedAt");
CREATE INDEX "EmployeeEsicCompliance_esiApplicable_status_idx" ON "EmployeeEsicCompliance"("esiApplicable", "status");

CREATE INDEX "EmployeeEsicFamilyMember_esicComplianceId_sortOrder_idx" ON "EmployeeEsicFamilyMember"("esicComplianceId", "sortOrder");
CREATE INDEX "EmployeeComplianceDocument_joiningId_area_kind_idx" ON "EmployeeComplianceDocument"("joiningId", "area", "kind");
CREATE INDEX "EmployeeComplianceDocument_familyMemberId_idx" ON "EmployeeComplianceDocument"("familyMemberId");
CREATE INDEX "EmployeeComplianceDocument_storagePublicId_idx" ON "EmployeeComplianceDocument"("storagePublicId");

ALTER TABLE "EmployeePfCompliance" ADD CONSTRAINT "EmployeePfCompliance_joiningId_fkey"
  FOREIGN KEY ("joiningId") REFERENCES "EmployeeJoining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeEsicCompliance" ADD CONSTRAINT "EmployeeEsicCompliance_joiningId_fkey"
  FOREIGN KEY ("joiningId") REFERENCES "EmployeeJoining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeEsicFamilyMember" ADD CONSTRAINT "EmployeeEsicFamilyMember_esicComplianceId_fkey"
  FOREIGN KEY ("esicComplianceId") REFERENCES "EmployeeEsicCompliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeComplianceDocument" ADD CONSTRAINT "EmployeeComplianceDocument_joiningId_fkey"
  FOREIGN KEY ("joiningId") REFERENCES "EmployeeJoining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeComplianceDocument" ADD CONSTRAINT "EmployeeComplianceDocument_familyMemberId_fkey"
  FOREIGN KEY ("familyMemberId") REFERENCES "EmployeeEsicFamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
