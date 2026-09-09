import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  version?: number;
  role: "ADMIN" | "BUSINESS" | "WORKER" | "PLACEMENT_CELL";
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  if (typeof decoded !== "object" || typeof decoded.sub !== "string" || typeof decoded.role !== "string") throw new Error("Invalid token payload");
  if (!["ADMIN", "BUSINESS", "WORKER", "PLACEMENT_CELL"].includes(decoded.role)) throw new Error("Invalid token role");
  if (decoded.version !== undefined && (!Number.isInteger(decoded.version) || decoded.version < 0)) throw new Error("Invalid token version");
  return { version: decoded.version ?? 0, sub: decoded.sub, role: decoded.role as AccessTokenPayload["role"] };
}
