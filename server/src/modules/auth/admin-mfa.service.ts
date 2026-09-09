import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const digits = 6;
const stepSeconds = 30;

function key() {
  // A distinct MFA_ENCRYPTION_KEY is preferred. The JWT secret fallback keeps
  // existing deployments bootable while operators roll out the new setting.
  return createHash("sha256").update(`zobhunger:mfa:v1:${env.MFA_ENCRYPTION_KEY ?? env.JWT_SECRET}`).digest();
}

function base32Encode(input: Buffer) {
  let bits = 0, value = 0, output = "";
  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(value: string) {
  let bits = 0, buffer = 0;
  const bytes: number[] = [];
  for (const character of value.toUpperCase().replace(/=+$/g, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Invalid base32 secret");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function encrypt(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decrypt(value: string) {
  const [version, ivValue, tagValue, dataValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !dataValue) throw new HttpError(500, "Administrator MFA configuration is unreadable", { code: "MFA_CONFIGURATION_INVALID" });
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataValue, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new HttpError(500, "Administrator MFA configuration is unreadable", { code: "MFA_CONFIGURATION_INVALID" });
  }
}

function hotp(secret: string, counter: number) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = (((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff)) % (10 ** digits);
  return String(code).padStart(digits, "0");
}

export function verifyTotp(secret: string, code: string, now = Date.now()) {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(now / 1000 / stepSeconds);
  for (const delta of [-1, 0, 1]) {
    const expected = Buffer.from(hotp(secret, counter + delta));
    const actual = Buffer.from(normalized);
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) return true;
  }
  return false;
}

function normalizeRecoveryCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function recoveryHash(value: string) {
  return createHmac("sha256", env.JWT_SECRET).update(`admin-mfa-recovery:${normalizeRecoveryCode(value)}`).digest("hex");
}
function recoveryCodes() {
  return Array.from({ length: 10 }, () => {
    const value = randomBytes(6).toString("hex").toUpperCase();
    return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
  });
}

export async function beginAdminMfa(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true, isActive: true, adminMfaEnabledAt: true } });
  if (!user || !user.isActive || user.role !== "ADMIN") throw new HttpError(403, "Administrator access is required", { code: "ADMIN_REQUIRED" });
  if (user.adminMfaEnabledAt) throw new HttpError(409, "Administrator MFA is already enabled", { code: "MFA_ALREADY_ENABLED" });
  const secret = base32Encode(randomBytes(20));
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: userId }, data: { adminMfaSecretEncrypted: encrypt(secret), adminMfaRecoveryCodes: [] } });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "admin.mfa_setup_started", entityType: "User", entityId: userId } });
  });
  const label = encodeURIComponent(`ZOBHUNGER:${user.email}`);
  const issuer = encodeURIComponent("ZOBHUNGER");
  return { secret, otpauthUri: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30` };
}

export async function confirmAdminMfa(userId: string, code: string) {
  const codes = recoveryCodes();
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.role !== "ADMIN") throw new HttpError(403, "Administrator access is required", { code: "ADMIN_REQUIRED" });
    if (user.adminMfaEnabledAt) throw new HttpError(409, "Administrator MFA is already enabled", { code: "MFA_ALREADY_ENABLED" });
    if (!user.adminMfaSecretEncrypted || !verifyTotp(decrypt(user.adminMfaSecretEncrypted), code)) throw new HttpError(400, "The authenticator code is invalid or expired", { code: "MFA_CODE_INVALID" });
    const updated = await tx.user.update({
      where: { id: userId },
      data: { adminMfaEnabledAt: new Date(), adminMfaRecoveryCodes: codes.map(recoveryHash), sessionVersion: { increment: 1 } },
    });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "admin.mfa_enabled", entityType: "User", entityId: userId } });
    return { user: updated, recoveryCodes: codes };
  });
}

export async function verifyAdminMfaForLogin(userId: string, code?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { adminMfaSecretEncrypted: true, adminMfaEnabledAt: true, adminMfaRecoveryCodes: true } });
  if (!user?.adminMfaEnabledAt || !user.adminMfaSecretEncrypted) return { enabled: false };
  if (!code?.trim()) throw new HttpError(401, "Enter the code from your authenticator app or a recovery code", { code: "MFA_REQUIRED" });
  const secret = decrypt(user.adminMfaSecretEncrypted);
  if (verifyTotp(secret, code)) return { enabled: true, recoveryCodeUsed: false };
  const candidate = recoveryHash(code);
  if (!user.adminMfaRecoveryCodes.includes(candidate)) throw new HttpError(401, "The MFA code is invalid or expired", { code: "MFA_CODE_INVALID" });

  // Serialize one-time recovery-code use. Two requests can never consume the
  // same code successfully.
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { adminMfaRecoveryCodes: true } });
    if (!current.adminMfaRecoveryCodes.includes(candidate)) throw new HttpError(401, "This recovery code has already been used", { code: "MFA_CODE_INVALID" });
    await tx.user.update({ where: { id: userId }, data: { adminMfaRecoveryCodes: current.adminMfaRecoveryCodes.filter(value => value !== candidate) } });
    await tx.auditLog.create({ data: { actorUserId: userId, action: "admin.mfa_recovery_used", entityType: "User", entityId: userId } });
  });
  return { enabled: true, recoveryCodeUsed: true };
}
