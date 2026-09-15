import { PlacementCellApplicationStatus, Prisma, TechnicalStudentSource, TechnicalStudentStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import type { TechnicalStudentAdminListQuery, TechnicalStudentCoreInput } from "./technical-students.schema.js";

function studentData(input: TechnicalStudentCoreInput) {
  return {
    ...input,
    dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null,
  };
}

export function findApprovedTechnicalInstituteByCode(partnershipCode: string) {
  return prisma.technicalInstituteApplication.findFirst({
    where: { partnershipCode, status: PlacementCellApplicationStatus.APPROVED },
    select: {
      id: true,
      institutionName: true,
      institutionType: true,
      city: true,
      state: true,
      partnershipCode: true,
      preferredOpportunityTypes: true,
      tradesBranches: true,
    },
  });
}

export function createSelfRegisteredTechnicalStudent(instituteId: string, input: TechnicalStudentCoreInput) {
  return prisma.technicalStudent.create({
    data: {
      ...studentData(input),
      technicalInstituteApplicationId: instituteId,
      source: TechnicalStudentSource.SELF_REGISTRATION,
      status: TechnicalStudentStatus.PENDING,
      consentAcceptedAt: new Date(),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      qualification: true,
      tradeBranch: true,
      status: true,
      createdAt: true,
    },
  });
}

function adminStudentWhere(instituteId: string, query: TechnicalStudentAdminListQuery): Prisma.TechnicalStudentWhereInput {
  const where: Prisma.TechnicalStudentWhereInput = { technicalInstituteApplicationId: instituteId };
  if (query.status) where.status = TechnicalStudentStatus[query.status];
  if (query.qualification) where.qualification = query.qualification;
  if (query.tradeBranch) where.tradeBranch = { contains: query.tradeBranch, mode: "insensitive" };
  if (query.passingYear) where.passingYear = query.passingYear;
  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { mobileNumber: { contains: query.search, mode: "insensitive" } },
      { enrollmentNumber: { contains: query.search, mode: "insensitive" } },
      { tradeBranch: { contains: query.search, mode: "insensitive" } },
      { currentCity: { contains: query.search, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listTechnicalStudentsForAdmin(instituteId: string, query: TechnicalStudentAdminListQuery) {
  const where = adminStudentWhere(instituteId, query);
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.technicalStudent.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: query.pageSize,
    }),
    prisma.technicalStudent.count({ where }),
  ]);
  return { items, total };
}

export async function technicalStudentSummary(instituteId: string) {
  const [total, pending, verified, inactive, qualifications, passingYears, trades] = await Promise.all([
    prisma.technicalStudent.count({ where: { technicalInstituteApplicationId: instituteId } }),
    prisma.technicalStudent.count({ where: { technicalInstituteApplicationId: instituteId, status: TechnicalStudentStatus.PENDING } }),
    prisma.technicalStudent.count({ where: { technicalInstituteApplicationId: instituteId, status: TechnicalStudentStatus.VERIFIED } }),
    prisma.technicalStudent.count({ where: { technicalInstituteApplicationId: instituteId, status: TechnicalStudentStatus.INACTIVE } }),
    prisma.technicalStudent.groupBy({ by: ["qualification"], where: { technicalInstituteApplicationId: instituteId }, _count: { _all: true } }),
    prisma.technicalStudent.groupBy({ by: ["passingYear"], where: { technicalInstituteApplicationId: instituteId }, _count: { _all: true } }),
    prisma.technicalStudent.groupBy({ by: ["tradeBranch"], where: { technicalInstituteApplicationId: instituteId, status: { not: TechnicalStudentStatus.INACTIVE } }, _count: { _all: true } }),
  ]);
  return {
    counts: { total, pending, verified, inactive },
    qualifications: qualifications.map((item) => ({ qualification: item.qualification, count: item._count._all })),
    passingYears: passingYears.map((item) => ({ passingYear: item.passingYear, count: item._count._all })).sort((a, b) => b.passingYear.localeCompare(a.passingYear)).slice(0, 6),
    topTrades: trades.map((item) => ({ tradeBranch: item.tradeBranch, count: item._count._all })).sort((a, b) => b.count - a.count).slice(0, 8),
  };
}

export function findTechnicalStudentForAdmin(instituteId: string, studentId: string) {
  return prisma.technicalStudent.findFirst({ where: { id: studentId, technicalInstituteApplicationId: instituteId } });
}

export function existingTechnicalStudentKeys(instituteId: string, rows: TechnicalStudentCoreInput[]) {
  const emails = rows.map((row) => row.email);
  const enrollments = rows.map((row) => row.enrollmentNumber).filter((value): value is string => Boolean(value));
  return prisma.technicalStudent.findMany({
    where: {
      technicalInstituteApplicationId: instituteId,
      OR: [
        ...(emails.length ? [{ email: { in: emails } }] : []),
        ...(enrollments.length ? [{ enrollmentNumber: { in: enrollments } }] : []),
      ],
    },
    select: { email: true, enrollmentNumber: true },
  });
}

export async function createTechnicalStudentForAdmin(input: {
  instituteId: string;
  data: TechnicalStudentCoreInput;
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
  source?: TechnicalStudentSource;
}) {
  return prisma.$transaction(async (tx) => {
    const student = await tx.technicalStudent.create({
      data: {
        ...studentData(input.data),
        technicalInstituteApplicationId: input.instituteId,
        status: TechnicalStudentStatus.VERIFIED,
        source: input.source ?? TechnicalStudentSource.ADMIN_ENTRY,
        submittedByUserId: input.actorUserId,
      },
    });
    await tx.auditLog.create({ data: {
      actorUserId: input.actorUserId,
      action: "TECHNICAL_STUDENT_CREATED",
      entityType: "TechnicalStudent",
      entityId: student.id,
      metadata: { instituteId: input.instituteId, source: student.source },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    } });
    return student;
  });
}

export async function updateTechnicalStudentForAdmin(input: {
  instituteId: string;
  studentId: string;
  data: TechnicalStudentCoreInput;
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.technicalStudent.findFirst({ where: { id: input.studentId, technicalInstituteApplicationId: input.instituteId } });
    if (!current) return null;
    const student = await tx.technicalStudent.update({ where: { id: input.studentId }, data: studentData(input.data) });
    await tx.auditLog.create({ data: {
      actorUserId: input.actorUserId,
      action: "TECHNICAL_STUDENT_UPDATED",
      entityType: "TechnicalStudent",
      entityId: student.id,
      metadata: { instituteId: input.instituteId },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    } });
    return student;
  });
}

export async function updateTechnicalStudentStatusForAdmin(input: {
  instituteId: string;
  studentId: string;
  status: TechnicalStudentStatus;
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.technicalStudent.findFirst({ where: { id: input.studentId, technicalInstituteApplicationId: input.instituteId } });
    if (!current) return null;
    if (current.status === input.status) return current;
    const student = await tx.technicalStudent.update({ where: { id: input.studentId }, data: { status: input.status } });
    await tx.auditLog.create({ data: {
      actorUserId: input.actorUserId,
      action: "TECHNICAL_STUDENT_STATUS_CHANGED",
      entityType: "TechnicalStudent",
      entityId: student.id,
      metadata: { instituteId: input.instituteId, from: current.status, to: input.status },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    } });
    return student;
  });
}

export async function bulkCreateTechnicalStudents(input: {
  instituteId: string;
  rows: TechnicalStudentCoreInput[];
  actorUserId: string;
  importBatch: string;
  fileName?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.technicalStudent.createMany({
      data: input.rows.map((row) => ({
        ...studentData(row),
        technicalInstituteApplicationId: input.instituteId,
        status: TechnicalStudentStatus.VERIFIED,
        source: TechnicalStudentSource.BULK_IMPORT,
        submittedByUserId: input.actorUserId,
        importBatch: input.importBatch,
      })),
      skipDuplicates: true,
    });
    await tx.auditLog.create({ data: {
      actorUserId: input.actorUserId,
      action: "TECHNICAL_STUDENTS_BULK_IMPORTED",
      entityType: "TechnicalInstituteApplication",
      entityId: input.instituteId,
      metadata: { fileName: input.fileName, importBatch: input.importBatch, validRows: input.rows.length, importedRows: result.count, skippedDuplicates: input.rows.length - result.count },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    } });
    return result.count;
  });
}
