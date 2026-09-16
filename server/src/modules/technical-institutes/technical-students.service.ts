import { createHash } from "node:crypto";
import { Prisma, TechnicalStudentStatus } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";
import { scanUploadedFile } from "../../services/malware-scan.service.js";
import { getTechnicalInstituteForAdmin } from "./technical-institutes.service.js";
import { parseTechnicalStudentSpreadsheet } from "./technical-student-import.js";
import {
  bulkCreateTechnicalStudents,
  createSelfRegisteredTechnicalStudent,
  createTechnicalStudentForAdmin,
  existingTechnicalStudentKeys,
  findApprovedTechnicalInstituteByCode,
  findTechnicalStudentForAdmin,
  listTechnicalStudentsForAdmin,
  technicalStudentSummary,
  updateTechnicalStudentForAdmin,
  updateTechnicalStudentStatusForAdmin,
} from "./technical-students.repository.js";
import type {
  PublicTechnicalStudentRegistrationInput,
  TechnicalStudentAdminListQuery,
  TechnicalStudentCoreInput,
  TechnicalStudentImportQuery,
} from "./technical-students.schema.js";

function duplicateError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new HttpError(409, "This student is already registered with the selected institute", {
      code: "TECHNICAL_STUDENT_ALREADY_EXISTS",
    });
  }
  throw error;
}

async function approvedInstitute(id: string) {
  const institute = await getTechnicalInstituteForAdmin(id);
  if (institute.status !== "APPROVED" || !institute.partnershipCode) {
    throw new HttpError(409, "Approve the technical institute partnership before managing its student roster", {
      code: "TECHNICAL_INSTITUTE_APPROVAL_REQUIRED",
    });
  }
  return institute;
}

export async function publicTechnicalInstitutePartner(partnershipCode: string) {
  const institute = await findApprovedTechnicalInstituteByCode(partnershipCode);
  if (!institute) {
    throw new HttpError(404, "We could not verify that technical institute partnership code", {
      code: "TECHNICAL_INSTITUTE_PARTNERSHIP_CODE_NOT_FOUND",
    });
  }
  return institute;
}

export async function registerTechnicalStudent(input: PublicTechnicalStudentRegistrationInput) {
  const institute = await publicTechnicalInstitutePartner(input.partnershipCode);
  const { partnershipCode: _partnershipCode, consentAccepted: _consentAccepted, ...student } = input;
  try {
    const result = await createSelfRegisteredTechnicalStudent(institute.id, student);
    return { student: result, institute: { institutionName: institute.institutionName, partnershipCode: institute.partnershipCode } };
  } catch (error) {
    return duplicateError(error);
  }
}

export async function getTechnicalStudentsForAdmin(instituteId: string, query: TechnicalStudentAdminListQuery) {
  await approvedInstitute(instituteId);
  const [{ items, total }, summary] = await Promise.all([
    listTechnicalStudentsForAdmin(instituteId, query),
    technicalStudentSummary(instituteId),
  ]);
  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    summary,
  };
}

export async function getTechnicalStudentSummaryForAdmin(instituteId: string) {
  await approvedInstitute(instituteId);
  return technicalStudentSummary(instituteId);
}

export async function addTechnicalStudentForAdmin(
  instituteId: string,
  input: TechnicalStudentCoreInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string; source?: "ADMIN_ENTRY" | "INSTITUTE_PORTAL" },
) {
  await approvedInstitute(instituteId);
  try {
    return await createTechnicalStudentForAdmin({ instituteId, data: input, ...context });
  } catch (error) {
    return duplicateError(error);
  }
}

export async function editTechnicalStudentForAdmin(
  instituteId: string,
  studentId: string,
  input: TechnicalStudentCoreInput,
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  await approvedInstitute(instituteId);
  try {
    const result = await updateTechnicalStudentForAdmin({ instituteId, studentId, data: input, ...context });
    if (!result) throw new HttpError(404, "Technical student record not found", { code: "TECHNICAL_STUDENT_NOT_FOUND" });
    return result;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    return duplicateError(error);
  }
}

export async function setTechnicalStudentStatusForAdmin(
  instituteId: string,
  studentId: string,
  status: "PENDING" | "VERIFIED" | "INACTIVE",
  context: { actorUserId: string; ipAddress?: string; userAgent?: string },
) {
  await approvedInstitute(instituteId);
  const result = await updateTechnicalStudentStatusForAdmin({
    instituteId,
    studentId,
    status: TechnicalStudentStatus[status],
    ...context,
  });
  if (!result) throw new HttpError(404, "Technical student record not found", { code: "TECHNICAL_STUDENT_NOT_FOUND" });
  return result;
}

function importBatchName(fileName?: string) {
  const stem = (fileName ?? "student-import").replace(/[^a-z0-9._-]+/gi, "-").slice(0, 80);
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${stem}`;
}

export async function importTechnicalStudentsForAdmin(input: {
  instituteId: string;
  mode: TechnicalStudentImportQuery["mode"];
  buffer: Buffer;
  mimeType?: string;
  fileName?: string;
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await approvedInstitute(input.instituteId);
  await scanUploadedFile({
    fileName: input.fileName ?? "technical-students-import.xlsx",
    mimeType: input.mimeType ?? "application/octet-stream",
    buffer: input.buffer,
    sha256: createHash("sha256").update(input.buffer).digest("hex"),
  });
  const parsed = parseTechnicalStudentSpreadsheet({ buffer: input.buffer, mimeType: input.mimeType, fileName: input.fileName });
  const existing = parsed.rows.length ? await existingTechnicalStudentKeys(input.instituteId, parsed.rows) : [];
  const existingEmails = new Set(existing.map((row) => row.email.toLowerCase()));
  const existingEnrollments = new Set(existing.map((row) => row.enrollmentNumber?.toLowerCase()).filter((value): value is string => Boolean(value)));
  const duplicateErrors = [] as Array<{ row: number; field?: string; message: string }>;
  const importable: TechnicalStudentCoreInput[] = [];

  for (const [index, row] of parsed.rows.entries()) {
    const sourceRow = parsed.rowNumbers[index] ?? index + 2;
    if (existingEmails.has(row.email.toLowerCase())) {
      duplicateErrors.push({ row: sourceRow, field: "email", message: "A student with this email already exists for the institute" });
      continue;
    }
    if (row.enrollmentNumber && existingEnrollments.has(row.enrollmentNumber.toLowerCase())) {
      duplicateErrors.push({ row: sourceRow, field: "enrollmentNumber", message: "A student with this enrollment number already exists for the institute" });
      continue;
    }
    importable.push(row);
  }

  const errors = [...parsed.errors, ...duplicateErrors].sort((a, b) => a.row - b.row);
  if (input.mode === "validate") {
    return {
      mode: "validate" as const,
      totalRows: parsed.totalRows,
      validRows: importable.length,
      errorRows: new Set(errors.map((item) => item.row)).size,
      existingRows: duplicateErrors.length,
      errors: errors.slice(0, 100),
      preview: importable.slice(0, 8),
      canImport: importable.length > 0,
    };
  }

  if (!importable.length) {
    throw new HttpError(400, "There are no valid new student rows to import", {
      code: "TECHNICAL_STUDENT_IMPORT_NO_VALID_ROWS",
      details: { errors: errors.slice(0, 25) },
    });
  }

  const batch = importBatchName(input.fileName);
  const importedRows = await bulkCreateTechnicalStudents({
    instituteId: input.instituteId,
    rows: importable,
    actorUserId: input.actorUserId,
    importBatch: batch,
    fileName: input.fileName,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    mode: "import" as const,
    totalRows: parsed.totalRows,
    validRows: importable.length,
    importedRows,
    skippedRows: parsed.totalRows - importedRows,
    skippedDuplicates: importable.length - importedRows + duplicateErrors.length,
    errorRows: new Set(errors.map((item) => item.row)).size,
    errors: errors.slice(0, 100),
    importBatch: batch,
  };
}

export async function getTechnicalStudentForAdmin(instituteId: string, studentId: string) {
  await approvedInstitute(instituteId);
  const student = await findTechnicalStudentForAdmin(instituteId, studentId);
  if (!student) throw new HttpError(404, "Technical student record not found", { code: "TECHNICAL_STUDENT_NOT_FOUND" });
  return student;
}
