import { AdminDepartment, AdminPermission } from "../dist/generated/prisma/client.js";

export const mainAdminAccess = Object.freeze({
  adminDepartment: AdminDepartment.MAIN_ADMIN,
  adminPermissions: Object.values(AdminPermission),
});

export function adminAccessForRole(role) {
  return role === "ADMIN" ? mainAdminAccess : {};
}
