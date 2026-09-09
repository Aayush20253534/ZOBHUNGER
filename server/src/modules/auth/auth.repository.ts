import { prisma } from "../../config/db.js";
import { UserRole } from "../../generated/prisma/client.js";
import { HttpError } from "../../utils/http-error.js";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserByPhone(phone: string) {
  return prisma.user.findUnique({ where: { phone } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function findUserByPartnerCode(partnerCode: string) {
  return prisma.user.findUnique({ where: { partnerCode } });
}

export function createUser(input: { email: string; phone?: string; passwordHash: string; role: "BUSINESS" | "WORKER" }) {
  return prisma.user.create({
    data: { email: input.email, phone: input.phone, passwordHash: input.passwordHash, role: UserRole[input.role] },
  });
}

export async function markLogin(id: string, sessionVersion: number) {
  try {
    // Do not issue a fresh session if the password changed during verification.
    return await prisma.user.update({ where: { id, sessionVersion, isActive: true }, data: { lastLoginAt: new Date() } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      throw new HttpError(401, "Your account changed during sign-in. Please try again.", { code: "SESSION_EXPIRED" });
    }
    throw error;
  }
}
