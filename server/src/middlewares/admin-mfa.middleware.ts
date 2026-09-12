import type { RequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";

/**
 * MFA is optional for administrators. When enabled, login still verifies the
 * authenticator/recovery code. This middleware now protects the ADMIN role
 * boundary without forcing enrollment, so password-only admins remain usable.
 */
export const requireAdminMfa: RequestHandler = (_req, res, next) => {
  const user = res.locals.authUser as { role?: string } | undefined;
  if (!user || user.role !== "ADMIN") return next(new HttpError(403, "Administrator access is required", { code: "ADMIN_REQUIRED" }));
  next();
};
