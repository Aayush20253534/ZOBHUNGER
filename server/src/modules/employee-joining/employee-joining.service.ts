import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import type { EmployeeJoiningDocumentKind, EmployeeJoiningStatus, EmployeeOfferStatus, Prisma } from "../../generated/prisma/client.js";
import { deletePrivateFile, downloadPrivateFile, uploadPrivateFile } from "../../services/private-file-storage.js";
import { missingResendSettings, postResendMessage } from "../../services/resend.client.js";
import { HttpError } from "../../utils/http-error.js";
import { decryptHrPii, encryptHrPii, maskSensitive } from "./hr-pii.js";
import { createEmployeeOfferPdf } from "./offer-letter-pdf.js";
import { requiredEmployeeDocumentKinds, type EmployeeJoiningQuery, type EmployeeJoiningReview, type EmployeeJoiningSubmission, type EmployeeOfferAction, type EmployeeOfferInput } from "./employee-joining.schema.js";

const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const tokenFor = (id: string, key: string) => createHmac("sha256", env.JWT_SECRET).update(`employee-joining:${id}:${key}`).digest("hex");
function fail(status: number, message: string, code: string): never {
  throw new HttpError(status, message, { code });
}
const dateAtUtc = (value: string) => new Date(`${value}T00:00:00.000Z`);

const documentSelect = { id: true, kind: true, fileName: true, mimeType: true, size: true, createdAt: true } satisfies Prisma.EmployeeJoiningDocumentSelect;
const offerSelect = {
  id: true, status: true, designation: true, department: true, projectAssignment: true, workLocation: true, joiningDate: true,
  employmentType: true, monthlyGrossSalary: true, annualCtc: true, probationMonths: true, noticePeriodDays: true, additionalTerms: true,
  authorizedSignatoryName: true, authorizedSignatoryTitle: true, signatureFileName: true, approvedAt: true, issuedAt: true, sentAt: true,
  resendMessageId: true, revision: true, createdAt: true, updatedAt: true,
} satisfies Prisma.EmployeeOfferLetterSelect;
const summarySelect = {
  id: true, employeeNumber: true, projectCode: true, projectAssignment: true, fullName: true, personalEmail: true, phone: true,
  currentCity: true, currentState: true, status: true, submittedAt: true, approvedAt: true, revision: true, createdAt: true, updatedAt: true,
  aadhaarLast4: true, panLast4: true, bankAccountLast4: true,
  documents: { select: documentSelect }, offer: { select: offerSelect },
} satisfies Prisma.EmployeeJoiningSelect;
const detailSelect = {
  ...summarySelect,
  fatherGuardianName: true, alternatePhone: true, dateOfBirth: true, gender: true, maritalStatus: true, bloodGroup: true, shirtSize: true,
  currentAddressLine1: true, currentAddressLine2: true, currentPostalCode: true, permanentSameAsCurrent: true,
  permanentAddressLine1: true, permanentAddressLine2: true, permanentCity: true, permanentState: true, permanentPostalCode: true,
  emergencyContactName: true, emergencyRelationship: true, emergencyPhone: true,
  aadhaarEncrypted: true, panEncrypted: true, bankAccountHolder: true, bankName: true, bankAccountEncrypted: true, ifscCode: true, bankBranch: true,
  upiId: true, uanEncrypted: true, highestQualification: true, institution: true, boardUniversity: true, graduationYear: true, grade: true,
  previousEmployment: true, consentAt: true, reviewNotes: true, reviewedAt: true,
} satisfies Prisma.EmployeeJoiningSelect;
const receiptSelect = {
  id: true, submissionHash: true, employeeNumber: true, submittedAt: true, uploadExpiresAt: true,
  documents: { select: documentSelect },
} satisfies Prisma.EmployeeJoiningSelect;

type ReceiptRow = Prisma.EmployeeJoiningGetPayload<{ select: typeof receiptSelect }>;

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function publicReceipt(application: ReceiptRow, requestKey: string) {
  return {
    id: application.id,
    employeeNumber: application.employeeNumber,
    submitted: Boolean(application.submittedAt),
    submittedAt: application.submittedAt,
    documents: application.documents,
    uploadToken: application.submittedAt ? null : tokenFor(application.id, requestKey),
    uploadExpiresAt: application.uploadExpiresAt,
  };
}

export async function startEmployeeJoining(input: EmployeeJoiningSubmission) {
  const { requestKey, consent: _consent, aadhaarNumber, panNumber, bankAccountNumber, uanNumber, dateOfBirth, alternatePhone, maritalStatus, bloodGroup, shirtSize, currentAddressLine2, permanentAddressLine2, boardUniversity, grade, upiId, ...profile } = input;
  const id = randomUUID();
  const submissionHash = hash(JSON.stringify(input));
  const create = {
    ...profile,
    id,
    submissionKey: requestKey,
    submissionHash,
    dateOfBirth: dateAtUtc(dateOfBirth),
    alternatePhone: alternatePhone || null,
    maritalStatus: maritalStatus || null,
    bloodGroup: bloodGroup || null,
    shirtSize: shirtSize || null,
    currentAddressLine2: currentAddressLine2 || null,
    permanentAddressLine2: permanentAddressLine2 || null,
    boardUniversity: boardUniversity || null,
    grade: grade || null,
    upiId: upiId || null,
    aadhaarEncrypted: encryptHrPii(aadhaarNumber),
    aadhaarLast4: aadhaarNumber.slice(-4),
    panEncrypted: encryptHrPii(panNumber),
    panLast4: panNumber.slice(-4),
    bankAccountEncrypted: encryptHrPii(bankAccountNumber),
    bankAccountLast4: bankAccountNumber.slice(-4),
    uanEncrypted: uanNumber ? encryptHrPii(uanNumber) : null,
    uploadTokenHash: hash(tokenFor(id, requestKey)),
    uploadExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  } satisfies Prisma.EmployeeJoiningUncheckedCreateInput;

  let application: ReceiptRow | null;
  try {
    application = await prisma.employeeJoining.create({ data: create, select: receiptSelect });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    application = await prisma.employeeJoining.findUnique({ where: { submissionKey: requestKey }, select: receiptSelect });
    if (!application) throw error;
  }
  if (application.submissionHash !== submissionHash) fail(409, "This joining request was already saved with different information. Ask HR for assistance before resubmitting.", "EMPLOYEE_JOINING_CHANGED");
  return publicReceipt(application, requestKey);
}

function validateToken(value?: string) {
  if (!value || !/^[a-f0-9]{64}$/.test(value)) fail(403, "A valid employee joining receipt is required", "EMPLOYEE_JOINING_RECEIPT_REQUIRED");
  return hash(value!);
}

async function lockJoining(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT "id" FROM "EmployeeJoining" WHERE "id" = ${id} FOR UPDATE`;
}

function sameHash(left: string, right: string) {
  if (left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

async function receiptOwner(tx: Prisma.TransactionClient, id: string, tokenHash: string) {
  const joining = await tx.employeeJoining.findUnique({ where: { id } });
  if (!joining) fail(403, "Your joining receipt is invalid or expired. Contact HR with your reference for assistance.", "EMPLOYEE_JOINING_RECEIPT_EXPIRED");
  const expectedHash = joining.uploadTokenHash ?? hash(tokenFor(joining.id, joining.submissionKey));
  const activeDraftReceipt = Boolean(joining.uploadExpiresAt && joining.uploadExpiresAt > new Date());
  if (!sameHash(tokenHash, expectedHash) || (!joining.submittedAt && !activeDraftReceipt)) fail(403, "Your joining receipt is invalid or expired. Contact HR with your reference for assistance.", "EMPLOYEE_JOINING_RECEIPT_EXPIRED");
  return joining;
}

function fileKind(type?: string) {
  return type?.split(";")[0]?.trim().toLowerCase() || "";
}

function validFile(body: unknown, type?: string, name?: string) {
  if (!Buffer.isBuffer(body) || body.length === 0) fail(400, "Choose a non-empty document", "EMPLOYEE_DOCUMENT_EMPTY");
  const bytes = body as Buffer;
  if (bytes.length > 5 * 1024 * 1024) fail(413, "Each employee document must be 5 MB or smaller", "EMPLOYEE_DOCUMENT_TOO_LARGE");
  const mimeType = fileKind(type);
  const pdf = mimeType === "application/pdf" && /^%PDF-(?:1\.[0-9]|2\.0)/.test(bytes.subarray(0, 8).toString("ascii")) && bytes.subarray(-2048).includes(Buffer.from("%%EOF"));
  const jpeg = mimeType === "image/jpeg" && bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = mimeType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (!pdf && !jpeg && !png) fail(415, "Upload a valid PDF, JPG or PNG document", "EMPLOYEE_DOCUMENT_TYPE");
  const ext = pdf ? "pdf" : jpeg ? "jpg" : "png";
  let decoded = `employee-document.${ext}`;
  try { decoded = decodeURIComponent(name || decoded); } catch { /* safe fallback */ }
  const stem = decoded.replace(/\.[a-zA-Z0-9]{1,8}$/i, "").replace(/[\\/\r\n\u0000-\u001f\u007f"<>]/g, "_").slice(0, 150).trim() || "employee-document";
  return { fileName: `${stem}.${ext}`, mimeType, size: bytes.length, buffer: bytes, sha256: hash(bytes) };
}

export async function uploadEmployeeJoiningDocument(id: string, kind: EmployeeJoiningDocumentKind, uploadToken: string | undefined, body: unknown, type?: string, name?: string) {
  const tokenHash = validateToken(uploadToken);
  const file = validFile(body, type, name);
  if (kind === "PHOTO" && !file.mimeType.startsWith("image/")) fail(415, "Employee photo must be a JPG or PNG image", "EMPLOYEE_PHOTO_TYPE");
  const preflight = await prisma.employeeJoining.findFirst({ where: { id, uploadTokenHash: tokenHash, uploadExpiresAt: { gt: new Date() } }, select: { status: true } });
  if (!preflight) fail(403, "Your joining receipt is invalid or expired. Contact HR with your reference for assistance.", "EMPLOYEE_JOINING_RECEIPT_EXPIRED");
  if (preflight.status !== "DRAFT") fail(409, "This employee joining form is already submitted. Documents are locked for HR review.", "EMPLOYEE_DOCUMENTS_LOCKED");
  const existing = await prisma.employeeJoiningDocument.findUnique({ where: { joiningId_kind: { joiningId: id, kind } } });
  if (existing?.sha256 === file.sha256) return { document: { id: existing.id, kind: existing.kind, fileName: existing.fileName, mimeType: existing.mimeType, size: existing.size, createdAt: existing.createdAt } };
  if (existing) fail(409, "A different document is already attached in this category. Restart the form or contact HR to amend it.", "EMPLOYEE_DOCUMENT_EXISTS");
  // A unique storage owner keeps concurrent uploads isolated. If the database
  // transaction loses a race, we can safely delete only this newly uploaded
  // asset without risking the document accepted by another request.
  const asset = await uploadPrivateFile({ scope: "employee-joining", ownerId: `${id}-${kind}-${randomUUID()}`, fileName: file.fileName, mimeType: file.mimeType, buffer: file.buffer, sha256: file.sha256 });
  try {
    return await prisma.$transaction(async tx => {
      await lockJoining(tx, id);
      const joining = await receiptOwner(tx, id, tokenHash);
      if (joining.status !== "DRAFT") fail(409, "This employee joining form is already submitted. Documents are locked for HR review.", "EMPLOYEE_DOCUMENTS_LOCKED");
      const document = await tx.employeeJoiningDocument.create({ data: {
        id: randomUUID(), joiningId: id, kind, fileName: file.fileName, mimeType: file.mimeType, size: file.size, sha256: file.sha256, data: null,
        storagePublicId: asset.publicId, storageResourceType: asset.resourceType, storageDeliveryType: asset.deliveryType,
        storageFormat: asset.format, storageVersion: asset.version, storageAssetId: asset.assetId,
      }, select: documentSelect });
      await tx.employeeJoining.update({ where: { id }, data: { revision: { increment: 1 } } });
      return { document };
    });
  } catch (error) {
    await deletePrivateFile(asset).catch(() => undefined);
    throw error;
  }
}

function employeeSequenceKey(projectCode: string, now = new Date()) {
  return `${projectCode}-${String(now.getUTCFullYear()).slice(-2)}`;
}

export async function submitEmployeeJoining(id: string, uploadToken?: string) {
  const tokenHash = validateToken(uploadToken);
  return prisma.$transaction(async tx => {
    await lockJoining(tx, id);
    const joining = await receiptOwner(tx, id, tokenHash);
    if (joining.submittedAt && joining.employeeNumber) return { id, employeeNumber: joining.employeeNumber, submitted: true, submittedAt: joining.submittedAt };
    const documents = await tx.employeeJoiningDocument.findMany({ where: { joiningId: id }, select: { kind: true } });
    const present = new Set(documents.map(document => document.kind));
    const missing = requiredEmployeeDocumentKinds.filter(kind => !present.has(kind));
    if (missing.length) fail(400, `Attach the required documents before submitting: ${missing.join(", ")}`, "EMPLOYEE_DOCUMENTS_REQUIRED");
    const key = employeeSequenceKey(joining.projectCode);
    const sequence = await tx.employeeNumberSequence.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
    const employeeNumber = `ZBH-${joining.projectCode}-${key.slice(-2)}-${String(sequence.value).padStart(4, "0")}`;
    const updated = await tx.employeeJoining.update({ where: { id }, data: {
      employeeNumber, status: "SUBMITTED", submittedAt: new Date(), uploadTokenHash: null, uploadExpiresAt: null, revision: { increment: 1 },
    } });
    await tx.auditLog.create({ data: { action: "employee_joining.submitted", entityType: "EmployeeJoining", entityId: id, metadata: { employeeNumber, projectCode: joining.projectCode, documents: [...present].sort() } } });
    return { id, employeeNumber, submitted: true, submittedAt: updated.submittedAt };
  });
}

export async function listEmployeeJoinings(input: EmployeeJoiningQuery) {
  const where: Prisma.EmployeeJoiningWhereInput = {
    status: input.status ? input.status : { not: "DRAFT" },
    ...(input.projectCode ? { projectCode: input.projectCode } : {}),
    ...(input.query ? { OR: [
      { fullName: { contains: input.query, mode: "insensitive" } },
      { personalEmail: { contains: input.query, mode: "insensitive" } },
      { phone: { contains: input.query, mode: "insensitive" } },
      { employeeNumber: { contains: input.query, mode: "insensitive" } },
      { projectAssignment: { contains: input.query, mode: "insensitive" } },
    ] } : {}),
  };
  const [items, total, counts] = await prisma.$transaction([
    prisma.employeeJoining.findMany({ where, select: summarySelect, take: 15, skip: (input.page - 1) * 15, orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }] }),
    prisma.employeeJoining.count({ where }),
    prisma.employeeJoining.groupBy({ by: ["status"], where: { status: { not: "DRAFT" } }, orderBy: { status: "asc" }, _count: { _all: true } }),
  ]);
  return { items: items.map(item => ({ ...item, aadhaar: maskSensitive(item.aadhaarLast4), pan: maskSensitive(item.panLast4), bankAccount: maskSensitive(item.bankAccountLast4) })), total, page: input.page, totalPages: Math.max(1, Math.ceil(total / 15)), counts: Object.fromEntries(counts.map(item => [item.status, typeof item._count === "object" ? item._count._all ?? 0 : 0])) };
}

export async function getEmployeeJoining(id: string, actorUserId?: string) {
  const record = await prisma.employeeJoining.findUnique({ where: { id }, select: detailSelect });
  if (!record) fail(404, "Employee joining record not found", "EMPLOYEE_JOINING_NOT_FOUND");
  const history = await prisma.auditLog.findMany({ where: { entityType: "EmployeeJoining", entityId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50, select: { id: true, action: true, metadata: true, createdAt: true } });
  const { aadhaarEncrypted, panEncrypted, bankAccountEncrypted, uanEncrypted, ...safe } = record;
  if (actorUserId) await prisma.auditLog.create({ data: { actorUserId, action: "employee_joining.sensitive_record_viewed", entityType: "EmployeeJoining", entityId: id } });
  return { ...safe, aadhaarNumber: decryptHrPii(aadhaarEncrypted), panNumber: decryptHrPii(panEncrypted), bankAccountNumber: decryptHrPii(bankAccountEncrypted), uanNumber: decryptHrPii(uanEncrypted), history };
}

const reviewTransitions: Record<Exclude<EmployeeJoiningStatus, "DRAFT">, EmployeeJoiningStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  APPROVED: ["APPROVED"],
  REJECTED: ["UNDER_REVIEW", "REJECTED"],
};

export async function reviewEmployeeJoining(id: string, actorUserId: string, input: EmployeeJoiningReview) {
  await prisma.$transaction(async tx => {
    await lockJoining(tx, id);
    const current = await tx.employeeJoining.findUnique({ where: { id }, select: { status: true, revision: true, submittedAt: true } });
    if (!current || current.status === "DRAFT" || !current.submittedAt) fail(404, "Submitted employee joining record not found", "EMPLOYEE_JOINING_NOT_FOUND");
    if (current.revision !== input.expectedRevision) fail(409, "This joining record changed. Refresh before saving the HR review.", "EMPLOYEE_JOINING_CHANGED");
    if (!reviewTransitions[current.status as Exclude<EmployeeJoiningStatus, "DRAFT">].includes(input.status)) fail(409, "This HR decision is not available from the current status", "EMPLOYEE_JOINING_STATUS_TRANSITION");
    await tx.employeeJoining.update({ where: { id }, data: {
      status: input.status, reviewNotes: input.notes || null, reviewedAt: new Date(), reviewedByUserId: actorUserId,
      ...(input.status === "APPROVED" ? { approvedAt: new Date() } : {}), revision: { increment: 1 },
    } });
    await tx.auditLog.create({ data: { actorUserId, action: "employee_joining.reviewed", entityType: "EmployeeJoining", entityId: id, metadata: { from: current.status, to: input.status, notes: input.notes } } });
  });
  return { joining: await getEmployeeJoining(id) };
}

export async function downloadEmployeeDocument(id: string, documentId: string, actorUserId: string) {
  const document = await prisma.employeeJoiningDocument.findFirst({ where: { id: documentId, joiningId: id } });
  if (!document) fail(404, "Employee document not found", "EMPLOYEE_DOCUMENT_NOT_FOUND");
  const bytes = document.storagePublicId && document.storageResourceType === "raw" && document.storageDeliveryType === "authenticated" && document.storageFormat
    ? await downloadPrivateFile({ publicId: document.storagePublicId, resourceType: "raw", deliveryType: "authenticated", format: document.storageFormat }, document.fileName)
    : document.data ? Buffer.from(document.data) : fail(404, "Employee document not found", "EMPLOYEE_DOCUMENT_NOT_FOUND");
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_joining.document_downloaded", entityType: "EmployeeJoining", entityId: id, metadata: { documentId, kind: document.kind } } });
  return { fileName: document.fileName, mimeType: document.mimeType, bytes };
}

function csvCell(value: unknown) {
  let text = value == null ? "" : value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function exportEmployeeJoiningsCsv(actorUserId: string) {
  const records = await prisma.employeeJoining.findMany({ where: { status: { not: "DRAFT" } }, include: { offer: true }, orderBy: [{ submittedAt: "desc" }, { id: "desc" }], take: 5000 });
  const headers = ["Employee Number","Status","Project Code","Project / Assignment","Full Name","Father / Guardian","Personal Email","Phone","Alternate Phone","Date of Birth","Gender","Marital Status","Blood Group","Shirt Size","Current Address","Permanent Address","Emergency Contact","Emergency Relationship","Emergency Phone","Aadhaar","PAN","Bank Account Holder","Bank Name","Bank Account Number","IFSC","Bank Branch","UPI","UAN","Highest Qualification","Institution","Board / University","Graduation Year","Grade","Previous Employment","Offer Status","Designation","Department","Work Location","Joining Date","Employment Type","Monthly Gross Salary","Annual CTC","Submitted At","Approved At"];
  const rows = records.map(record => [
    record.employeeNumber, record.status, record.projectCode, record.projectAssignment, record.fullName, record.fatherGuardianName, record.personalEmail, record.phone, record.alternatePhone,
    record.dateOfBirth.toISOString().slice(0,10), record.gender, record.maritalStatus, record.bloodGroup, record.shirtSize,
    [record.currentAddressLine1, record.currentAddressLine2, record.currentCity, record.currentState, record.currentPostalCode].filter(Boolean).join(", "),
    [record.permanentAddressLine1, record.permanentAddressLine2, record.permanentCity, record.permanentState, record.permanentPostalCode].filter(Boolean).join(", "),
    record.emergencyContactName, record.emergencyRelationship, record.emergencyPhone, decryptHrPii(record.aadhaarEncrypted), decryptHrPii(record.panEncrypted), record.bankAccountHolder, record.bankName,
    decryptHrPii(record.bankAccountEncrypted), record.ifscCode, record.bankBranch, record.upiId, decryptHrPii(record.uanEncrypted), record.highestQualification, record.institution, record.boardUniversity,
    record.graduationYear, record.grade, record.previousEmployment, record.offer?.status, record.offer?.designation, record.offer?.department, record.offer?.workLocation,
    record.offer?.joiningDate?.toISOString().slice(0,10), record.offer?.employmentType, record.offer?.monthlyGrossSalary, record.offer?.annualCtc, record.submittedAt, record.approvedAt,
  ]);
  const csv = "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_joining.exported", entityType: "EmployeeJoining", entityId: "export", metadata: { rows: records.length, format: "csv" } } });
  return Buffer.from(csv, "utf8");
}

async function getOfferRow(id: string) {
  const joining = await prisma.employeeJoining.findUnique({ where: { id }, include: { offer: true } });
  if (!joining) fail(404, "Employee joining record not found", "EMPLOYEE_JOINING_NOT_FOUND");
  if (!joining.offer) fail(404, "Offer letter draft not found", "EMPLOYEE_OFFER_NOT_FOUND");
  return { joining, offer: joining.offer };
}

export async function saveEmployeeOffer(id: string, actorUserId: string, input: EmployeeOfferInput) {
  const joining = await prisma.employeeJoining.findUnique({ where: { id }, select: { status: true, employeeNumber: true, projectAssignment: true } });
  if (!joining || joining.status !== "APPROVED" || !joining.employeeNumber) fail(409, "Approve the employee joining record before preparing an offer letter", "EMPLOYEE_APPROVAL_REQUIRED");
  const existing = await prisma.employeeOfferLetter.findUnique({ where: { joiningId: id } });
  if (existing?.status === "ISSUED" || existing?.status === "ISSUING") fail(409, "An issued offer letter is locked", "EMPLOYEE_OFFER_LOCKED");
  if ((existing?.revision ?? 0) !== input.expectedRevision) fail(409, "This offer letter changed. Refresh before saving.", "EMPLOYEE_OFFER_CHANGED");
  const { expectedRevision: _expectedRevision, joiningDate, ...fields } = input;
  const previousSignature = existing?.signatureStoragePublicId && existing.signatureStorageResourceType === "raw" && existing.signatureStorageDeliveryType === "authenticated"
    ? { publicId: existing.signatureStoragePublicId, resourceType: "raw" as const, deliveryType: "authenticated" as const }
    : null;
  const data = {
    ...fields,
    joiningDate: dateAtUtc(joiningDate),
    status: "DRAFT" as EmployeeOfferStatus,
    approvedAt: null,
    approvedByUserId: null,
    signatureFileName: null,
    signatureMimeType: null,
    signatureSize: null,
    signatureSha256: null,
    signatureStoragePublicId: null,
    signatureStorageResourceType: null,
    signatureStorageDeliveryType: null,
    signatureStorageFormat: null,
    signatureStorageVersion: null,
    signatureStorageAssetId: null,
  };
  const offer = existing
    ? await prisma.employeeOfferLetter.update({ where: { id: existing.id }, data: { ...data, revision: { increment: 1 } }, select: offerSelect })
    : await prisma.employeeOfferLetter.create({ data: { joiningId: id, ...data }, select: offerSelect });
  if (previousSignature) void deletePrivateFile(previousSignature).catch(() => undefined);
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_offer.draft_saved", entityType: "EmployeeJoining", entityId: id, metadata: { designation: input.designation, projectAssignment: input.projectAssignment } } });
  return { offer };
}

function validateSignature(body: unknown, type?: string, name?: string) {
  if (!Buffer.isBuffer(body) || body.length === 0) fail(400, "Choose a non-empty signature image", "EMPLOYEE_SIGNATURE_EMPTY");
  const bytes = body as Buffer;
  if (bytes.length > 1024 * 1024) fail(413, "Signature image must be 1 MB or smaller", "EMPLOYEE_SIGNATURE_TOO_LARGE");
  const mimeType = fileKind(type);
  if (mimeType !== "image/jpeg" || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) fail(415, "Upload a valid JPG signature image", "EMPLOYEE_SIGNATURE_TYPE");
  let decoded = "authorized-signature.jpg";
  try { decoded = decodeURIComponent(name || decoded); } catch { /* safe fallback */ }
  const stem = decoded.replace(/\.[a-zA-Z0-9]{1,8}$/i, "").replace(/[\\/\r\n\u0000-\u001f\u007f"<>]/g, "_").slice(0, 120).trim() || "authorized-signature";
  return { fileName: `${stem}.jpg`, mimeType, size: bytes.length, buffer: bytes, sha256: hash(bytes) };
}

export async function uploadEmployeeOfferSignature(id: string, actorUserId: string, body: unknown, type?: string, name?: string) {
  const file = validateSignature(body, type, name);
  const existing = await prisma.employeeOfferLetter.findUnique({ where: { joiningId: id } });
  if (!existing) fail(404, "Save the offer letter draft before adding a signature", "EMPLOYEE_OFFER_NOT_FOUND");
  if (existing.status !== "APPROVED") fail(409, "Approve the offer letter before adding the authorized signature", "EMPLOYEE_OFFER_APPROVAL_REQUIRED");
  const asset = await uploadPrivateFile({ scope: "employee-offer-signatures", ownerId: `${id}-${randomUUID()}`, fileName: file.fileName, mimeType: file.mimeType, buffer: file.buffer, sha256: file.sha256 });
  const previous = existing.signatureStoragePublicId && existing.signatureStorageResourceType === "raw" && existing.signatureStorageDeliveryType === "authenticated"
    ? { publicId: existing.signatureStoragePublicId, resourceType: "raw" as const, deliveryType: "authenticated" as const } : null;
  let offer;
  try {
    offer = await prisma.employeeOfferLetter.update({ where: { id: existing.id }, data: {
      signatureFileName: file.fileName, signatureMimeType: file.mimeType, signatureSize: file.size, signatureSha256: file.sha256,
      signatureStoragePublicId: asset.publicId, signatureStorageResourceType: asset.resourceType, signatureStorageDeliveryType: asset.deliveryType,
      signatureStorageFormat: asset.format, signatureStorageVersion: asset.version, signatureStorageAssetId: asset.assetId,
      revision: { increment: 1 },
    }, select: offerSelect });
  } catch (error) {
    await deletePrivateFile(asset).catch(() => undefined);
    throw error;
  }
  if (previous && previous.publicId !== asset.publicId) void deletePrivateFile(previous).catch(() => undefined);
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_offer.signature_uploaded", entityType: "EmployeeJoining", entityId: id } });
  return { offer };
}

export async function approveEmployeeOffer(id: string, actorUserId: string, input: EmployeeOfferAction) {
  const offer = await prisma.employeeOfferLetter.findUnique({ where: { joiningId: id } });
  if (!offer) fail(404, "Offer letter draft not found", "EMPLOYEE_OFFER_NOT_FOUND");
  if (offer.status !== "DRAFT") fail(409, "Only a draft offer can be approved", "EMPLOYEE_OFFER_STATUS");
  if (offer.revision !== input.expectedRevision) fail(409, "This offer letter changed. Refresh before approval.", "EMPLOYEE_OFFER_CHANGED");
  const updated = await prisma.employeeOfferLetter.update({ where: { id: offer.id }, data: { status: "APPROVED", approvedAt: new Date(), approvedByUserId: actorUserId, revision: { increment: 1 } }, select: offerSelect });
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_offer.approved", entityType: "EmployeeJoining", entityId: id } });
  return { offer: updated };
}

async function signatureBytes(offer: { signatureStoragePublicId: string | null; signatureStorageResourceType: string | null; signatureStorageDeliveryType: string | null; signatureStorageFormat: string | null; signatureFileName: string | null }) {
  if (!offer.signatureStoragePublicId || offer.signatureStorageResourceType !== "raw" || offer.signatureStorageDeliveryType !== "authenticated" || !offer.signatureStorageFormat || !offer.signatureFileName) return undefined;
  return downloadPrivateFile({ publicId: offer.signatureStoragePublicId, resourceType: "raw", deliveryType: "authenticated", format: offer.signatureStorageFormat }, offer.signatureFileName);
}

export async function getEmployeeOfferPdf(id: string, actorUserId: string) {
  const { joining, offer } = await getOfferRow(id);
  const signature = await signatureBytes(offer);
  const bytes = createEmployeeOfferPdf(joining, offer, signature);
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_offer.downloaded", entityType: "EmployeeJoining", entityId: id, metadata: { status: offer.status } } });
  return { fileName: `${joining.employeeNumber || "employee"}-offer-letter.pdf`, bytes };
}

export async function issueEmployeeOffer(id: string, actorUserId: string, input: EmployeeOfferAction) {
  const offer = await prisma.employeeOfferLetter.findUnique({ where: { joiningId: id } });
  if (!offer) fail(404, "Offer letter draft not found", "EMPLOYEE_OFFER_NOT_FOUND");
  if (offer.status !== "APPROVED") fail(409, "Approve the offer letter before issuing it", "EMPLOYEE_OFFER_APPROVAL_REQUIRED");
  if (!offer.signatureStoragePublicId || !offer.signatureFileName) fail(409, "Add the authorized signature before issuing the offer letter", "EMPLOYEE_SIGNATURE_REQUIRED");
  if (offer.revision !== input.expectedRevision) fail(409, "This offer letter changed. Refresh before issuing it.", "EMPLOYEE_OFFER_CHANGED");
  const missing = missingResendSettings();
  if (missing.length) fail(503, "Email delivery is not configured. Configure Resend before issuing offer letters.", "EMAIL_NOT_CONFIGURED");
  // ISSUING is an internal transient lock and does not change the client-visible
  // revision. A failed provider call can therefore return to APPROVED without
  // forcing HR to refresh before retrying.
  const claimed = await prisma.employeeOfferLetter.updateMany({ where: { id: offer.id, status: "APPROVED", revision: input.expectedRevision }, data: { status: "ISSUING" } });
  if (claimed.count !== 1) fail(409, "This offer letter is already being processed. Refresh before trying again.", "EMPLOYEE_OFFER_CHANGED");
  try {
    const { joining, offer: issuing } = await getOfferRow(id);
    const signature = await signatureBytes(issuing);
    const issuedAt = new Date();
    const pdf = createEmployeeOfferPdf(joining, { ...issuing, status: "ISSUED", issuedAt }, signature);
    const delivery = await postResendMessage({
      to: [joining.personalEmail],
      subject: `Offer letter - ${joining.employeeNumber} - ZOBHUNGER`,
      text: `Dear ${joining.fullName},\n\nYour approved offer letter from Zobhungr Solutions Private Limited is attached. Employee ID: ${joining.employeeNumber}.\n\nRegards,\nZOBHUNGER HR`,
      html: `<p>Dear ${escapeHtml(joining.fullName)},</p><p>Your approved offer letter from <strong>Zobhungr Solutions Private Limited</strong> is attached.</p><p>Employee ID: <strong>${escapeHtml(joining.employeeNumber || "")}</strong></p><p>Regards,<br>ZOBHUNGER HR</p>`,
      attachments: [{ filename: `${joining.employeeNumber}-offer-letter.pdf`, content: pdf.toString("base64") }],
      idempotencyKey: `employee-offer-${offer.id}-r${input.expectedRevision}`,
    });
    const updated = await prisma.employeeOfferLetter.update({ where: { id: offer.id }, data: {
      status: "ISSUED", issuedAt, issuedByUserId: actorUserId, sentAt: issuedAt, resendMessageId: delivery.id, revision: { increment: 1 },
    }, select: offerSelect });
    await prisma.auditLog.create({ data: { actorUserId, action: "employee_offer.issued", entityType: "EmployeeJoining", entityId: id, metadata: { messageId: delivery.id } } });
    return { offer: updated, delivered: true };
  } catch (error) {
    await prisma.employeeOfferLetter.updateMany({ where: { id: offer.id, status: "ISSUING", revision: input.expectedRevision }, data: { status: "APPROVED" } }).catch(() => undefined);
    throw error;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));
}
