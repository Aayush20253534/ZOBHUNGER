import { AdminDepartment, IntakeCaseStatus, type Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import { HttpError } from "../../utils/http-error.js";
import type { AddIntakeNoteInput, IntakeListQuery, UpdateIntakeCaseInput } from "./intake.schema.js";

export interface IntakeActor {
  id: string;
  adminDepartment: AdminDepartment | null;
}

export interface IntakeAuditContext { ipAddress?: string; userAgent?: string }

const pageSize = 18;
const terminalStatuses = new Set<IntakeCaseStatus>([IntakeCaseStatus.RESOLVED, IntakeCaseStatus.REJECTED, IntakeCaseStatus.ARCHIVED]);

function groupByCount(row: { _count?: true | { _all?: number } }) {
  const count = row._count;
  return typeof count === "object" && count !== null ? (count._all ?? 0) : 0;
}

function actorDepartment(actor: IntakeActor) {
  if (!actor.adminDepartment) throw new HttpError(403, "Administrator department is required", { code: "ADMIN_DEPARTMENT_REQUIRED" });
  return actor.adminDepartment;
}

function scopeWhere(actor: IntakeActor): Prisma.IntakeCaseWhereInput {
  const department = actorDepartment(actor);
  return department === AdminDepartment.MAIN_ADMIN ? {} : { department };
}

function listWhere(actor: IntakeActor, input: IntakeListQuery): Prisma.IntakeCaseWhereInput {
  const department = actorDepartment(actor);
  const requestedDepartment = department === AdminDepartment.MAIN_ADMIN ? input.department : department;
  return {
    ...scopeWhere(actor),
    ...(requestedDepartment ? { department: requestedDepartment } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.sourceType ? { sourceType: input.sourceType } : {}),
    ...(input.assignment === "MINE" ? { assignedAdminId: actor.id } : {}),
    ...(input.assignment === "UNASSIGNED" ? { assignedAdminId: null } : {}),
    ...(input.query ? {
      OR: [
        { subject: { contains: input.query, mode: "insensitive" } },
        { contactName: { contains: input.query, mode: "insensitive" } },
        { contactEmail: { contains: input.query, mode: "insensitive" } },
        { contactPhone: { contains: input.query, mode: "insensitive" } },
        { organizationName: { contains: input.query, mode: "insensitive" } },
        { city: { contains: input.query, mode: "insensitive" } },
        { summary: { contains: input.query, mode: "insensitive" } },
        { sourceId: { contains: input.query, mode: "insensitive" } },
      ],
    } : {}),
  };
}

const listSelect = {
  id: true, sourceType: true, sourceId: true, department: true, status: true, sourceStatus: true,
  subject: true, contactName: true, contactEmail: true, contactPhone: true, organizationName: true,
  city: true, summary: true, assignedAdminId: true, revision: true, submittedAt: true, updatedAt: true,
  assignedAdmin: { select: { id: true, email: true, adminDepartment: true, isActive: true } },
  _count: { select: { notes: true } },
} satisfies Prisma.IntakeCaseSelect;

const detailSelect = {
  ...listSelect,
  details: true,
  sourceUpdatedAt: true,
  notes: {
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    take: 80,
    select: { id: true, body: true, createdAt: true, author: { select: { id: true, email: true, adminDepartment: true } } },
  },
} satisfies Prisma.IntakeCaseSelect;

async function availableAssignees(actor: IntakeActor, department?: AdminDepartment) {
  const actorDept = actorDepartment(actor);
  const target = actorDept === AdminDepartment.MAIN_ADMIN ? department : actorDept;
  return prisma.user.findMany({
    where: {
      role: "ADMIN", isActive: true,
      ...(target ? { OR: [{ adminDepartment: target }, { adminDepartment: AdminDepartment.MAIN_ADMIN }] } : {}),
    },
    select: { id: true, email: true, adminDepartment: true, lastLoginAt: true },
    orderBy: [{ adminDepartment: "asc" }, { email: "asc" }],
  });
}

export async function listIntakeCases(actor: IntakeActor, input: IntakeListQuery) {
  const where = listWhere(actor, input);
  const actorDept = actorDepartment(actor);
  const [items, total, statusCounts, sourceCounts, departmentCounts, assignees] = await prisma.$transaction([
    prisma.intakeCase.findMany({ where, select: listSelect, take: pageSize, skip: (input.page - 1) * pageSize, orderBy: [{ submittedAt: "desc" }, { id: "desc" }] }),
    prisma.intakeCase.count({ where }),
    prisma.intakeCase.groupBy({ by: ["status"], where: { ...scopeWhere(actor), ...(actorDept === AdminDepartment.MAIN_ADMIN && input.department ? { department: input.department } : {}) }, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.intakeCase.groupBy({ by: ["sourceType"], where: scopeWhere(actor), _count: { _all: true }, orderBy: { sourceType: "asc" } }),
    prisma.intakeCase.groupBy({ by: ["department"], where: scopeWhere(actor), _count: { _all: true }, orderBy: { department: "asc" } }),
    prisma.user.findMany({ where: { role: "ADMIN", isActive: true, ...(actorDept === AdminDepartment.MAIN_ADMIN && input.department ? { OR: [{ adminDepartment: input.department }, { adminDepartment: AdminDepartment.MAIN_ADMIN }] } : actorDept !== AdminDepartment.MAIN_ADMIN ? { OR: [{ adminDepartment: actorDept }, { adminDepartment: AdminDepartment.MAIN_ADMIN }] } : {}) }, select: { id: true, email: true, adminDepartment: true, lastLoginAt: true }, orderBy: [{ adminDepartment: "asc" }, { email: "asc" }] }),
  ]);
  return {
    items, total, page: input.page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts: {
      status: Object.fromEntries(statusCounts.map(row => [row.status, groupByCount(row)])),
      source: Object.fromEntries(sourceCounts.map(row => [row.sourceType, groupByCount(row)])),
      department: Object.fromEntries(departmentCounts.map(row => [row.department, groupByCount(row)])),
    },
    assignees,
  };
}

async function caseOrThrow(actor: IntakeActor, id: string) {
  const row = await prisma.intakeCase.findFirst({ where: { id, ...scopeWhere(actor) }, select: detailSelect });
  if (!row) throw new HttpError(404, "Intake case not found", { code: "INTAKE_CASE_NOT_FOUND" });
  return row;
}

export async function getIntakeCase(actor: IntakeActor, id: string) {
  const item = await caseOrThrow(actor, id);
  return { item, assignees: await availableAssignees(actor, item.department) };
}

async function assertAssignableAdmin(adminId: string, department: AdminDepartment) {
  const admin = await prisma.user.findFirst({ where: { id: adminId, role: "ADMIN", isActive: true }, select: { id: true, adminDepartment: true } });
  if (!admin) throw new HttpError(400, "Choose an active administrator", { code: "INTAKE_ASSIGNEE_INVALID" });
  if (admin.adminDepartment !== department && admin.adminDepartment !== AdminDepartment.MAIN_ADMIN) {
    throw new HttpError(400, "The selected administrator does not belong to this case department", { code: "INTAKE_ASSIGNEE_DEPARTMENT_MISMATCH" });
  }
}

export async function updateIntakeCase(actor: IntakeActor, id: string, input: UpdateIntakeCaseInput, audit: IntakeAuditContext) {
  const current = await caseOrThrow(actor, id);
  const actorDept = actorDepartment(actor);
  if (input.department !== undefined && actorDept !== AdminDepartment.MAIN_ADMIN) {
    throw new HttpError(403, "Only Main Administration can reroute a case", { code: "INTAKE_REROUTE_FORBIDDEN" });
  }
  const nextDepartment = input.department ?? current.department;
  if (input.assignedAdminId) await assertAssignableAdmin(input.assignedAdminId, nextDepartment);
  if (input.department && input.department !== current.department && input.assignedAdminId === undefined) {
    // Never retain a department-specific assignee when a Main Admin reroutes the case.
    input = { ...input, assignedAdminId: null };
  }
  const changed = await prisma.$transaction(async tx => {
    const result = await tx.intakeCase.updateMany({
      where: { id, revision: input.expectedRevision, ...scopeWhere(actor) },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.assignedAdminId !== undefined ? { assignedAdminId: input.assignedAdminId } : {}),
        revision: { increment: 1 },
      },
    });
    if (result.count !== 1) throw new HttpError(409, "This case changed while you were reviewing it. Refresh before saving.", { code: "INTAKE_CASE_CHANGED" });
    const updated = await tx.intakeCase.findUniqueOrThrow({ where: { id }, select: detailSelect });
    await tx.auditLog.create({ data: {
      actorUserId: actor.id, action: "intake.case_updated", entityType: "IntakeCase", entityId: id,
      metadata: { fromStatus: current.status, toStatus: updated.status, fromDepartment: current.department, toDepartment: updated.department, fromAssignee: current.assignedAdminId, toAssignee: updated.assignedAdminId },
      ipAddress: audit.ipAddress, userAgent: audit.userAgent,
    } });
    return updated;
  });
  return { item: changed, assignees: await availableAssignees(actor, changed.department) };
}

export async function addIntakeNote(actor: IntakeActor, id: string, input: AddIntakeNoteInput, audit: IntakeAuditContext) {
  await caseOrThrow(actor, id);
  await prisma.$transaction(async tx => {
    const changed = await tx.intakeCase.updateMany({ where: { id, revision: input.expectedRevision, ...scopeWhere(actor) }, data: { revision: { increment: 1 } } });
    if (changed.count !== 1) throw new HttpError(409, "This case changed while you were writing the note. Refresh before saving.", { code: "INTAKE_CASE_CHANGED" });
    await tx.intakeNote.create({ data: { caseId: id, authorUserId: actor.id, body: input.body } });
    await tx.auditLog.create({ data: { actorUserId: actor.id, action: "intake.note_added", entityType: "IntakeCase", entityId: id, metadata: { length: input.body.length }, ipAddress: audit.ipAddress, userAgent: audit.userAgent } });
  });
  return getIntakeCase(actor, id);
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function exportIntakeCases(actor: IntakeActor, input: IntakeListQuery) {
  const where = listWhere(actor, { ...input, page: 1 });
  const rows = await prisma.intakeCase.findMany({ where, select: listSelect, take: 5000, orderBy: [{ submittedAt: "desc" }, { id: "desc" }] });
  const header = ["Case ID", "Department", "Status", "Source", "Source reference", "Subject", "Contact", "Email", "Phone", "Organisation", "City", "Assigned admin", "Submitted at", "Updated at"];
  const lines = [header.map(csvCell).join(","), ...rows.map(row => [row.id, row.department, row.status, row.sourceType, row.sourceId, row.subject, row.contactName, row.contactEmail, row.contactPhone, row.organizationName, row.city, row.assignedAdmin?.email, row.submittedAt.toISOString(), row.updatedAt.toISOString()].map(csvCell).join(","))];
  await prisma.auditLog.create({ data: { actorUserId: actor.id, action: "intake.exported", entityType: "IntakeCase", entityId: "export", metadata: { rows: rows.length } } });
  return lines.join("\r\n");
}

export function intakeStatusIsTerminal(status: IntakeCaseStatus) { return terminalStatuses.has(status); }
