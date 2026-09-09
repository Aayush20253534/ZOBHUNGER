-- Private file metadata. Legacy byte columns remain nullable only so the one-time
-- Cloudinary migration can move existing data without downtime; new writes never
-- store file bodies in PostgreSQL.
ALTER TABLE "WorkerResume" ALTER COLUMN "data" DROP NOT NULL;
ALTER TABLE "WorkerResume" ADD COLUMN "storagePublicId" TEXT,
  ADD COLUMN "storageResourceType" TEXT,
  ADD COLUMN "storageDeliveryType" TEXT,
  ADD COLUMN "storageFormat" TEXT,
  ADD COLUMN "storageVersion" TEXT,
  ADD COLUMN "storageAssetId" TEXT;
CREATE INDEX "WorkerResume_storagePublicId_idx" ON "WorkerResume"("storagePublicId");

ALTER TABLE "JobApplicationResume" ALTER COLUMN "data" DROP NOT NULL;
ALTER TABLE "JobApplicationResume" ADD COLUMN "storagePublicId" TEXT,
  ADD COLUMN "storageResourceType" TEXT,
  ADD COLUMN "storageDeliveryType" TEXT,
  ADD COLUMN "storageFormat" TEXT,
  ADD COLUMN "storageVersion" TEXT,
  ADD COLUMN "storageAssetId" TEXT;
CREATE INDEX "JobApplicationResume_storagePublicId_idx" ON "JobApplicationResume"("storagePublicId");

ALTER TABLE "VendorDocument" ALTER COLUMN "data" DROP NOT NULL;
ALTER TABLE "VendorDocument" ADD COLUMN "storagePublicId" TEXT,
  ADD COLUMN "storageResourceType" TEXT,
  ADD COLUMN "storageDeliveryType" TEXT,
  ADD COLUMN "storageFormat" TEXT,
  ADD COLUMN "storageVersion" TEXT,
  ADD COLUMN "storageAssetId" TEXT;
CREATE INDEX "VendorDocument_storagePublicId_idx" ON "VendorDocument"("storagePublicId");

ALTER TABLE "CareerApplication" ADD COLUMN "resumeSize" INTEGER,
  ADD COLUMN "resumeStoragePublicId" TEXT,
  ADD COLUMN "resumeStorageResourceType" TEXT,
  ADD COLUMN "resumeStorageDeliveryType" TEXT,
  ADD COLUMN "resumeStorageFormat" TEXT,
  ADD COLUMN "resumeStorageVersion" TEXT,
  ADD COLUMN "resumeStorageAssetId" TEXT;
CREATE INDEX "CareerApplication_resumeStoragePublicId_idx" ON "CareerApplication"("resumeStoragePublicId");

ALTER TABLE "PartnerApplication" ADD COLUMN "submissionKey" TEXT,
  ADD COLUMN "submissionHash" TEXT,
  ADD COLUMN "resumeSize" INTEGER,
  ADD COLUMN "resumeSha256" TEXT,
  ADD COLUMN "resumeUploadTokenHash" TEXT,
  ADD COLUMN "resumeUploadExpiresAt" TIMESTAMP(3),
  ADD COLUMN "resumeStoragePublicId" TEXT,
  ADD COLUMN "resumeStorageResourceType" TEXT,
  ADD COLUMN "resumeStorageDeliveryType" TEXT,
  ADD COLUMN "resumeStorageFormat" TEXT,
  ADD COLUMN "resumeStorageVersion" TEXT,
  ADD COLUMN "resumeStorageAssetId" TEXT;
CREATE UNIQUE INDEX "PartnerApplication_submissionKey_key" ON "PartnerApplication"("submissionKey");
CREATE UNIQUE INDEX "PartnerApplication_resumeUploadTokenHash_key" ON "PartnerApplication"("resumeUploadTokenHash");
CREATE INDEX "PartnerApplication_resumeStoragePublicId_idx" ON "PartnerApplication"("resumeStoragePublicId");

-- Administrator MFA state. Secrets are encrypted by the application; recovery
-- codes are stored as one-way hashes.
ALTER TABLE "User" ADD COLUMN "adminMfaSecretEncrypted" TEXT;
ALTER TABLE "User" ADD COLUMN "adminMfaEnabledAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "adminMfaRecoveryCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
