import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import type { Prisma, VendorDocumentKind, VendorApplicationStatus } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { downloadPrivateFile, uploadPrivateFile } from "../../services/private-file-storage.js";
import type { VendorQuery, VendorRecord, VendorReview, VendorSubmission } from "./vendors.schema.js";

const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const tokenFor = (id: string, key: string) => createHmac("sha256", env.JWT_SECRET).update(`vendor-documents:${id}:${key}`).digest("hex");
const documentSelect = { id: true, kind: true, fileName: true, mimeType: true, size: true, createdAt: true } satisfies Prisma.VendorDocumentSelect;
const summarySelect = {
  id: true, companyName: true, organizationType: true, city: true, state: true, country: true,
  contactName: true, email: true, phone: true, serviceCategories: true, yearsExperience: true, teamSize: true,
  status: true, vendorCode: true, submittedAt: true, approvedAt: true, createdAt: true, updatedAt: true,
  accountManager: true, revision: true, documents: { select: documentSelect },
} satisfies Prisma.VendorApplicationSelect;
const detailSelect = { ...summarySelect,
  establishedYear: true, registrationNumber: true, gstNumber: true, msmeNumber: true, addressLine: true, postalCode: true,
  contactRole: true, alternatePhone: true, website: true, specializedServices: true, serviceDescription: true,
  coverage: true, industries: true, projectExperience: true, notableClients: true, capacityNotes: true,
  consentAt: true, reviewedAt: true, reviewNotes: true, internalNotes: true,
} satisfies Prisma.VendorApplicationSelect;
const receiptSelect = { id: true, submissionHash: true, submittedAt: true, uploadExpiresAt: true, documents: { select: documentSelect } } satisfies Prisma.VendorApplicationSelect;
type VendorReceiptRow = Prisma.VendorApplicationGetPayload<{ select: typeof receiptSelect }>;
const fail = (status: number, message: string, code: string): never => { throw new HttpError(status, message, { code }); };

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function startVendorApplication(input: VendorSubmission) {
  const { requestKey, consent: _consent, ...profile } = input;
  const id = randomUUID();
  const submissionHash = hash(JSON.stringify(profile));
  const create = { ...profile, id, submissionKey: requestKey, submissionHash, uploadTokenHash: hash(tokenFor(id, requestKey)), uploadExpiresAt: new Date(Date.now() + 60 * 60000) };

  // Prisma's client-side upsert can race on PostgreSQL when two identical public
  // retries arrive before either request observes the other's row. Let the
  // unique submission key arbitrate the race, then read the winning draft.
  let application: VendorReceiptRow | null;
  try {
    application = await prisma.vendorApplication.create({ data: create, select: receiptSelect });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    application = await prisma.vendorApplication.findUnique({ where: { submissionKey: requestKey }, select: receiptSelect });
    // A P2002 on another unique field must not be mistaken for an idempotent
    // retry. A submission-key conflict has a committed winner by this point.
    if (!application) throw error;
  }

  if (application.submissionHash !== submissionHash) fail(409, "These details were already saved with different information. Contact our team with your reference to amend them.", "VENDOR_SUBMISSION_CHANGED");
  return { id: application.id, submitted: Boolean(application.submittedAt), submittedAt: application.submittedAt, documents: application.documents,
    uploadToken: application.submittedAt ? null : tokenFor(application.id, requestKey), uploadExpiresAt: application.uploadExpiresAt };
}

function validateToken(value?: string) {
  if (!value || !/^[a-f0-9]{64}$/.test(value)) fail(403, "A valid application upload receipt is required", "VENDOR_RECEIPT_REQUIRED");
  return hash(value!);
}
async function lock(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT "id" FROM "VendorApplication" WHERE "id" = ${id} FOR UPDATE`;
}
async function receiptOwner(tx: Prisma.TransactionClient, id: string, tokenHash: string) {
  const application = await tx.vendorApplication.findFirst({ where: { id, uploadTokenHash: tokenHash, uploadExpiresAt: { gt: new Date() } } });
  if (!application) fail(403, "Your upload receipt is invalid or expired. Contact our team with your reference for assistance.", "VENDOR_RECEIPT_EXPIRED");
  return application!;
}
function validatePdf(body: unknown, type?: string, name?: string) {
  if (type?.split(";")[0].trim() !== "application/pdf") fail(415, "Upload a valid PDF document", "VENDOR_DOCUMENT_TYPE");
  if (!Buffer.isBuffer(body) || body.length === 0) fail(400, "Choose a non-empty PDF document", "VENDOR_DOCUMENT_EMPTY");
  const bytes = body as Buffer;
  if (bytes.length > 2 * 1024 * 1024) fail(413, "Each document must be 2 MB or smaller", "VENDOR_DOCUMENT_TOO_LARGE");
  if (type?.split(";")[0].trim() !== "application/pdf" || !/^%PDF-(?:1\.[0-9]|2\.0)/.test(bytes.subarray(0, 8).toString("ascii")) || !bytes.subarray(-1024).includes(Buffer.from("%%EOF"))) fail(415, "Upload a valid PDF document", "VENDOR_DOCUMENT_TYPE");
  let decoded = "vendor-document.pdf";
  try { decoded = decodeURIComponent(name || decoded); } catch { /* Keep the safe fallback. */ }
  const stem = decoded.replace(/\.pdf$/i, "").replace(/[\\/\r\n\u0000-\u001f\u007f"<>]/g, "_").slice(0, 150).trim() || "vendor-document";
  return { fileName: `${stem}.pdf`, mimeType: "application/pdf", size: bytes.length, buffer: bytes, sha256: hash(bytes) };
}
export async function uploadVendorDocument(id: string, kind: VendorDocumentKind, uploadToken: string | undefined, body: unknown, type?: string, name?: string) {
  const tokenHash = validateToken(uploadToken);
  const file = validatePdf(body, type, name);
  const preflight = await prisma.vendorApplication.findFirst({ where: { id, uploadTokenHash: tokenHash, uploadExpiresAt: { gt: new Date() } }, select: { status: true } });
  if (!preflight) fail(403, "Your upload receipt is invalid or expired. Contact our team with your reference for assistance.", "VENDOR_RECEIPT_EXPIRED");
  const existingBefore = await prisma.vendorDocument.findUnique({ where: { applicationId_kind: { applicationId: id, kind } }, select: { ...documentSelect, sha256: true } });
  if (existingBefore?.sha256 === file.sha256) { const { sha256: _sha256, ...document } = existingBefore; return { document }; }
  if (preflight!.status !== "DRAFT") fail(409, "This application is already submitted. Documents are locked for review.", "VENDOR_DOCUMENTS_LOCKED");
  if (existingBefore) fail(409, "A different document is already attached in this category. Contact our team to amend the application.", "VENDOR_DOCUMENT_EXISTS");
  const asset = await uploadPrivateFile({ scope: "vendor-documents", ownerId: `${id}-${kind}`, fileName: file.fileName, mimeType: file.mimeType, buffer: file.buffer, sha256: file.sha256 });
  return prisma.$transaction(async tx => {
    await lock(tx, id);
    const application = await receiptOwner(tx, id, tokenHash);
    const existing = await tx.vendorDocument.findUnique({ where: { applicationId_kind: { applicationId: id, kind } }, select: { ...documentSelect, sha256: true } });
    if (existing?.sha256 === file.sha256) { const { sha256: _sha256, ...document } = existing; return { document }; }
    if (application.status !== "DRAFT") fail(409, "This application is already submitted. Documents are locked for review.", "VENDOR_DOCUMENTS_LOCKED");
    if (existing) fail(409, "A different document is already attached in this category. Contact our team to amend the application.", "VENDOR_DOCUMENT_EXISTS");
    const document = await tx.vendorDocument.create({ data: {
      id: randomUUID(), applicationId: id, kind, fileName: file.fileName, mimeType: file.mimeType, size: file.size, sha256: file.sha256, data: null,
      storagePublicId: asset.publicId, storageResourceType: asset.resourceType, storageDeliveryType: asset.deliveryType,
      storageFormat: asset.format, storageVersion: asset.version, storageAssetId: asset.assetId,
    }, select: documentSelect });
    await tx.vendorApplication.update({ where: { id }, data: { revision: { increment: 1 } } });
    return { document };
  });
}
export async function submitVendorApplication(id: string, uploadToken?: string) {
  const tokenHash = validateToken(uploadToken);
  return prisma.$transaction(async tx => {
    await lock(tx, id);
    const application = await receiptOwner(tx, id, tokenHash);
    const summary = { companyName: application.companyName, contactName: application.contactName, email: application.email, serviceCategories: application.serviceCategories };
    if (application.submittedAt) return { id, submitted: true, submittedAt: application.submittedAt, created: false, ...summary };
    const profile = await tx.vendorDocument.findUnique({ where: { applicationId_kind: { applicationId: id, kind: "COMPANY_PROFILE" } }, select: { id: true } });
    if (!profile) fail(400, "Attach your company profile before submitting the application", "VENDOR_PROFILE_REQUIRED");
    const updated = await tx.vendorApplication.update({ where: { id }, data: { status: "SUBMITTED", submittedAt: new Date(), revision: { increment: 1 } } });
    await tx.auditLog.create({ data: { action: "vendor.submitted", entityType: "VendorApplication", entityId: id } });
    return { id, submitted: true, submittedAt: updated.submittedAt, created: true, ...summary };
  });
}
export async function listVendors(input: VendorQuery) {
  const where: Prisma.VendorApplicationWhereInput = {
    ...(input.view === "directory" ? { vendorCode: { not: null } } : {}),
    ...(input.status ? { status: input.status } : { status: { not: "DRAFT" } }),
    ...(input.category ? { serviceCategories: { has: input.category } } : {}),
    ...(input.query ? { OR: ["companyName", "email", "city", "vendorCode"].map(field => ({ [field]: { contains: input.query, mode: "insensitive" } })) } : {}),
  };
  const [items, total, counts] = await prisma.$transaction([
    prisma.vendorApplication.findMany({ where, select: summarySelect, take: 12, skip: (input.page - 1) * 12, orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }] }),
    prisma.vendorApplication.count({ where }),
    prisma.vendorApplication.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
  ]);
  return { items, total, page: input.page, totalPages: Math.max(1, Math.ceil(total / 12)), counts: Object.fromEntries(counts.map(item => [item.status, typeof item._count === "object" ? item._count._all ?? 0 : 0])) };
}
export async function getVendor(id: string) {
  const application = await prisma.vendorApplication.findUnique({ where: { id }, select: detailSelect });
  if (!application) fail(404, "Vendor application not found", "VENDOR_NOT_FOUND");
  const history = await prisma.auditLog.findMany({ where: { entityType: "VendorApplication", entityId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 30, select: { id: true, action: true, metadata: true, createdAt: true } });
  return { ...application!, history };
}
const transitions: Record<VendorApplicationStatus, VendorApplicationStatus[]> = {
  DRAFT: [], SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED"], UNDER_REVIEW: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  APPROVED: ["APPROVED", "SUSPENDED"], REJECTED: ["UNDER_REVIEW", "REJECTED"], SUSPENDED: ["APPROVED", "SUSPENDED"],
};
export async function reviewVendor(id: string, actorUserId: string, input: VendorReview) {
  await prisma.$transaction(async tx => {
    await lock(tx, id);
    const current = await tx.vendorApplication.findUnique({ where: { id }, include: { documents: { select: { kind: true } } } });
    if (!current) fail(404, "Vendor application not found", "VENDOR_NOT_FOUND");
    if (current!.revision !== input.expectedRevision) fail(409, "This vendor changed. Reload the latest record before saving.", "VENDOR_CHANGED");
    if (!transitions[current!.status].includes(input.status)) fail(409, "This decision is not available in the current status. Reopen a rejected application for review first.", "VENDOR_STATUS_TRANSITION");
    if (input.status === "APPROVED" && (!current!.submittedAt || !current!.documents.some(doc => doc.kind === "COMPANY_PROFILE"))) fail(409, "A submitted application and company profile are required before approval", "VENDOR_NOT_READY");
    const firstApproval = input.status === "APPROVED" && !current!.vendorCode;
    await tx.vendorApplication.update({ where: { id }, data: { status: input.status, reviewNotes: input.notes || null, reviewedAt: new Date(), reviewedByUserId: actorUserId,
      ...(firstApproval ? { vendorCode: `VND-${randomBytes(6).toString("hex").toUpperCase()}`, approvedAt: new Date() } : {}), revision: { increment: 1 } } });
    await tx.auditLog.create({ data: { actorUserId, action: "vendor.reviewed", entityType: "VendorApplication", entityId: id, metadata: { from: current!.status, to: input.status, notes: input.notes } } });
  });
  return { application: await getVendor(id) };
}
export async function updateVendorRecord(id: string, actorUserId: string, input: VendorRecord) {
  const { expectedRevision, ...data } = input;
  await prisma.$transaction(async tx => {
    await lock(tx, id);
    const current = await tx.vendorApplication.findUnique({ where: { id }, select: { vendorCode: true, revision: true } });
    if (!current) fail(404, "Vendor record not found", "VENDOR_NOT_FOUND");
    if (!current!.vendorCode) fail(409, "Approve the application before maintaining its vendor record", "VENDOR_APPROVAL_REQUIRED");
    if (current!.revision !== expectedRevision) fail(409, "This vendor changed. Reload before saving.", "VENDOR_CHANGED");
    await tx.vendorApplication.update({ where: { id }, data: { ...data, revision: { increment: 1 } } });
    await tx.auditLog.create({ data: { actorUserId, action: "vendor.record_updated", entityType: "VendorApplication", entityId: id, metadata: { fields: Object.keys(data) } } });
  });
  return { application: await getVendor(id) };
}
export async function downloadVendorDocument(id: string, documentId: string, actorUserId: string) {
  const document = await prisma.vendorDocument.findFirst({ where: { id: documentId, applicationId: id } });
  const foundDocument = document ?? fail(404, "Vendor document not found", "VENDOR_DOCUMENT_NOT_FOUND");
  const bytes = foundDocument.storagePublicId && foundDocument.storageResourceType === "raw" && foundDocument.storageDeliveryType === "authenticated" && foundDocument.storageFormat
    ? await downloadPrivateFile({ publicId: foundDocument.storagePublicId, resourceType: "raw", deliveryType: "authenticated", format: foundDocument.storageFormat }, foundDocument.fileName)
    : foundDocument.data
      ? Buffer.from(foundDocument.data)
      : fail(404, "Vendor document not found", "VENDOR_DOCUMENT_NOT_FOUND");
  await prisma.auditLog.create({ data: { actorUserId, action: "vendor.document_downloaded", entityType: "VendorApplication", entityId: id, metadata: { kind: foundDocument.kind, documentId } } });
  return { fileName: foundDocument.fileName, mimeType: foundDocument.mimeType, bytes };
}
