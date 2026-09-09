import type { RequestHandler, Response } from "express";
import { env } from "../../config/env.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { signAccessToken } from "../../utils/jwt.js";
import type { BusinessLoginInput, LoginInput, RegisterInput } from "./auth.schema.js";
import { changeBusinessPassword, loginBusinessUser, loginPlacementCellUser, loginUser, registerUser } from "./auth.service.js";

function authCookieOptions() {
  const production = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? ("none" as const) : ("lax" as const),
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
  const user = await registerUser(res.locals.validated.body as RegisterInput);
  setAuthCookie(res, user);
  res.status(201).json(apiSuccessResponse("Account created", { user }));
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
