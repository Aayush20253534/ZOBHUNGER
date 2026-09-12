import type { RequestHandler } from "express";
import { AdminPermission } from "../generated/prisma/client.js";
import { HttpError } from "../utils/http-error.js";

export function requireAdminPermission(...permissions: AdminPermission[]): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.authUser as { role?: string; adminPermissions?: AdminPermission[] } | undefined;
    if (!user || user.role !== "ADMIN") {
      return next(new HttpError(403, "Administrator access is required", { code: "ADMIN_REQUIRED" }));
    }
    const granted = new Set(user.adminPermissions ?? []);
    if (!permissions.every(permission => granted.has(permission))) {
      return next(new HttpError(403, "Your administrator account does not have access to this workspace", {
        code: "ADMIN_PERMISSION_REQUIRED",
        details: { permissions },
      }));
    }
    next();
  };
}

const routePermissions: Array<{ pattern: RegExp; permission: AdminPermission }> = [
  { pattern: /^\/overview(?:\/|$)/, permission: AdminPermission.DASHBOARD_VIEW },
  { pattern: /^\/intake(?:\/|$)/, permission: AdminPermission.DASHBOARD_VIEW },
  { pattern: /^\/articles(?:\/|$)/, permission: AdminPermission.BLOGS_MANAGE },
  { pattern: /^\/access(?:\/|$)/, permission: AdminPermission.ADMIN_USERS_MANAGE },
  { pattern: /^\/enquiries(?:\/|$)/, permission: AdminPermission.ENQUIRIES_MANAGE },
  { pattern: /^\/partners(?:\/|$)/, permission: AdminPermission.PARTNERS_MANAGE },
  { pattern: /^\/partner-applications(?:\/|$)/, permission: AdminPermission.PARTNERS_MANAGE },
  { pattern: /^\/vendors(?:\/|$)/, permission: AdminPermission.VENDORS_MANAGE },
  { pattern: /^\/careers(?:\/|$)/, permission: AdminPermission.CAREERS_MANAGE },
  { pattern: /^\/employee-joining(?:\/|$)/, permission: AdminPermission.EMPLOYEE_JOINING_MANAGE },
  { pattern: /^\/worker-applications(?:\/|$)/, permission: AdminPermission.WORKERS_MANAGE },
  { pattern: /^\/candidate-management(?:\/|$)/, permission: AdminPermission.CANDIDATES_MANAGE },
  { pattern: /^\/requirement-jobs(?:\/|$)/, permission: AdminPermission.REQUIREMENTS_MANAGE },
  { pattern: /^\/requirements(?:\/|$)/, permission: AdminPermission.REQUIREMENTS_MANAGE },
  { pattern: /^\/jobs(?:\/|$)/, permission: AdminPermission.JOBS_MANAGE },
  { pattern: /^\/applications(?:\/|$)/, permission: AdminPermission.APPLICATIONS_MANAGE },
  { pattern: /^\/deployments(?:\/|$)/, permission: AdminPermission.DEPLOYMENTS_MANAGE },
  { pattern: /^\/attendance(?:\/|$)/, permission: AdminPermission.ATTENDANCE_MANAGE },
  { pattern: /^\/worker-attendance(?:\/|$)/, permission: AdminPermission.ATTENDANCE_MANAGE },
  { pattern: /^\/attendance-approvals(?:\/|$)/, permission: AdminPermission.ATTENDANCE_MANAGE },
  { pattern: /^\/earnings(?:\/|$)/, permission: AdminPermission.EARNINGS_MANAGE },
  { pattern: /^\/reports(?:\/|$)/, permission: AdminPermission.REPORTS_VIEW },
  { pattern: /^\/placement-cell-applications(?:\/|$)/, permission: AdminPermission.PLACEMENT_MANAGE },
];

/**
 * Central deny-by-permission guard for the existing admin API surface. Keeping
 * the map here means old route modules cannot accidentally become accessible
 * merely because a new department administrator still has role=ADMIN.
 */
export const requireMappedAdminPermission: RequestHandler = (req, res, next) => {
  const match = routePermissions.find(entry => entry.pattern.test(req.path));
  if (!match) return next();
  return requireAdminPermission(match.permission)(req, res, next);
};
