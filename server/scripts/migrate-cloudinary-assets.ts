import { createHash } from "node:crypto";
import { prisma } from "../src/config/db.js";
import { privateFileStorageConfigured, uploadPrivateFile } from "../src/services/private-file-storage.js";

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const batchSize = 50;

function metadata(asset: Awaited<ReturnType<typeof uploadPrivateFile>>) {
  return {
    storagePublicId: asset.publicId,
    storageResourceType: asset.resourceType,
    storageDeliveryType: asset.deliveryType,
    storageFormat: asset.format,
    storageVersion: asset.version,
    storageAssetId: asset.assetId,
    data: null,
  };
}
function resumeMetadata(asset: Awaited<ReturnType<typeof uploadPrivateFile>>) {
  return {
    resumeStoragePublicId: asset.publicId,
    resumeStorageResourceType: asset.resourceType,
    resumeStorageDeliveryType: asset.deliveryType,
    resumeStorageFormat: asset.format,
    resumeStorageVersion: asset.version,
    resumeStorageAssetId: asset.assetId,
    resumeData: null,
  };
}

async function migrateWorkerResumes() {
  let count = 0;
  while (true) {
    const rows = await prisma.workerResume.findMany({ where: { storagePublicId: null, data: { not: null } }, take: batchSize });
    if (!rows.length) break;
    for (const row of rows) {
      const bytes = Buffer.from(row.data!);
      const asset = await uploadPrivateFile({ scope: "worker-resumes", ownerId: row.profileId, fileName: row.fileName, mimeType: row.mimeType, buffer: bytes, sha256: row.sha256 || hash(bytes) });
      await prisma.workerResume.update({ where: { id: row.id }, data: metadata(asset) }); count++;
    }
  }
  return count;
}
async function migrateApplicationResumes() {
  let count = 0;
  while (true) {
    const rows = await prisma.jobApplicationResume.findMany({ where: { storagePublicId: null, data: { not: null } }, take: batchSize });
    if (!rows.length) break;
    for (const row of rows) {
      const bytes = Buffer.from(row.data!);
      const asset = await uploadPrivateFile({ scope: "application-resumes", ownerId: row.applicationId, fileName: row.fileName, mimeType: row.mimeType, buffer: bytes, sha256: row.sha256 || hash(bytes) });
      await prisma.jobApplicationResume.update({ where: { id: row.id }, data: metadata(asset) }); count++;
    }
  }
  return count;
}
async function migrateCareerResumes() {
  let count = 0;
  while (true) {
    const rows = await prisma.careerApplication.findMany({ where: { resumeStoragePublicId: null, resumeData: { not: null } }, take: batchSize, select: { id: true, resumeData: true, resumeFileName: true, resumeMimeType: true, resumeSha256: true } });
    if (!rows.length) break;
    for (const row of rows) {
      const bytes = Buffer.from(row.resumeData!); const sha = row.resumeSha256 || hash(bytes);
      const asset = await uploadPrivateFile({ scope: "career-resumes", ownerId: row.id, fileName: row.resumeFileName || "resume.pdf", mimeType: row.resumeMimeType || "application/pdf", buffer: bytes, sha256: sha });
      await prisma.careerApplication.update({ where: { id: row.id }, data: { ...resumeMetadata(asset), resumeSha256: sha, resumeSize: bytes.length } }); count++;
    }
  }
  return count;
}
async function migratePartnerResumesAndTokens() {
  let count = 0;
  while (true) {
    const rows = await prisma.partnerApplication.findMany({ where: { resumeStoragePublicId: null, resumeData: { not: null } }, take: batchSize, select: { id: true, resumeData: true, resumeFileName: true, resumeMimeType: true, resumeSha256: true } });
    if (!rows.length) break;
    for (const row of rows) {
      const bytes = Buffer.from(row.resumeData!); const sha = row.resumeSha256 || hash(bytes);
      const asset = await uploadPrivateFile({ scope: "partner-resumes", ownerId: row.id, fileName: row.resumeFileName || "resume.pdf", mimeType: row.resumeMimeType || "application/pdf", buffer: bytes, sha256: sha });
      await prisma.partnerApplication.update({ where: { id: row.id }, data: { ...resumeMetadata(asset), resumeSha256: sha, resumeSize: bytes.length } }); count++;
    }
  }
  const legacy = await prisma.partnerApplication.findMany({ where: { resumeUploadToken: { not: null }, resumeUploadTokenHash: null }, select: { id: true, resumeUploadToken: true } });
  for (const row of legacy) {
    await prisma.partnerApplication.update({ where: { id: row.id }, data: { resumeUploadTokenHash: createHash("sha256").update(row.resumeUploadToken!).digest("hex"), resumeUploadExpiresAt: new Date(Date.now() + 60 * 60_000), resumeUploadToken: null } });
  }
  return { files: count, legacyTokens: legacy.length };
}
async function migrateVendorDocuments() {
  let count = 0;
  while (true) {
    const rows = await prisma.vendorDocument.findMany({ where: { storagePublicId: null, data: { not: null } }, take: batchSize });
    if (!rows.length) break;
    for (const row of rows) {
      const bytes = Buffer.from(row.data!);
      const asset = await uploadPrivateFile({ scope: "vendor-documents", ownerId: `${row.applicationId}-${row.kind}`, fileName: row.fileName, mimeType: row.mimeType, buffer: bytes, sha256: row.sha256 || hash(bytes) });
      await prisma.vendorDocument.update({ where: { id: row.id }, data: metadata(asset) }); count++;
    }
  }
  return count;
}

if (!privateFileStorageConfigured()) throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET before migrating files.");
const results = {
  workerResumes: await migrateWorkerResumes(),
  applicationResumes: await migrateApplicationResumes(),
  careerResumes: await migrateCareerResumes(),
  partner: await migratePartnerResumesAndTokens(),
  vendorDocuments: await migrateVendorDocuments(),
};
console.log(JSON.stringify({ success: true, migrated: results }, null, 2));
await prisma.$disconnect();
