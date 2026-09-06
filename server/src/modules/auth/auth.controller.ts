import type { RequestHandler, Response } from "express";
import { env } from "../../config/env.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { signAccessToken } from "../../utils/jwt.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { loginUser, registerUser } from "./auth.service.js";

function setAuthCookie(res: Response, user: { id: string; role: unknown }) {
  const token = signAccessToken({ sub: user.id, role: user.role as "ADMIN" | "BUSINESS" | "WORKER" });
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: env.AUTH_COOKIE_MAX_AGE_MS,
    path: "/",
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
  res.clearCookie(env.AUTH_COOKIE_NAME, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.status(200).json(apiSuccessResponse("Logged out", { loggedOut: true }));
};
