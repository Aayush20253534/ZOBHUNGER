import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import { pipeline } from "node:stream/promises";

const MAGIC = Buffer.from("ZBHENC01", "ascii");
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = MAGIC.length + IV_BYTES;

export function parseEncryptionKey(value = process.env.BACKUP_ENCRYPTION_KEY_B64) {
  if (!value) throw new Error("BACKUP_ENCRYPTION_KEY_B64 is required");
  let key;
  try {
    key = Buffer.from(value, "base64");
  } catch {
    throw new Error("BACKUP_ENCRYPTION_KEY_B64 must be valid base64");
  }
  if (key.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY_B64 must decode to exactly 32 bytes");
  return key;
}

export async function sha256File(path) {
  return hashFile(path, "sha256");
}

export async function md5File(path) {
  return hashFile(path, "md5");
}

async function hashFile(path, algorithm) {
  const hash = createHash(algorithm);
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

export async function encryptBackupFile(inputPath, outputPath, key = parseEncryptionKey()) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const output = createWriteStream(outputPath, { flags: "wx", mode: 0o600 });
  output.write(MAGIC);
  output.write(iv);
  await pipeline(createReadStream(inputPath), cipher, output, { end: false });
  const tag = cipher.getAuthTag();
  await new Promise((resolve, reject) => output.end(tag, error => error ? reject(error) : resolve()));
  return { ivHex: iv.toString("hex"), format: "AES-256-GCM/ZBHENC01" };
}

export async function decryptBackupFile(inputPath, outputPath, key = parseEncryptionKey()) {
  const stat = await fs.stat(inputPath);
  if (stat.size <= HEADER_BYTES + TAG_BYTES) throw new Error("Encrypted backup is too small to be valid");

  const handle = await fs.open(inputPath, "r");
  try {
    const header = Buffer.alloc(HEADER_BYTES);
    await handle.read(header, 0, HEADER_BYTES, 0);
    if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("Encrypted backup magic/version is invalid");

    const iv = header.subarray(MAGIC.length);
    const tag = Buffer.alloc(TAG_BYTES);
    await handle.read(tag, 0, TAG_BYTES, stat.size - TAG_BYTES);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    await pipeline(
      createReadStream(inputPath, { start: HEADER_BYTES, end: stat.size - TAG_BYTES - 1 }),
      decipher,
      createWriteStream(outputPath, { flags: "wx", mode: 0o600 }),
    );
  } finally {
    await handle.close();
  }
}
