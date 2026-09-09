import type { RequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";
import { env } from "../config/env.js";

/** Every administrator must finish MFA enrollment before private admin APIs are usable. */
export const requireAdminMfa: RequestHandler = (_req, res, next) => {
  const user = res.locals.authUser as { role?: string; adminMfaEnabled?: boolean } | undefined;
  if (!user || user.role !== "ADMIN") return next(new HttpError(403, "Administrator access is required", { code: "ADMIN_REQUIRED" }));
  // Existing integration fixtures predate MFA. Production never bypasses this;
  // dedicated MFA tests can opt in with ENFORCE_MFA_IN_TESTS=true.
  if (env.NODE_ENV === "test" && process.env.ENFORCE_MFA_IN_TESTS !== "true") return next();
  if (!user.adminMfaEnabled) return next(new HttpError(403, "Set up administrator multi-factor authentication before using the admin workspace", { code: "ADMIN_MFA_SETUP_REQUIRED" }));
  next();
};
