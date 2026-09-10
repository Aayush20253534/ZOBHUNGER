import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";

const VERSION = "v1";

function key() {
  // HR_PII_ENCRYPTION_KEY should be a long, stable production secret. Falling
  // back to JWT_SECRET keeps local/test environments usable without storing
  // sensitive identifiers as plaintext.
  return createHash("sha256").update(env.HR_PII_ENCRYPTION_KEY || env.JWT_SECRET).digest();
}

export function encryptHrPii(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptHrPii(value: string | null | undefined): string {
  if (!value) return "";
  const [version, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  if (version !== VERSION || !ivRaw || !tagRaw || !encryptedRaw) throw new Error("Unsupported HR PII ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
}

export function maskSensitive(last4: string | null | undefined, label = "••••") {
  return last4 ? `${label} ${last4}` : "Not provided";
}
