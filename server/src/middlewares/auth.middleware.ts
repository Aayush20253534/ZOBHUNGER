import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { getAuthenticatedUser } from "../modules/auth/auth.service.js";

function authenticate(allowPasswordChange: boolean): RequestHandler { return async (req, res, next) => {
  try {
    const token = req.cookies?.[env.AUTH_COOKIE_NAME] as string | undefined;
    if (!token) throw new HttpError(401, "Authentication required", { code: "UNAUTHENTICATED" });
    const payload = verifyAccessToken(token);
    const user = await getAuthenticatedUser(payload.sub, payload.version ?? 0);
    if (!allowPasswordChange && user.role === "BUSINESS" && user.mustChangePassword) {
      throw new HttpError(403, "Change your temporary password before opening your business workspace.", { code: "PASSWORD_CHANGE_REQUIRED" });
    }
    res.locals.authUser = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    next(new HttpError(401, "Authentication required", { code: "INVALID_TOKEN" }));
  }
}; }

export const requireAuth = authenticate(false);
export const requirePasswordChangeSession = authenticate(true);

// Public submissions remain available to guests. A supplied session must be valid
// before its identity can be attached to a record.
export const optionalAuth: RequestHandler = (req, res, next) => {
  if (!req.cookies?.[env.AUTH_COOKIE_NAME]) return next();
  return requireAuth(req, res, next);
};
