import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

/**
 * Production administrator workspaces require MFA. An administrator without
 * MFA may still hold a short-lived authenticated session so they can reach the
 * dedicated /auth/admin-mfa setup/confirm endpoints, but every /admin API is
 * blocked until enrollment is complete.
 */
export const requireAdminMfa: RequestHandler = (_req, res, next) => {
  const user = res.locals.authUser as { role?: string; adminMfaEnabled?: boolean } | undefined;
  if (!user || user.role !== "ADMIN") {
    return next(new HttpError(403, "Administrator access is required", { code: "ADMIN_REQUIRED" }));
  }
  if (env.NODE_ENV === "production" && !user.adminMfaEnabled) {
    return next(new HttpError(403, "Multi-factor authentication must be enabled before opening administrator workspaces.", {
      code: "ADMIN_MFA_ENROLLMENT_REQUIRED",
      details: { next: "/admin/security" },
    }));
  }
  next();
};
