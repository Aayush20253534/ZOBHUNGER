import type { RequestHandler, Response } from "express";
import { env } from "../../config/env.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { signAccessToken } from "../../utils/jwt.js";
import type { BusinessLoginInput, LoginInput, RegisterInput } from "./auth.schema.js";
import { changeAdminPassword, changeBusinessPassword, loginBusinessUser, loginPlacementCellUser, loginUser, registerUser, safeUser } from "./auth.service.js";
import { beginAdminMfa, confirmAdminMfa, disableAdminMfa, rotateAdminMfa } from "./admin-mfa.service.js";

function authCookieOptions() {
  const production = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setAuthCookie(res: Response, user: { id: string; role: unknown; sessionVersion: number }) {
  const token = signAccessToken({ sub: user.id, role: user.role as "ADMIN" | "BUSINESS" | "WORKER" | "PLACEMENT_CELL", version: user.sessionVersion });
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    ...authCookieOptions(),
    maxAge: env.AUTH_COOKIE_MAX_AGE_MS,
  });
}

export const registerController: RequestHandler = async (_req, res) => {
  // Public BUSINESS/WORKER signup is intentionally closed. registerUser always
  // raises the approval/review error for the requested role, so this endpoint
  // remains only as a compatibility guard for stale clients and bookmarks.
  await registerUser(res.locals.validated.body as RegisterInput);
};

export const loginController: RequestHandler = async (_req, res) => {
  const user = await loginUser(res.locals.validated.body as LoginInput);
  setAuthCookie(res, user);
  res.status(200).json(apiSuccessResponse("Logged in", { user }));
};

export const meController: RequestHandler = async (_req, res) => {
  res.status(200).json(apiSuccessResponse("Authenticated user retrieved", { user: res.locals.authUser }));
};

export const logoutController: RequestHandler = async (_req, res) => {
  res.clearCookie(env.AUTH_COOKIE_NAME, authCookieOptions());
  res.status(200).json(apiSuccessResponse("Logged out", { loggedOut: true }));
};

export const placementCellLoginController: RequestHandler = async (_req, res) => {
  const user = await loginPlacementCellUser(res.locals.validated.body as LoginInput);
  setAuthCookie(res, user);
  res.status(200).json(apiSuccessResponse("Institution partner login successful", { user }));
};

export const businessLoginController: RequestHandler = async (_req, res) => {
  const user = await loginBusinessUser(res.locals.validated.body as BusinessLoginInput);
  setAuthCookie(res, user);
  res.status(200).json(apiSuccessResponse("Business login successful", { user }));
};

export const changeBusinessPasswordController: RequestHandler = async (_req, res) => {
  const { currentPassword, password } = res.locals.validated.body;
  const user = await changeBusinessPassword(res.locals.authUser.id, currentPassword, password);
  setAuthCookie(res, user);
  res.json(apiSuccessResponse("Password changed. Your business workspace is ready.", { user }));
};


export const adminMfaSetupController: RequestHandler = async (_req, res) => {
  const setup = await beginAdminMfa(res.locals.authUser.id);
  res.status(200).json(apiSuccessResponse("Administrator MFA setup created", setup));
};

export const adminMfaConfirmController: RequestHandler = async (_req, res) => {
  const result = await confirmAdminMfa(res.locals.authUser.id, res.locals.validated.body.code);
  const user = safeUser(result.user);
  setAuthCookie(res, user);
  res.status(200).json(apiSuccessResponse("Administrator MFA enabled", { user, recoveryCodes: result.recoveryCodes }));
};


export const adminMfaDisableController: RequestHandler = async (_req, res) => {
  const { password, code } = res.locals.validated.body;
  const result = await disableAdminMfa(res.locals.authUser.id, password, code);
  const user = safeUser(result.user);
  setAuthCookie(res, user);
  res.json(apiSuccessResponse("Multi-factor authentication disabled", { user }));
};

export const adminMfaRotateController: RequestHandler = async (_req, res) => {
  const { password, code } = res.locals.validated.body;
  const result = await rotateAdminMfa(res.locals.authUser.id, password, code);
  const user = safeUser(result.user);
  setAuthCookie(res, user);
  res.json(apiSuccessResponse("New authenticator setup created", { user, ...result.setup }));
};

export const changeAdminPasswordController: RequestHandler = async (_req, res) => {
  const { currentPassword, password } = res.locals.validated.body;
  const user = await changeAdminPassword(res.locals.authUser.id, currentPassword, password);
  setAuthCookie(res, user);
  res.json(apiSuccessResponse("Administrator password updated", { user }));
};
