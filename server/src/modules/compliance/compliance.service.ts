import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { ComplianceArea, ComplianceDocumentKind, ComplianceStatus, type Prisma } from "../../generated/prisma/client.js";
import { deletePrivateFile, downloadPrivateFile, uploadPrivateFile } from "../../services/private-file-storage.js";
import { HttpError } from "../../utils/http-error.js";
import { createXlsx } from "../../utils/xlsx.js";
import { decryptHrPii, encryptHrPii, maskSensitive } from "../employee-joining/hr-pii.js";
import type { ComplianceAccessInput, ComplianceListQuery, ComplianceReviewInput, EsicComplianceAdminUpdateInput, EsicComplianceDraftInput, PfComplianceAdminUpdateInput, PfComplianceDraftInput } from "./compliance.schema.js";

const ACCESS_TTL_MS = 30 * 60 * 1000;
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const dateAtUtc = (value: string) => new Date(`${value}T00:00:00.000Z`);
const dateOnly = (value: Date | null | undefined) => value ? value.toISOString().slice(0, 10) : "";
const cleanDigits = (value: string) => value.replace(/\D/g, "");

function fail(status: number, message: string, code: string): never {
  throw new HttpError(status, message, { code });
}

function accessSignature(joiningId: string, expiresAt: number) {
  return createHmac("sha256", env.JWT_SECRET).update(`employee-compliance:v1:${joiningId}:${expiresAt}`).digest("hex");
}

function issueAccessToken(joiningId: string) {
  const expiresAt = Date.now() + ACCESS_TTL_MS;
  return { token: `${joiningId}.${expiresAt}.${accessSignature(joiningId, expiresAt)}`, expiresAt: new Date(expiresAt) };
}

function parseAccessToken(value?: string) {
  if (!value) fail(401, "Employee compliance access is required", "COMPLIANCE_ACCESS_REQUIRED");
  const parts = value.split(".");
  if (parts.length !== 3) fail(401, "This employee compliance session is invalid or expired", "COMPLIANCE_ACCESS_EXPIRED");
  const [joiningId, expiresRaw, signature] = parts;
  const expiresAt = Number(expiresRaw);
  if (!joiningId || !Number.isSafeInteger(expiresAt) || !signature || !/^[a-f0-9]{64}$/.test(signature) || expiresAt <= Date.now()) {
    fail(401, "This employee compliance session is invalid or expired", "COMPLIANCE_ACCESS_EXPIRED");
  }
  const expected = accessSignature(joiningId, expiresAt);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    fail(401, "This employee compliance session is invalid or expired", "COMPLIANCE_ACCESS_EXPIRED");
  }
  return joiningId;
}

const joiningSelect = {
  id: true,
  employeeNumber: true,
  projectCode: true,
  projectAssignment: true,
  fullName: true,
  fatherGuardianName: true,
  personalEmail: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  maritalStatus: true,
  currentAddressLine1: true,
  currentAddressLine2: true,
  currentCity: true,
  currentState: true,
  currentPostalCode: true,
  permanentAddressLine1: true,
  permanentAddressLine2: true,
  permanentCity: true,
  permanentState: true,
  permanentPostalCode: true,
  aadhaarEncrypted: true,
  aadhaarLast4: true,
  panEncrypted: true,
  panLast4: true,
  bankAccountHolder: true,
  bankName: true,
  bankAccountEncrypted: true,
  bankAccountLast4: true,
  ifscCode: true,
  bankBranch: true,
  uanEncrypted: true,
  status: true,
  offer: { select: { department: true, designation: true, joiningDate: true, monthlyGrossSalary: true } },
  documents: { select: { id: true, kind: true, fileName: true, mimeType: true, size: true }, orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.EmployeeJoiningSelect;

type JoiningRow = Prisma.EmployeeJoiningGetPayload<{ select: typeof joiningSelect }>;

async function employeeJoiningForToken(token?: string) {
  const id = parseAccessToken(token);
  const joining = await prisma.employeeJoining.findUnique({ where: { id }, select: joiningSelect });
  if (!joining || !joining.employeeNumber || joining.status === "REJECTED") fail(401, "Employee compliance access is unavailable for this record", "COMPLIANCE_RECORD_UNAVAILABLE");
  return joining;
}

function masterProfile(joining: JoiningRow) {
  return {
    id: joining.id,
    employeeNumber: joining.employeeNumber,
    projectCode: joining.projectCode,
    projectAssignment: joining.projectAssignment,
    fullName: joining.fullName,
    fatherGuardianName: joining.fatherGuardianName,
    personalEmail: joining.personalEmail,
    phone: joining.phone,
    dateOfBirth: dateOnly(joining.dateOfBirth),
    gender: joining.gender,
    maritalStatus: joining.maritalStatus || "",
    currentAddress: {
      line1: joining.currentAddressLine1,
      line2: joining.currentAddressLine2 || "",
      city: joining.currentCity,
      state: joining.currentState,
      postalCode: joining.currentPostalCode,
    },
    permanentAddress: {
      line1: joining.permanentAddressLine1,
      line2: joining.permanentAddressLine2 || "",
      city: joining.permanentCity,
      state: joining.permanentState,
      postalCode: joining.permanentPostalCode,
    },
    aadhaarNumber: decryptHrPii(joining.aadhaarEncrypted),
    panNumber: decryptHrPii(joining.panEncrypted),
    bankAccountHolder: joining.bankAccountHolder,
    bankName: joining.bankName,
    bankAccountNumber: decryptHrPii(joining.bankAccountEncrypted),
    ifscCode: joining.ifscCode,
    bankBranch: joining.bankBranch,
    uanNumber: decryptHrPii(joining.uanEncrypted),
    offer: joining.offer ? {
      department: joining.offer.department,
      designation: joining.offer.designation,
      joiningDate: dateOnly(joining.offer.joiningDate),
      monthlyGrossSalary: joining.offer.monthlyGrossSalary,
    } : null,
    joiningDocuments: joining.documents,
  };
}


function adminMasterProfile(joining: JoiningRow, area: ComplianceArea) {
  const common = {
    id: joining.id,
    employeeNumber: joining.employeeNumber,
    projectCode: joining.projectCode,
    projectAssignment: joining.projectAssignment,
    fullName: joining.fullName,
    fatherGuardianName: joining.fatherGuardianName,
    personalEmail: joining.personalEmail,
    phone: joining.phone,
    dateOfBirth: dateOnly(joining.dateOfBirth),
    gender: joining.gender,
    maritalStatus: joining.maritalStatus || "",
    currentAddress: {
      line1: joining.currentAddressLine1,
      line2: joining.currentAddressLine2 || "",
      city: joining.currentCity,
      state: joining.currentState,
      postalCode: joining.currentPostalCode,
    },
    permanentAddress: {
      line1: joining.permanentAddressLine1,
      line2: joining.permanentAddressLine2 || "",
      city: joining.permanentCity,
      state: joining.permanentState,
      postalCode: joining.permanentPostalCode,
    },
    aadhaarNumber: decryptHrPii(joining.aadhaarEncrypted),
    employeePhotoAvailable: joining.documents.some(document => document.kind === "PHOTO"),
    offer: joining.offer ? {
      department: joining.offer.department,
      designation: joining.offer.designation,
      joiningDate: dateOnly(joining.offer.joiningDate),
      monthlyGrossSalary: joining.offer.monthlyGrossSalary,
    } : null,
  };
  if (area === ComplianceArea.PF_EPFO) {
    return {
      ...common,
      panNumber: decryptHrPii(joining.panEncrypted),
      bankAccountHolder: joining.bankAccountHolder,
      bankName: joining.bankName,
      bankAccountNumber: decryptHrPii(joining.bankAccountEncrypted),
      ifscCode: joining.ifscCode,
      bankBranch: joining.bankBranch,
      uanNumber: decryptHrPii(joining.uanEncrypted),
    };
  }
  return common;
}

async function complianceHistory(entityType: "EmployeePfCompliance" | "EmployeeEsicCompliance", entityId?: string | null) {
  if (!entityId) return [];
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    select: {
      id: true,
      action: true,
      metadata: true,
      createdAt: true,
      actor: { select: { email: true, adminDepartment: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

function publicPf(record: Prisma.EmployeePfComplianceGetPayload<Record<string, never>> | null) {
  if (!record) return null;
  return {
    ...record,
    appointmentDate: dateOnly(record.appointmentDate),
    existingUanNumber: decryptHrPii(record.existingUanEncrypted),
    existingUanEncrypted: undefined,
  };
}

function publicEsic(record: (Prisma.EmployeeEsicComplianceGetPayload<{ include: { familyMembers: true } }> | null)) {
  if (!record) return null;
  return {
    ...record,
    esiNumber: decryptHrPii(record.esiNumberEncrypted),
    esiNumberEncrypted: undefined,
    familyMembers: record.familyMembers.map(member => ({
      ...member,
      dateOfBirth: dateOnly(member.dateOfBirth),
      aadhaarNumber: decryptHrPii(member.aadhaarEncrypted),
      aadhaarEncrypted: undefined,
    })),
  };
}

export async function createComplianceAccess(input: ComplianceAccessInput) {
  const joining = await prisma.employeeJoining.findUnique({ where: { employeeNumber: input.employeeNumber }, select: {
    id: true, employeeNumber: true, personalEmail: true, dateOfBirth: true, aadhaarLast4: true, status: true,
  }});
  const matches = joining && joining.status !== "REJECTED"
    && joining.personalEmail.toLowerCase() === input.personalEmail
    && dateOnly(joining.dateOfBirth) === input.dateOfBirth
    && joining.aadhaarLast4 === input.aadhaarLast4;
  if (!matches) fail(403, "Employee details could not be verified. Check the joining record or contact HR.", "COMPLIANCE_IDENTITY_MISMATCH");
  await prisma.auditLog.create({
    data: {
      action: "employee_compliance.access_verified",
      entityType: "EmployeeJoining",
      entityId: joining.id,
      metadata: { employeeNumber: joining.employeeNumber },
    },
  });
  return issueAccessToken(joining.id);
}

export async function getEmployeeCompliance(token?: string) {
  const joining = await employeeJoiningForToken(token);
  const [pf, esic, documents] = await Promise.all([
    prisma.employeePfCompliance.findUnique({ where: { joiningId: joining.id } }),
    prisma.employeeEsicCompliance.findUnique({ where: { joiningId: joining.id }, include: { familyMembers: { orderBy: { sortOrder: "asc" } } } }),
    prisma.employeeComplianceDocument.findMany({ where: { joiningId: joining.id }, select: { id: true, area: true, kind: true, familyMemberId: true, fileName: true, mimeType: true, size: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return { employee: masterProfile(joining), pf: publicPf(pf), esic: publicEsic(esic), documents };
}

const employeeEditableStatuses = new Set<ComplianceStatus>([
  ComplianceStatus.DRAFT,
  ComplianceStatus.NEEDS_CORRECTION,
]);

function assertEmployeeEditable(status: ComplianceStatus | undefined) {
  if (status && !employeeEditableStatuses.has(status)) {
    fail(409, "This compliance record is locked while the department reviews it", "COMPLIANCE_RECORD_LOCKED");
  }
}

export async function savePfCompliance(token: string | undefined, input: PfComplianceDraftInput) {
  const joining = await employeeJoiningForToken(token);
  const existing = await prisma.employeePfCompliance.findUnique({ where: { joiningId: joining.id } });
  assertEmployeeEditable(existing?.status);
  const values = {
    appointmentDate: input.appointmentDate ? dateAtUtc(input.appointmentDate) : null,
    epfWages: input.epfWages,
    monthlyGross: input.monthlyGross,
    department: input.department || null,
    designation: input.designation || null,
    husbandName: input.husbandName || null,
    presentDistrict: input.presentDistrict || null,
    permanentDistrict: input.permanentDistrict || null,
    bankAccountType: input.bankAccountType || null,
    existingUanEncrypted: input.existingUanNumber ? encryptHrPii(input.existingUanNumber) : null,
    existingUanLast4: input.existingUanNumber ? input.existingUanNumber.slice(-4) : null,
  } satisfies Prisma.EmployeePfComplianceUncheckedCreateWithoutJoiningInput;
  const record = await prisma.$transaction(async tx => {
    const saved = existing
      ? await tx.employeePfCompliance.update({ where: { id: existing.id }, data: { ...values, revision: { increment: 1 } } })
      : await tx.employeePfCompliance.create({ data: { joiningId: joining.id, ...values } });
    await tx.auditLog.create({
      data: {
        action: "employee_compliance.pf_draft_saved",
        entityType: "EmployeePfCompliance",
        entityId: saved.id,
        metadata: { joiningId: joining.id, employeeNumber: joining.employeeNumber },
      },
    });
    return saved;
  });
  return { pf: publicPf(record) };
}

function assertPfComplete(record: Prisma.EmployeePfComplianceGetPayload<Record<string, never>>) {
  if (!record.appointmentDate || record.epfWages === null || record.monthlyGross === null || !record.department || !record.designation || !record.presentDistrict || !record.permanentDistrict || !record.bankAccountType) {
    fail(400, "Complete appointment, wage, department, designation, district and bank-account-type fields before submitting PF details", "PF_COMPLIANCE_INCOMPLETE");
  }
}

export async function submitPfCompliance(token?: string) {
  const joining = await employeeJoiningForToken(token);
  return prisma.$transaction(async tx => {
    const record = await tx.employeePfCompliance.findUnique({ where: { joiningId: joining.id } });
    if (!record) fail(400, "Save PF details before submitting", "PF_COMPLIANCE_MISSING");
    assertEmployeeEditable(record.status);
    assertPfComplete(record);
    const nextStatus = record.status === ComplianceStatus.NEEDS_CORRECTION ? ComplianceStatus.RESUBMITTED : ComplianceStatus.SUBMITTED;
    const updated = await tx.employeePfCompliance.update({ where: { id: record.id }, data: { status: nextStatus, correctionRemarks: null, submittedAt: new Date(), revision: { increment: 1 } } });
    await tx.auditLog.create({ data: { action: nextStatus === ComplianceStatus.RESUBMITTED ? "employee_compliance.pf_resubmitted" : "employee_compliance.pf_submitted", entityType: "EmployeePfCompliance", entityId: updated.id, metadata: { joiningId: joining.id, employeeNumber: joining.employeeNumber } } });
    return { pf: publicPf(updated) };
  });
}

async function removedFamilyAssets(existingIds: string[], keepIds: string[]) {
  const removed = existingIds.filter(id => !keepIds.includes(id));
  if (!removed.length) return [];
  return prisma.employeeComplianceDocument.findMany({ where: { familyMemberId: { in: removed } } });
}

export async function saveEsicCompliance(token: string | undefined, input: EsicComplianceDraftInput) {
  const joining = await employeeJoiningForToken(token);
  const existing = await prisma.employeeEsicCompliance.findUnique({ where: { joiningId: joining.id }, include: { familyMembers: true } });
  assertEmployeeEditable(existing?.status);
  const keepIds = input.esiApplicable ? input.familyMembers.flatMap(member => member.id ? [member.id] : []) : [];
  const staleAssets = existing ? await removedFamilyAssets(existing.familyMembers.map(member => member.id), keepIds) : [];
  const esic = await prisma.$transaction(async tx => {
    const baseData = {
      esiApplicable: input.esiApplicable,
      esiNumberEncrypted: input.esiNumber ? encryptHrPii(input.esiNumber) : null,
      esiNumberLast4: input.esiNumber ? input.esiNumber.slice(-4) : null,
      nomineeName: input.esiApplicable ? input.nomineeName || null : null,
      nomineeRelationship: input.esiApplicable ? input.nomineeRelationship || null : null,
      nomineeAddress: input.esiApplicable ? input.nomineeAddress || null : null,
      nomineeMobile: input.esiApplicable ? input.nomineeMobile || null : null,
      nomineeEmail: input.esiApplicable ? input.nomineeEmail || null : null,
    };
    const current = existing
      ? await tx.employeeEsicCompliance.update({ where: { id: existing.id }, data: { ...baseData, revision: { increment: 1 } } })
      : await tx.employeeEsicCompliance.create({ data: { joiningId: joining.id, ...baseData } });
    const currentIds = existing?.familyMembers.map(member => member.id) ?? [];
    const removeIds = currentIds.filter(id => !keepIds.includes(id));
    if (removeIds.length) await tx.employeeEsicFamilyMember.deleteMany({ where: { id: { in: removeIds }, esicComplianceId: current.id } });
    if (input.esiApplicable) {
      for (const [sortOrder, member] of input.familyMembers.entries()) {
        const memberData = {
          nameAsAadhaar: member.nameAsAadhaar,
          relationship: member.relationship,
          dateOfBirth: dateAtUtc(member.dateOfBirth),
          residesWithEmployee: member.residesWithEmployee,
          address: member.residesWithEmployee ? null : member.address || null,
          aadhaarEncrypted: encryptHrPii(member.aadhaarNumber),
          aadhaarLast4: member.aadhaarNumber.slice(-4),
          sortOrder,
        };
        if (member.id && currentIds.includes(member.id)) await tx.employeeEsicFamilyMember.update({ where: { id: member.id }, data: memberData });
        else await tx.employeeEsicFamilyMember.create({ data: { esicComplianceId: current.id, ...memberData } });
      }
    } else if (currentIds.length) {
      await tx.employeeEsicFamilyMember.deleteMany({ where: { esicComplianceId: current.id } });
    }
    await tx.auditLog.create({
      data: {
        action: "employee_compliance.esic_draft_saved",
        entityType: "EmployeeEsicCompliance",
        entityId: current.id,
        metadata: { joiningId: joining.id, employeeNumber: joining.employeeNumber, familyMembers: input.esiApplicable ? input.familyMembers.length : 0 },
      },
    });
    return tx.employeeEsicCompliance.findUniqueOrThrow({ where: { id: current.id }, include: { familyMembers: { orderBy: { sortOrder: "asc" } } } });
  });
  for (const asset of staleAssets) void deletePrivateFile({ publicId: asset.storagePublicId, resourceType: "raw", deliveryType: "authenticated" }).catch(() => undefined);
  return { esic: publicEsic(esic) };
}

function assertEsicComplete(record: Prisma.EmployeeEsicComplianceGetPayload<{ include: { familyMembers: true } }>) {
  if (record.esiApplicable === null) fail(400, "Confirm whether ESIC is applicable before submitting", "ESIC_APPLICABILITY_REQUIRED");
  if (record.esiApplicable && (!record.nomineeName || !record.nomineeRelationship || !record.nomineeAddress || !record.nomineeMobile)) {
    fail(400, "Complete ESIC nominee details before submitting", "ESIC_NOMINEE_INCOMPLETE");
  }
}

export async function submitEsicCompliance(token?: string) {
  const joining = await employeeJoiningForToken(token);
  return prisma.$transaction(async tx => {
    const record = await tx.employeeEsicCompliance.findUnique({ where: { joiningId: joining.id }, include: { familyMembers: true } });
    if (!record) fail(400, "Save ESIC details before submitting", "ESIC_COMPLIANCE_MISSING");
    assertEmployeeEditable(record.status);
    assertEsicComplete(record);
    const nextStatus = record.status === ComplianceStatus.NEEDS_CORRECTION ? ComplianceStatus.RESUBMITTED : ComplianceStatus.SUBMITTED;
    const updated = await tx.employeeEsicCompliance.update({ where: { id: record.id }, data: { status: nextStatus, correctionRemarks: null, submittedAt: new Date(), revision: { increment: 1 } }, include: { familyMembers: { orderBy: { sortOrder: "asc" } } } });
    await tx.auditLog.create({ data: { action: nextStatus === ComplianceStatus.RESUBMITTED ? "employee_compliance.esic_resubmitted" : "employee_compliance.esic_submitted", entityType: "EmployeeEsicCompliance", entityId: updated.id, metadata: { joiningId: joining.id, employeeNumber: joining.employeeNumber, familyMembers: updated.familyMembers.length } } });
    return { esic: publicEsic(updated) };
  });
}

function validateFile(body: unknown, type?: string, name?: string) {
  if (!Buffer.isBuffer(body) || !body.length) fail(400, "Choose a non-empty document", "COMPLIANCE_DOCUMENT_EMPTY");
  const bytes = body as Buffer;
  if (bytes.length > 5 * 1024 * 1024) fail(413, "Compliance documents must be 5 MB or smaller", "COMPLIANCE_DOCUMENT_TOO_LARGE");
  const mimeType = type?.split(";")[0]?.trim().toLowerCase() || "";
  const pdf = mimeType === "application/pdf" && /^%PDF-/.test(bytes.subarray(0, 8).toString("ascii"));
  const jpeg = mimeType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = mimeType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (!pdf && !jpeg && !png) fail(415, "Upload a valid PDF, JPG or PNG file", "COMPLIANCE_DOCUMENT_TYPE");
  const ext = pdf ? "pdf" : jpeg ? "jpg" : "png";
  let decoded = `compliance-document.${ext}`;
  try { decoded = decodeURIComponent(name || decoded); } catch { /* fallback */ }
  const stem = decoded.replace(/\.[a-zA-Z0-9]{1,8}$/i, "").replace(/[\\/\r\n\u0000-\u001f\u007f"<>]/g, "_").slice(0, 150).trim() || "compliance-document";
  return { buffer: bytes, mimeType, fileName: `${stem}.${ext}`, size: bytes.length, sha256: hash(bytes) };
}

async function areaEditable(joiningId: string, area: ComplianceArea) {
  const record = area === ComplianceArea.PF_EPFO
    ? await prisma.employeePfCompliance.findUnique({ where: { joiningId }, select: { id: true, status: true } })
    : await prisma.employeeEsicCompliance.findUnique({ where: { joiningId }, select: { id: true, status: true } });
  if (!record) fail(400, `Save ${area === ComplianceArea.PF_EPFO ? "PF / EPFO" : "ESIC"} details before uploading documents`, "COMPLIANCE_RECORD_MISSING");
  assertEmployeeEditable(record.status);
  return record;
}

export async function uploadComplianceDocument(token: string | undefined, area: ComplianceArea, kind: ComplianceDocumentKind, body: unknown, type?: string, name?: string, familyMemberId?: string) {
  const joining = await employeeJoiningForToken(token);
  const complianceRecord = await areaEditable(joining.id, area);
  if (kind === ComplianceDocumentKind.FAMILY_MEMBER_PHOTO) {
    if (area !== ComplianceArea.ESIC || !familyMemberId) fail(400, "A family member is required for this photo", "ESIC_FAMILY_MEMBER_REQUIRED");
    const member = await prisma.employeeEsicFamilyMember.findFirst({ where: { id: familyMemberId, esicCompliance: { joiningId: joining.id } }, select: { id: true } });
    if (!member) fail(404, "ESIC family member not found", "ESIC_FAMILY_MEMBER_NOT_FOUND");
  }
  const file = validateFile(body, type, name);
  if (kind === ComplianceDocumentKind.FAMILY_MEMBER_PHOTO && !file.mimeType.startsWith("image/")) fail(415, "Family member photos must be JPG or PNG images", "ESIC_FAMILY_PHOTO_TYPE");
  const where = { joiningId: joining.id, area, kind, familyMemberId: familyMemberId ?? null };
  const existing = await prisma.employeeComplianceDocument.findFirst({ where });
  if (existing?.sha256 === file.sha256) return { document: existing };
  const asset = await uploadPrivateFile({ scope: "employee-compliance", ownerId: `${joining.id}-${area}-${kind}-${familyMemberId || "record"}`, fileName: file.fileName, mimeType: file.mimeType, buffer: file.buffer, sha256: file.sha256 });
  let document;
  try {
    document = await prisma.$transaction(async tx => {
      const saved = existing
        ? await tx.employeeComplianceDocument.update({ where: { id: existing.id }, data: { fileName: file.fileName, mimeType: file.mimeType, size: file.size, sha256: file.sha256, storagePublicId: asset.publicId, storageResourceType: asset.resourceType, storageDeliveryType: asset.deliveryType, storageFormat: asset.format, storageVersion: asset.version, storageAssetId: asset.assetId } })
        : await tx.employeeComplianceDocument.create({ data: { ...where, fileName: file.fileName, mimeType: file.mimeType, size: file.size, sha256: file.sha256, storagePublicId: asset.publicId, storageResourceType: asset.resourceType, storageDeliveryType: asset.deliveryType, storageFormat: asset.format, storageVersion: asset.version, storageAssetId: asset.assetId } });
      await tx.auditLog.create({
        data: {
          action: "employee_compliance.document_uploaded",
          entityType: area === ComplianceArea.PF_EPFO ? "EmployeePfCompliance" : "EmployeeEsicCompliance",
          entityId: complianceRecord.id,
          metadata: { joiningId: joining.id, documentId: saved.id, area, kind, familyMemberId: familyMemberId || undefined, fileName: saved.fileName },
        },
      });
      return saved;
    });
  } catch (error) {
    await deletePrivateFile(asset).catch(() => undefined);
    throw error;
  }
  if (existing && existing.storagePublicId !== asset.publicId) void deletePrivateFile({ publicId: existing.storagePublicId, resourceType: "raw", deliveryType: "authenticated" }).catch(() => undefined);
  return { document: { id: document.id, area: document.area, kind: document.kind, familyMemberId: document.familyMemberId, fileName: document.fileName, mimeType: document.mimeType, size: document.size, createdAt: document.createdAt } };
}

function adminWhere(query: ComplianceListQuery): Prisma.EmployeeJoiningWhereInput {
  return {
    employeeNumber: { not: null },
    status: { not: "REJECTED" },
    ...(query.query ? { OR: [
      { employeeNumber: { contains: query.query, mode: "insensitive" } },
      { fullName: { contains: query.query, mode: "insensitive" } },
      { personalEmail: { contains: query.query, mode: "insensitive" } },
    ] } : {}),
  };
}

export async function listPfCompliance(query: ComplianceListQuery) {
  const where = adminWhere(query);
  if (query.department || query.status) where.pfCompliance = { ...(query.department ? { department: { contains: query.department, mode: "insensitive" } } : {}), ...(query.status ? { status: query.status } : {}) };
  const skip = (query.page - 1) * query.pageSize;
  const [items, total, complianceCount, grouped] = await prisma.$transaction([
    prisma.employeeJoining.findMany({ where, select: { id: true, employeeNumber: true, fullName: true, personalEmail: true, projectAssignment: true, aadhaarLast4: true, bankAccountLast4: true, pfCompliance: { select: { id: true, status: true, department: true, designation: true, existingUanLast4: true, revision: true, updatedAt: true } } }, orderBy: { createdAt: "desc" }, skip, take: query.pageSize }),
    prisma.employeeJoining.count({ where }),
    prisma.employeePfCompliance.count({ where: { status: { not: ComplianceStatus.DRAFT } } }),
    prisma.employeePfCompliance.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
  ]);
  const eligible = await prisma.employeeJoining.count({ where: { employeeNumber: { not: null }, status: { not: "REJECTED" } } });
  return { items: items.map(item => ({ ...item, aadhaar: maskSensitive(item.aadhaarLast4, "XXXX XXXX"), bankAccount: maskSensitive(item.bankAccountLast4, "XXXXXXXX"), uan: maskSensitive(item.pfCompliance?.existingUanLast4, "XXXXXXXX") })), total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)), stats: { totalEmployees: eligible, pendingSubmission: Math.max(0, eligible - complianceCount), byStatus: Object.fromEntries(grouped.map(row => [row.status, typeof row._count === "object" && row._count !== null ? (row._count._all ?? 0) : 0])) } };
}

export async function listEsicCompliance(query: ComplianceListQuery) {
  const where = adminWhere(query);
  if (query.status) where.esicCompliance = { status: query.status };
  const skip = (query.page - 1) * query.pageSize;
  const [items, total, complianceCount, grouped] = await prisma.$transaction([
    prisma.employeeJoining.findMany({ where, select: { id: true, employeeNumber: true, fullName: true, personalEmail: true, projectAssignment: true, aadhaarLast4: true, esicCompliance: { select: { id: true, status: true, esiApplicable: true, esiNumberLast4: true, revision: true, updatedAt: true, _count: { select: { familyMembers: true } } } } }, orderBy: { createdAt: "desc" }, skip, take: query.pageSize }),
    prisma.employeeJoining.count({ where }),
    prisma.employeeEsicCompliance.count({ where: { status: { not: ComplianceStatus.DRAFT } } }),
    prisma.employeeEsicCompliance.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
  ]);
  const eligible = await prisma.employeeJoining.count({ where: { employeeNumber: { not: null }, status: { not: "REJECTED" } } });
  return { items: items.map(item => ({ ...item, aadhaar: maskSensitive(item.aadhaarLast4, "XXXX XXXX"), esiNumber: maskSensitive(item.esicCompliance?.esiNumberLast4, "XXXXXX") })), total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)), stats: { totalEmployees: eligible, pendingSubmission: Math.max(0, eligible - complianceCount), byStatus: Object.fromEntries(grouped.map(row => [row.status, typeof row._count === "object" && row._count !== null ? (row._count._all ?? 0) : 0])) } };
}

async function adminJoining(joiningId: string) {
  const joining = await prisma.employeeJoining.findUnique({ where: { id: joiningId }, select: joiningSelect });
  if (!joining || !joining.employeeNumber || joining.status === "REJECTED") fail(404, "Employee record not found", "EMPLOYEE_NOT_FOUND");
  return joining;
}

export async function getPfComplianceAdmin(joiningId: string, actorUserId: string) {
  const joining = await adminJoining(joiningId);
  const [pf, documents] = await Promise.all([
    prisma.employeePfCompliance.findUnique({ where: { joiningId } }),
    prisma.employeeComplianceDocument.findMany({ where: { joiningId, area: ComplianceArea.PF_EPFO }, select: { id: true, kind: true, fileName: true, mimeType: true, size: true, createdAt: true } }),
  ]);
  const history = await complianceHistory("EmployeePfCompliance", pf?.id);
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_compliance.pf_viewed", entityType: "EmployeeJoining", entityId: joiningId, metadata: { complianceId: pf?.id } } });
  return { employee: adminMasterProfile(joining, ComplianceArea.PF_EPFO), pf: publicPf(pf), documents, history };
}

export async function getEsicComplianceAdmin(joiningId: string, actorUserId: string) {
  const joining = await adminJoining(joiningId);
  const [esic, documents] = await Promise.all([
    prisma.employeeEsicCompliance.findUnique({ where: { joiningId }, include: { familyMembers: { orderBy: { sortOrder: "asc" } } } }),
    prisma.employeeComplianceDocument.findMany({ where: { joiningId, area: ComplianceArea.ESIC }, select: { id: true, kind: true, familyMemberId: true, fileName: true, mimeType: true, size: true, createdAt: true } }),
  ]);
  const history = await complianceHistory("EmployeeEsicCompliance", esic?.id);
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_compliance.esic_viewed", entityType: "EmployeeJoining", entityId: joiningId, metadata: { complianceId: esic?.id } } });
  return { employee: adminMasterProfile(joining, ComplianceArea.ESIC), esic: publicEsic(esic), documents, history };
}

const transitions: Record<ComplianceStatus, ComplianceStatus[]> = {
  DRAFT: [], SUBMITTED: [ComplianceStatus.UNDER_REVIEW], RESUBMITTED: [ComplianceStatus.UNDER_REVIEW],
  UNDER_REVIEW: [ComplianceStatus.NEEDS_CORRECTION, ComplianceStatus.VERIFIED], NEEDS_CORRECTION: [],
  VERIFIED: [ComplianceStatus.PROCESSED], PROCESSED: [],
};

async function reviewCompliance(area: ComplianceArea, joiningId: string, actorUserId: string, input: ComplianceReviewInput) {
  return prisma.$transaction(async tx => {
    const current = area === ComplianceArea.PF_EPFO
      ? await tx.employeePfCompliance.findUnique({ where: { joiningId } })
      : await tx.employeeEsicCompliance.findUnique({ where: { joiningId } });
    if (!current) fail(404, "Compliance record not found", "COMPLIANCE_RECORD_NOT_FOUND");
    if (current.revision !== input.expectedRevision) fail(409, "This compliance record changed. Refresh before continuing.", "COMPLIANCE_RECORD_CHANGED");
    const next = input.status as ComplianceStatus;
    if (!transitions[current.status].includes(next)) fail(409, `Cannot move ${current.status} to ${next}`, "COMPLIANCE_STATUS_TRANSITION");
    const now = new Date();
    const data = {
      status: next,
      correctionRemarks: next === ComplianceStatus.NEEDS_CORRECTION ? input.remarks : null,
      revision: { increment: 1 },
      ...(next === ComplianceStatus.UNDER_REVIEW ? { reviewedAt: now, reviewedByUserId: actorUserId } : {}),
      ...(next === ComplianceStatus.VERIFIED ? { verifiedAt: now, verifiedByUserId: actorUserId } : {}),
      ...(next === ComplianceStatus.PROCESSED ? { processedAt: now, processedByUserId: actorUserId } : {}),
    };
    const updated = area === ComplianceArea.PF_EPFO
      ? await tx.employeePfCompliance.update({ where: { joiningId }, data })
      : await tx.employeeEsicCompliance.update({ where: { joiningId }, data });
    await tx.auditLog.create({ data: { actorUserId, action: `employee_compliance.${area === ComplianceArea.PF_EPFO ? "pf" : "esic"}_${next.toLowerCase()}`, entityType: area === ComplianceArea.PF_EPFO ? "EmployeePfCompliance" : "EmployeeEsicCompliance", entityId: updated.id, metadata: { joiningId, previousStatus: current.status, status: next, remarks: input.remarks || undefined } } });
    return { record: updated };
  });
}

export const reviewPfCompliance = (joiningId: string, actorUserId: string, input: ComplianceReviewInput) => reviewCompliance(ComplianceArea.PF_EPFO, joiningId, actorUserId, input);
export const reviewEsicCompliance = (joiningId: string, actorUserId: string, input: ComplianceReviewInput) => reviewCompliance(ComplianceArea.ESIC, joiningId, actorUserId, input);

const departmentEditableStatuses = new Set<ComplianceStatus>([
  ComplianceStatus.UNDER_REVIEW,
  ComplianceStatus.VERIFIED,
]);

function assertDepartmentUpdateAllowed(status: ComplianceStatus) {
  if (!departmentEditableStatuses.has(status)) {
    fail(409, "Start department review before updating compliance-controlled fields", "COMPLIANCE_DEPARTMENT_UPDATE_NOT_ALLOWED");
  }
}

export async function updatePfComplianceAdmin(joiningId: string, actorUserId: string, input: PfComplianceAdminUpdateInput) {
  return prisma.$transaction(async tx => {
    const current = await tx.employeePfCompliance.findUnique({ where: { joiningId } });
    if (!current) fail(404, "PF / EPFO compliance record not found", "COMPLIANCE_RECORD_NOT_FOUND");
    if (current.revision !== input.expectedRevision) fail(409, "This PF / EPFO record changed. Refresh before continuing.", "COMPLIANCE_RECORD_CHANGED");
    assertDepartmentUpdateAllowed(current.status);
    const updated = await tx.employeePfCompliance.update({
      where: { joiningId },
      data: {
        appointmentDate: input.appointmentDate ? dateAtUtc(input.appointmentDate) : null,
        epfWages: input.epfWages,
        monthlyGross: input.monthlyGross,
        department: input.department || null,
        designation: input.designation || null,
        bankAccountType: input.bankAccountType || null,
        existingUanEncrypted: input.existingUanNumber ? encryptHrPii(input.existingUanNumber) : null,
        existingUanLast4: input.existingUanNumber ? input.existingUanNumber.slice(-4) : null,
        status: ComplianceStatus.UNDER_REVIEW,
        verifiedAt: current.status === ComplianceStatus.VERIFIED ? null : current.verifiedAt,
        verifiedByUserId: current.status === ComplianceStatus.VERIFIED ? null : current.verifiedByUserId,
        revision: { increment: 1 },
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "employee_compliance.pf_department_updated",
        entityType: "EmployeePfCompliance",
        entityId: updated.id,
        metadata: { joiningId, previousStatus: current.status, status: updated.status },
      },
    });
    return { pf: publicPf(updated) };
  });
}

export async function updateEsicComplianceAdmin(joiningId: string, actorUserId: string, input: EsicComplianceAdminUpdateInput) {
  return prisma.$transaction(async tx => {
    const current = await tx.employeeEsicCompliance.findUnique({ where: { joiningId }, include: { familyMembers: { orderBy: { sortOrder: "asc" } } } });
    if (!current) fail(404, "ESIC compliance record not found", "COMPLIANCE_RECORD_NOT_FOUND");
    if (current.revision !== input.expectedRevision) fail(409, "This ESIC record changed. Refresh before continuing.", "COMPLIANCE_RECORD_CHANGED");
    assertDepartmentUpdateAllowed(current.status);
    const updated = await tx.employeeEsicCompliance.update({
      where: { joiningId },
      data: {
        esiApplicable: input.esiApplicable,
        esiNumberEncrypted: input.esiNumber ? encryptHrPii(input.esiNumber) : null,
        esiNumberLast4: input.esiNumber ? input.esiNumber.slice(-4) : null,
        status: ComplianceStatus.UNDER_REVIEW,
        verifiedAt: current.status === ComplianceStatus.VERIFIED ? null : current.verifiedAt,
        verifiedByUserId: current.status === ComplianceStatus.VERIFIED ? null : current.verifiedByUserId,
        revision: { increment: 1 },
      },
      include: { familyMembers: { orderBy: { sortOrder: "asc" } } },
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "employee_compliance.esic_department_updated",
        entityType: "EmployeeEsicCompliance",
        entityId: updated.id,
        metadata: { joiningId, previousStatus: current.status, status: updated.status, esiApplicable: input.esiApplicable },
      },
    });
    return { esic: publicEsic(updated) };
  });
}

export async function downloadComplianceDocument(joiningId: string, documentId: string, actorUserId: string, area: ComplianceArea) {
  const document = await prisma.employeeComplianceDocument.findFirst({ where: { id: documentId, joiningId, area } });
  if (!document) fail(404, "Compliance document not found", "COMPLIANCE_DOCUMENT_NOT_FOUND");
  const bytes = await downloadPrivateFile({ publicId: document.storagePublicId, resourceType: "raw", deliveryType: "authenticated", format: document.storageFormat }, document.fileName);
  await prisma.auditLog.create({ data: { actorUserId, action: "employee_compliance.document_downloaded", entityType: "EmployeeComplianceDocument", entityId: document.id, metadata: { joiningId, area, kind: document.kind } } });
  return { bytes, fileName: document.fileName, mimeType: document.mimeType };
}

function documentNames(joining: { documents: Array<{ kind: string }> }, compliance: Array<{ kind: string }>) {
  return [...new Set([...joining.documents.map(item => item.kind), ...compliance.map(item => item.kind)])].join(", ");
}

export async function exportPfCompliance(actorUserId: string, query: ComplianceListQuery) {
  const where = adminWhere(query);
  if (query.department || query.status) {
    where.pfCompliance = {
      ...(query.department ? { department: { contains: query.department, mode: "insensitive" } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
  }
  const rows = await prisma.employeeJoining.findMany({
    where,
    select: {
      ...joiningSelect,
      pfCompliance: true,
      complianceDocuments: { where: { area: ComplianceArea.PF_EPFO }, select: { kind: true } },
    },
    orderBy: { employeeNumber: "asc" },
  });
  // Keep the legacy client's 38-column workbook shape while deliberately leaving
  // ESIC-owned columns blank. PF users should not receive ESIC nominee/insurance
  // data merely because the historical spreadsheet combined both departments.
  const headers = ["Name (As on AADHAAR)","Date of Appointment","EPF WAGES (Gross-HRA)","Monthly Gross","Department","Designation","Existing UAN Number","If Esi Applicable","Existing ESI Number","Aadhar Number","PAN Number","Date of Birth (As on AADHAAR)","Father's Name","Husband's Name","Gender","Marital Status","Mobile Number","Email Id","Present Address - Premise Name/No","Present Address - Sub Locality","Present Address - Locality/City","Present Address - District","Present Address - State","Permanent Address - Premise Name/No","Permanent Address - Sub Locality","Permanent Address - Locality/City","Permanent Address - District","Permanent Address - State","ESI Nominee Name","ESI Nominee Relationship","ESI Nominee Address","ESI Nominee Mobile","ESI Nominee Email","Bank Name","IFSC Code","Bank Account Number","Bank Account type(Saving/Current)","Documents"];
  const data = rows.map(row => [
    row.fullName,
    dateOnly(row.pfCompliance?.appointmentDate || row.offer?.joiningDate),
    row.pfCompliance?.epfWages ?? "",
    row.pfCompliance?.monthlyGross ?? row.offer?.monthlyGrossSalary ?? "",
    row.pfCompliance?.department || row.offer?.department || "",
    row.pfCompliance?.designation || row.offer?.designation || "",
    decryptHrPii(row.pfCompliance?.existingUanEncrypted) || decryptHrPii(row.uanEncrypted),
    "",
    "",
    decryptHrPii(row.aadhaarEncrypted),
    decryptHrPii(row.panEncrypted),
    dateOnly(row.dateOfBirth),
    row.fatherGuardianName,
    row.pfCompliance?.husbandName || "",
    row.gender,
    row.maritalStatus || "",
    row.phone,
    row.personalEmail,
    row.currentAddressLine1,
    row.currentAddressLine2 || "",
    row.currentCity,
    row.pfCompliance?.presentDistrict || "",
    row.currentState,
    row.permanentAddressLine1,
    row.permanentAddressLine2 || "",
    row.permanentCity,
    row.pfCompliance?.permanentDistrict || "",
    row.permanentState,
    "",
    "",
    "",
    "",
    "",
    row.bankName,
    row.ifscCode,
    decryptHrPii(row.bankAccountEncrypted),
    row.pfCompliance?.bankAccountType || "",
    documentNames(row, row.complianceDocuments),
  ]);
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "employee_compliance.pf_exported",
      entityType: "EmployeePfCompliance",
      entityId: "bulk",
      metadata: { records: rows.length, status: query.status || null, department: query.department || null, filtered: Boolean(query.query || query.status || query.department) },
    },
  });
  return createXlsx([{ name: "PF New Employee Basic Details", rows: [headers, ...data] }]);
}

export async function exportEsicCompliance(actorUserId: string, query: ComplianceListQuery) {
  const where = adminWhere(query);
  if (query.status) where.esicCompliance = { status: query.status };
  const rows = await prisma.employeeJoining.findMany({
    where,
    select: {
      ...joiningSelect,
      esicCompliance: { include: { familyMembers: { orderBy: { sortOrder: "asc" } } } },
    },
    orderBy: { employeeNumber: "asc" },
  });
  const employeeHeaders = [
    "Employee ID","Employee Name","ESI Applicable","Existing ESI Number","Aadhaar Number","Date of Birth","Gender","Father / Guardian",
    "Mobile","Email","Present Address","Permanent Address","Employee Photo","Nominee Name","Nominee Relationship","Nominee Address",
    "Nominee Mobile","Nominee Email","Family Members","Status",
  ];
  const familyHeaders = ["S.No","Employee Name","Number of Family Members","Name (As on AADHAAR)","Relationship with the employee","Photo","Date of Birth","Whether Residing with the employee (Y/N)","If No. Address of the Family member","AADHAAR No."];
  const employees = rows.map(row => [
    row.employeeNumber || "",
    row.fullName,
    row.esicCompliance?.esiApplicable === null || row.esicCompliance?.esiApplicable === undefined ? "" : row.esicCompliance.esiApplicable ? "Yes" : "No",
    decryptHrPii(row.esicCompliance?.esiNumberEncrypted),
    decryptHrPii(row.aadhaarEncrypted),
    dateOnly(row.dateOfBirth),
    row.gender,
    row.fatherGuardianName,
    row.phone,
    row.personalEmail,
    [row.currentAddressLine1, row.currentAddressLine2, row.currentCity, row.currentState, row.currentPostalCode].filter(Boolean).join(", "),
    [row.permanentAddressLine1, row.permanentAddressLine2, row.permanentCity, row.permanentState, row.permanentPostalCode].filter(Boolean).join(", "),
    row.documents.some(document => document.kind === "PHOTO") ? "Available in secure joining record" : "Not attached",
    row.esicCompliance?.nomineeName || "",
    row.esicCompliance?.nomineeRelationship || "",
    row.esicCompliance?.nomineeAddress || "",
    row.esicCompliance?.nomineeMobile || "",
    row.esicCompliance?.nomineeEmail || "",
    row.esicCompliance?.familyMembers.length ?? 0,
    row.esicCompliance?.status || "NOT_SUBMITTED",
  ]);
  let serial = 1;
  const families = rows.flatMap(row => (row.esicCompliance?.familyMembers ?? []).map(member => [
    serial++,
    row.fullName,
    row.esicCompliance?.familyMembers.length ?? 0,
    member.nameAsAadhaar,
    member.relationship,
    "Stored securely in system",
    dateOnly(member.dateOfBirth),
    member.residesWithEmployee ? "Y" : "N",
    member.residesWithEmployee ? "" : member.address || "",
    decryptHrPii(member.aadhaarEncrypted),
  ]));
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "employee_compliance.esic_exported",
      entityType: "EmployeeEsicCompliance",
      entityId: "bulk",
      metadata: { records: rows.length, familyRows: families.length, status: query.status || null, filtered: Boolean(query.query || query.status) },
    },
  });
  return createXlsx([
    { name: "ESIC Employee Details", rows: [employeeHeaders, ...employees] },
    { name: "Family details-ESI Eligible Emp", rows: [familyHeaders, ...families] },
  ]);
}
