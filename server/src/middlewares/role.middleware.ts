import type { RequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";

type Role = "ADMIN" | "BUSINESS" | "WORKER";
export function requireRole(...roles: Role[]): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.authUser as { role?: Role } | undefined;
    if (!user) return next(new HttpError(401, "Authentication required", { code: "UNAUTHENTICATED" }));
    if (!roles.includes(user.role as Role)) return next(new HttpError(403, "You do not have permission to access this resource", { code: "FORBIDDEN" }));
    next();
  };
}
