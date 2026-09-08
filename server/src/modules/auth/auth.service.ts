import { HttpError } from "../../utils/http-error.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { createUser, findUserByEmail, findUserById, findUserByPhone, markLogin } from "./auth.repository.js";

export function safeUser(user: { id: string; email: string; phone: string | null; role: unknown; isActive: boolean; emailVerifiedAt: Date | null; lastLoginAt: Date | null; createdAt: Date; sessionVersion: number }) {
  return { id: user.id, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive, emailVerifiedAt: user.emailVerifiedAt, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt, sessionVersion: user.sessionVersion };
}

export async function registerUser(input: RegisterInput) {
  if (await findUserByEmail(input.email)) throw new HttpError(409, "An account with this email already exists", { code: "EMAIL_ALREADY_REGISTERED" });
  if (input.phone && await findUserByPhone(input.phone)) throw new HttpError(409, "An account with this phone number already exists", { code: "PHONE_ALREADY_REGISTERED" });
  const passwordHash = await hashPassword(input.password);
  try {
    return safeUser(await createUser({ ...input, passwordHash }));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "An account with these details already exists. Please sign in.", { code: "ACCOUNT_ALREADY_REGISTERED" });
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user || !(await verifyPassword(user.passwordHash, input.password))) throw new HttpError(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
  if (!user.isActive) throw new HttpError(403, "This account is inactive", { code: "ACCOUNT_INACTIVE" });
  const updated = await markLogin(user.id, user.sessionVersion);
  return safeUser(updated);
}

export async function getAuthenticatedUser(id: string, sessionVersion?: number) {
  const user = await findUserById(id);
  if (!user || !user.isActive) throw new HttpError(401, "Authentication required", { code: "UNAUTHENTICATED" });
  if (sessionVersion !== undefined && user.sessionVersion !== sessionVersion) throw new HttpError(401, "Your session has ended. Please sign in again", { code: "SESSION_EXPIRED" });
  return safeUser(user);
}

export async function loginPlacementCellUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user || !(await verifyPassword(user.passwordHash, input.password))) throw new HttpError(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
  if (user.role !== "PLACEMENT_CELL") throw new HttpError(403, "This login is reserved for approved institution partners", { code: "PLACEMENT_CELL_LOGIN_REQUIRED" });
  if (!user.isActive) throw new HttpError(403, "Activate your approved institution partner account before signing in", { code: "PLACEMENT_CELL_ACCOUNT_INACTIVE" });
  const updated = await markLogin(user.id, user.sessionVersion);
  return safeUser(updated);
}

export async function loginBusinessUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user || !(await verifyPassword(user.passwordHash, input.password))) throw new HttpError(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
  if (user.role !== "BUSINESS") throw new HttpError(403, "Use a business account to access this workspace", { code: "BUSINESS_ACCOUNT_REQUIRED" });
  if (!user.isActive) throw new HttpError(403, "This account is inactive", { code: "ACCOUNT_INACTIVE" });
  return safeUser(await markLogin(user.id, user.sessionVersion));
}
