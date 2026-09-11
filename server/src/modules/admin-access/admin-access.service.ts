import { createHash, randomBytes } from "node:crypto";
import { AdminDepartment, AdminPermission, Prisma, UserRole } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { sendAdminInvitationEmail } from "../../services/email.service.js";
import { HttpError } from "../../utils/http-error.js";
import { hashPassword } from "../../utils/password.js";
import {
  ALL_ADMIN_PERMISSIONS,
  DEPARTMENT_LABELS,
  DEPARTMENT_PERMISSION_PRESETS,
  MANAGED_ADMIN_DEPARTMENTS,
  PERMISSION_LABELS,
  allowedPermissionsForDepartment,
  normalizeDepartmentPermissions,
} from "./admin-access.policy.js";
import type { CreateAdminUserInput, ListAdminUsersQuery, UpdateAdminAccessInput } from "./admin-access.schema.js";

const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

function tokenHash(token: string) {
  return createHash("sha256").update(`zobhunger:admin-invite:v1:${token}`).digest("hex");
}

function statusForAdmin(user: { isActive: boolean; emailVerifiedAt: Date | null }) {
  if (user.isActive) return "ACTIVE" as const;
  return user.emailVerifiedAt ? "DISABLED" as const : "PENDING" as const;
}

function publicAdmin(user: {
  id: string;
  email: string;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  adminDepartment: AdminDepartment | null;
  adminPermissions: AdminPermission[];
  adminMfaEnabledAt: Date | null;
  adminInviteToken?: { expiresAt: Date } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    department: user.adminDepartment,
    departmentLabel: user.adminDepartment ? DEPARTMENT_LABELS[user.adminDepartment] : "Administrator",
    permissions: user.adminPermissions,
    isActive: user.isActive,
    status: statusForAdmin(user),
    mfaEnabled: Boolean(user.adminMfaEnabledAt),
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    invitationExpiresAt: user.adminInviteToken?.expiresAt ?? null,
    protectedAccount: user.adminDepartment === AdminDepartment.MAIN_ADMIN,
  };
}

function assertManagedDepartment(department: AdminDepartment) {
  if (!(MANAGED_ADMIN_DEPARTMENTS as readonly AdminDepartment[]).includes(department)) {
    throw new HttpError(400, "Department administrators can only be created for HR, Technical, Placement Cell or Legal", { code: "ADMIN_DEPARTMENT_INVALID" });
  }
}

function validatedPermissions(department: AdminDepartment, requested?: AdminPermission[]) {
  assertManagedDepartment(department);
  const allowed = allowedPermissionsForDepartment(department);
  const invalid = (requested ?? []).filter(permission => !allowed.has(permission));
  if (invalid.length) {
    throw new HttpError(400, "One or more permissions do not belong to the selected department", {
      code: "ADMIN_PERMISSION_INVALID",
      details: { permissions: invalid },
    });
  }
  return normalizeDepartmentPermissions(department, requested);
}

function invitationLink(token: string) {
  const base = env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0]?.trim() ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/admin-access/activate#token=${encodeURIComponent(token)}`;
}

async function issueInvitation(userId: string, email: string, department: AdminDepartment, createdByUserId: string) {
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await prisma.adminInviteToken.upsert({
    where: { userId },
    update: { tokenHash: hash, expiresAt, createdByUserId, createdAt: new Date() },
    create: { userId, tokenHash: hash, expiresAt, createdByUserId },
  });
  const delivered = await sendAdminInvitationEmail({
    email,
    department: DEPARTMENT_LABELS[department],
    activationLink: invitationLink(token),
    expiresAt,
  });
  return { delivered, expiresAt };
}

export function adminAccessConfiguration() {
  return {
    departments: MANAGED_ADMIN_DEPARTMENTS.map(department => ({
      value: department,
      label: DEPARTMENT_LABELS[department],
      defaultPermissions: DEPARTMENT_PERMISSION_PRESETS[department],
      permissions: DEPARTMENT_PERMISSION_PRESETS[department].map(permission => ({ value: permission, ...PERMISSION_LABELS[permission] })),
    })),
    permissions: ALL_ADMIN_PERMISSIONS.filter(permission => permission !== AdminPermission.ADMIN_USERS_MANAGE)
      .map(permission => ({ value: permission, ...PERMISSION_LABELS[permission] })),
    invitationHours: 48,
  };
}

export async function listAdminUsers(query: ListAdminUsersQuery) {
  const where: Prisma.UserWhereInput = { role: UserRole.ADMIN };
  if (query.department) where.adminDepartment = query.department;
  if (query.query) where.email = { contains: query.query, mode: "insensitive" };
  if (query.status === "ACTIVE") where.isActive = true;
  if (query.status === "PENDING") { where.isActive = false; where.emailVerifiedAt = null; }
  if (query.status === "DISABLED") { where.isActive = false; where.emailVerifiedAt = { not: null }; }

  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, isActive: true, emailVerifiedAt: true, lastLoginAt: true,
        createdAt: true, updatedAt: true, adminDepartment: true, adminPermissions: true,
        adminMfaEnabledAt: true, adminInviteToken: { select: { expiresAt: true } },
      },
      orderBy: [{ adminDepartment: "asc" }, { createdAt: "asc" }],
      take: query.pageSize,
      skip,
    }),
    prisma.user.count({ where }),
  ]);
  return {
    items: items.map(publicAdmin),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function createDepartmentAdmin(input: CreateAdminUserInput, actorUserId: string, audit?: { ipAddress?: string; userAgent?: string }) {
  const department = input.department as AdminDepartment;
  const permissions = validatedPermissions(department, input.permissions as AdminPermission[] | undefined);
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new HttpError(409, "An account already exists for this email address", { code: "ADMIN_EMAIL_EXISTS" });

  const placeholderHash = await hashPassword(randomBytes(32).toString("base64url"));
  const user = await prisma.$transaction(async tx => {
    const created = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: placeholderHash,
        role: UserRole.ADMIN,
        isActive: false,
        adminDepartment: department,
        adminPermissions: permissions,
      },
      select: { id: true, email: true, adminDepartment: true },
    });
    await tx.auditLog.create({ data: {
      actorUserId,
      action: "admin.access_account_created",
      entityType: "User",
      entityId: created.id,
      metadata: { email: created.email, department, permissions },
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
    }});
    return created;
  });

  const invite = await issueInvitation(user.id, user.email, department, actorUserId);
  const created = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true, email: true, isActive: true, emailVerifiedAt: true, lastLoginAt: true,
      createdAt: true, updatedAt: true, adminDepartment: true, adminPermissions: true,
      adminMfaEnabledAt: true, adminInviteToken: { select: { expiresAt: true } },
    },
  });
  return { admin: publicAdmin(created), invitationDelivered: invite.delivered };
}

async function editableAdmin(id: string) {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, adminDepartment: true, isActive: true, emailVerifiedAt: true, email: true },
  });
  if (!target || target.role !== UserRole.ADMIN) throw new HttpError(404, "Administrator account not found", { code: "ADMIN_NOT_FOUND" });
  if (target.adminDepartment === AdminDepartment.MAIN_ADMIN) {
    throw new HttpError(403, "Main Administration access is protected and cannot be changed from the department access desk", { code: "MAIN_ADMIN_PROTECTED" });
  }
  return target;
}

export async function updateDepartmentAdminAccess(id: string, input: UpdateAdminAccessInput, actorUserId: string, audit?: { ipAddress?: string; userAgent?: string }) {
  const target = await editableAdmin(id);
  const department = input.department as AdminDepartment;
  const permissions = validatedPermissions(department, input.permissions as AdminPermission[]);
  const updated = await prisma.$transaction(async tx => {
    const changed = await tx.user.update({
      where: { id: target.id },
      data: { adminDepartment: department, adminPermissions: permissions, sessionVersion: { increment: 1 } },
      select: {
        id: true, email: true, isActive: true, emailVerifiedAt: true, lastLoginAt: true,
        createdAt: true, updatedAt: true, adminDepartment: true, adminPermissions: true,
        adminMfaEnabledAt: true, adminInviteToken: { select: { expiresAt: true } },
      },
    });
    await tx.auditLog.create({ data: {
      actorUserId, action: "admin.access_permissions_changed", entityType: "User", entityId: target.id,
      metadata: { department, permissions }, ipAddress: audit?.ipAddress, userAgent: audit?.userAgent,
    }});
    return changed;
  });
  return publicAdmin(updated);
}

export async function updateDepartmentAdminStatus(id: string, isActive: boolean, actorUserId: string, audit?: { ipAddress?: string; userAgent?: string }) {
  if (id === actorUserId) throw new HttpError(400, "You cannot disable your own administrator account", { code: "ADMIN_SELF_DISABLE" });
  const target = await editableAdmin(id);
  if (isActive && !target.emailVerifiedAt) {
    throw new HttpError(409, "This administrator must activate the invitation before the account can be enabled", { code: "ADMIN_ACTIVATION_REQUIRED" });
  }
  const updated = await prisma.$transaction(async tx => {
    const changed = await tx.user.update({
      where: { id: target.id },
      data: { isActive, sessionVersion: { increment: 1 } },
      select: {
        id: true, email: true, isActive: true, emailVerifiedAt: true, lastLoginAt: true,
        createdAt: true, updatedAt: true, adminDepartment: true, adminPermissions: true,
        adminMfaEnabledAt: true, adminInviteToken: { select: { expiresAt: true } },
      },
    });
    await tx.auditLog.create({ data: {
      actorUserId, action: isActive ? "admin.access_account_enabled" : "admin.access_account_disabled",
      entityType: "User", entityId: target.id, metadata: { email: target.email },
      ipAddress: audit?.ipAddress, userAgent: audit?.userAgent,
    }});
    return changed;
  });
  return publicAdmin(updated);
}

export async function resendDepartmentAdminInvitation(id: string, actorUserId: string, audit?: { ipAddress?: string; userAgent?: string }) {
  const target = await editableAdmin(id);
  if (target.emailVerifiedAt) throw new HttpError(409, "This administrator has already activated the account", { code: "ADMIN_ALREADY_ACTIVATED" });
  if (target.isActive) throw new HttpError(409, "This administrator account is already active", { code: "ADMIN_ALREADY_ACTIVE" });
  if (!target.adminDepartment) throw new HttpError(409, "Administrator department is missing", { code: "ADMIN_DEPARTMENT_REQUIRED" });
  const invite = await issueInvitation(target.id, target.email, target.adminDepartment, actorUserId);
  await prisma.auditLog.create({ data: {
    actorUserId, action: "admin.access_invitation_reissued", entityType: "User", entityId: target.id,
    metadata: { email: target.email, expiresAt: invite.expiresAt }, ipAddress: audit?.ipAddress, userAgent: audit?.userAgent,
  }});
  return { delivered: invite.delivered, expiresAt: invite.expiresAt };
}

async function invitationRecord(token: string) {
  const hash = tokenHash(token);
  const record = await prisma.adminInviteToken.findUnique({
    where: { tokenHash: hash },
    include: { user: { select: { id: true, email: true, role: true, isActive: true, adminDepartment: true } } },
  });
  if (!record || record.expiresAt <= new Date() || record.user.role !== UserRole.ADMIN || record.user.isActive || !record.user.adminDepartment) {
    throw new HttpError(400, "This administrator invitation is invalid or has expired", { code: "ADMIN_INVITATION_INVALID" });
  }
  return record;
}

export async function inspectAdminInvitation(token: string) {
  const record = await invitationRecord(token);
  return {
    email: record.user.email,
    department: record.user.adminDepartment,
    departmentLabel: DEPARTMENT_LABELS[record.user.adminDepartment],
    expiresAt: record.expiresAt,
  };
}

export async function activateAdminInvitation(token: string, password: string, audit?: { ipAddress?: string; userAgent?: string }) {
  const record = await invitationRecord(token);
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "AdminInviteToken" WHERE "id" = ${record.id} FOR UPDATE`);
    const current = await tx.adminInviteToken.findUnique({
      where: { id: record.id },
      include: { user: { select: { id: true, email: true, role: true, isActive: true, adminDepartment: true } } },
    });
    if (!current || current.tokenHash !== record.tokenHash || current.expiresAt <= new Date() || current.user.isActive) {
      throw new HttpError(409, "This administrator invitation has already been used or expired", { code: "ADMIN_INVITATION_USED" });
    }
    const updated = await tx.user.update({
      where: { id: current.userId },
      data: {
        passwordHash,
        isActive: true,
        emailVerifiedAt: new Date(),
        sessionVersion: { increment: 1 },
        adminMfaSecretEncrypted: null,
        adminMfaEnabledAt: null,
        adminMfaRecoveryCodes: [],
      },
      select: { id: true, email: true, adminDepartment: true },
    });
    await tx.adminInviteToken.delete({ where: { id: current.id } });
    await tx.auditLog.create({ data: {
      actorUserId: updated.id,
      action: "admin.access_invitation_activated",
      entityType: "User",
      entityId: updated.id,
      metadata: { email: updated.email, department: updated.adminDepartment },
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
    }});
    return {
      email: updated.email,
      department: updated.adminDepartment,
      departmentLabel: updated.adminDepartment ? DEPARTMENT_LABELS[updated.adminDepartment] : "Administrator",
      next: "/login",
    };
  });
}
