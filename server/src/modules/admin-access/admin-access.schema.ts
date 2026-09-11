import { z } from "zod";
import { AdminDepartment, AdminPermission } from "../../generated/prisma/client.js";
import { passwordSchema } from "../auth/auth.schema.js";

const managedDepartment = z.enum([
  AdminDepartment.HR,
  AdminDepartment.TECHNICAL,
  AdminDepartment.PLACEMENT_CELL,
  AdminDepartment.LEGAL,
]);

const adminPermission = z.nativeEnum(AdminPermission);

export const listAdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  query: z.string().trim().min(1).max(160).optional(),
  department: z.nativeEnum(AdminDepartment).optional(),
  status: z.enum(["ACTIVE", "PENDING", "DISABLED"]).optional(),
}).strict();

export const createAdminUserSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  department: managedDepartment,
  permissions: z.array(adminPermission).max(30).optional(),
}).strict();

export const updateAdminAccessSchema = z.object({
  department: managedDepartment,
  permissions: z.array(adminPermission).max(30),
}).strict();

export const updateAdminStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();

export const adminUserParamsSchema = z.object({
  id: z.string().trim().min(1).max(180),
}).strict();

export const inspectAdminInvitationSchema = z.object({
  token: z.string().trim().min(32).max(256),
}).strict();

export const activateAdminInvitationSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: passwordSchema,
}).strict();

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminAccessInput = z.infer<typeof updateAdminAccessSchema>;
export type UpdateAdminStatusInput = z.infer<typeof updateAdminStatusSchema>;
export type AdminUserParams = z.infer<typeof adminUserParamsSchema>;
export type InspectAdminInvitationInput = z.infer<typeof inspectAdminInvitationSchema>;
export type ActivateAdminInvitationInput = z.infer<typeof activateAdminInvitationSchema>;
