import { prisma } from "../../config/db.js";
import { UserRole } from "../../generated/prisma/client.js";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserByPhone(phone: string) {
  return prisma.user.findUnique({ where: { phone } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(input: { email: string; phone?: string; passwordHash: string; role: "BUSINESS" | "WORKER" }) {
  return prisma.user.create({
    data: { email: input.email, phone: input.phone, passwordHash: input.passwordHash, role: UserRole[input.role] },
  });
}

export function markLogin(id: string) {
  return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
}
