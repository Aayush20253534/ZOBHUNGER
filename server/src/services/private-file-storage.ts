import { createHash } from "node:crypto";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import { consumeProviderBudget, ProviderBudgetExceededError } from "../operations/provider-budget.js";
import { guardedProviderRequest, ProviderCircuitOpenError } from "../operations/provider-circuit.js";

export interface PrivateFileAsset {
  publicId: string;
  resourceType: "raw";
  deliveryType: "authenticated";
  format: string;
  version: string;
  assetId: string | null;
  bytes: number;
}

interface UploadPrivateFileInput {
  scope: string;
  ownerId: string;
  fileName: string;
  mimeType: string;
  buffer: unknown;
  sha256: string;
}

const memoryAssets = new Map<string, Buffer>();

function configured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function requireConfigured() {
  if (configured()) return;
  if (env.NODE_ENV === "test") return;
  throw new HttpError(503, "Private file storage is not configured", { code: "FILE_STORAGE_UNAVAILABLE" });
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "asset";
}

function extension(fileName: string) {
  const match = /\.([a-zA-Z0-9]{1,12})$/.exec(fileName);
  return match?.[1]?.toLowerCase() || "bin";
}

function normalizeSignatureValue(value: string | number | boolean) {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function sign(params: Record<string, string | number | boolean>) {
  const canonical = Object.keys(params).sort().map(key => `${key}=${normalizeSignatureValue(params[key])}`).join("&");
  return createHash("sha1").update(`${canonical}${env.CLOUDINARY_API_SECRET ?? ""}`).digest("hex");
}

function cloudinaryApi(resourceType: "raw", action: "upload" | "destroy" | "download") {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME ?? "")}/${resourceType}/${action}`;
}

function uploadPublicId(input: UploadPrivateFileInput) {
  const root = env.CLOUDINARY_PRIVATE_FOLDER.split("/").map(safeSegment).filter(Boolean).join("/") || "zobhunger-private";
  return `${root}/${safeSegment(input.scope)}/${safeSegment(input.ownerId)}/${input.sha256.slice(0, 40)}`;
}

export function privateFileStorageConfigured() {
  return configured();
}

async function storageProviderRequest(request: () => Promise<Response>) {
  try {
    await consumeProviderBudget("cloudinary", "requests", 1, env.CLOUDINARY_DAILY_REQUEST_LIMIT);
    return await guardedProviderRequest("cloudinary", request);
  } catch (error) {
    if (error instanceof ProviderBudgetExceededError) {
      throw new HttpError(503, "Private file storage is temporarily unavailable because the daily request safety limit has been reached", { code: "FILE_STORAGE_DAILY_LIMIT_REACHED" });
    }
    if (error instanceof ProviderCircuitOpenError) {
      throw new HttpError(503, "Private file storage is temporarily unavailable after repeated upstream failures", { code: "FILE_STORAGE_CIRCUIT_OPEN" });
    }
    throw error;
  }
}

export async function uploadPrivateFile(input: UploadPrivateFileInput): Promise<PrivateFileAsset> {
  requireConfigured();
  if (!Buffer.isBuffer(input.buffer) || input.buffer.length === 0) {
    throw new HttpError(400, "A valid non-empty file payload is required", { code: "INVALID_FILE_PAYLOAD" });
  }
  // Treat every service boundary as untrusted at runtime. TypeScript annotations
  // disappear in production, so keep a fresh Buffer copy after narrowing.
  const buffer = Buffer.from(input.buffer);
  try {
    await consumeProviderBudget("cloudinary", "upload_bytes", buffer.length, env.CLOUDINARY_DAILY_UPLOAD_BYTES_LIMIT);
  } catch (error) {
    if (error instanceof ProviderBudgetExceededError) {
      throw new HttpError(503, "Private file upload is temporarily unavailable because the daily safety limit has been reached", { code: "FILE_STORAGE_DAILY_LIMIT_REACHED" });
    }
    throw error;
  }
  const publicId = uploadPublicId(input);
  const format = extension(input.fileName);

  if (!configured() && env.NODE_ENV === "test") {
    memoryAssets.set(publicId, Buffer.from(buffer));
    return { publicId, resourceType: "raw", deliveryType: "authenticated", format, version: "test", assetId: `test:${publicId}`, bytes: buffer.length };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = { public_id: publicId, timestamp, type: "authenticated", overwrite: true, invalidate: true };
  const form = new FormData();
  // Node's Buffer is typed as Uint8Array<ArrayBufferLike>, while the DOM Blob
  // constructor requires an ArrayBuffer-backed BlobPart. Copying into a fresh
  // Uint8Array keeps the bytes identical and gives TypeScript the safe backing type.
  const uploadBytes = new Uint8Array(buffer.length);
  uploadBytes.set(buffer);
  form.set("file", new Blob([uploadBytes], { type: input.mimeType }), `secure.${format}`);
  form.set("api_key", env.CLOUDINARY_API_KEY!);
  form.set("timestamp", String(timestamp));
  form.set("public_id", publicId);
  form.set("type", "authenticated");
  form.set("overwrite", "true");
  form.set("invalidate", "true");
  form.set("signature", sign(signedParams));

  const response = await storageProviderRequest(() => fetch(cloudinaryApi("raw", "upload"), { method: "POST", body: form, signal: AbortSignal.timeout(env.CLOUDINARY_TIMEOUT_MS) }));
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || typeof body.public_id !== "string") {
    throw new HttpError(502, "Private file storage rejected the upload", { code: "FILE_STORAGE_UPLOAD_FAILED" });
  }
  return {
    publicId: body.public_id,
    resourceType: "raw",
    deliveryType: "authenticated",
    format: typeof body.format === "string" && body.format ? body.format : format,
    version: String(body.version ?? ""),
    assetId: typeof body.asset_id === "string" ? body.asset_id : null,
    bytes: typeof body.bytes === "number" ? body.bytes : buffer.length,
  };
}

export async function downloadPrivateFile(asset: Pick<PrivateFileAsset, "publicId" | "resourceType" | "deliveryType" | "format">, fileName: string): Promise<Buffer> {
  requireConfigured();
  if (!configured() && env.NODE_ENV === "test") {
    const bytes = memoryAssets.get(asset.publicId);
    if (!bytes) throw new HttpError(404, "Stored file not found", { code: "FILE_STORAGE_NOT_FOUND" });
    return Buffer.from(bytes);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = timestamp + Math.max(30, Math.min(300, env.CLOUDINARY_DOWNLOAD_TTL_SECONDS));
  const targetFilename = fileName.replace(/[\r\n"\\/]/g, "_").slice(0, 180) || `download.${asset.format}`;
  const params: Record<string, string | number | boolean> = {
    public_id: asset.publicId,
    format: asset.format,
    timestamp,
    expires_at: expiresAt,
    type: asset.deliveryType,
    attachment: true,
    target_filename: targetFilename,
  };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) query.set(key, normalizeSignatureValue(value));
  query.set("api_key", env.CLOUDINARY_API_KEY!);
  query.set("signature", sign(params));
  const response = await storageProviderRequest(() => fetch(`${cloudinaryApi("raw", "download")}?${query.toString()}`, { signal: AbortSignal.timeout(env.CLOUDINARY_TIMEOUT_MS) }));
  if (!response.ok) throw new HttpError(response.status === 404 ? 404 : 502, response.status === 404 ? "Stored file not found" : "Private file storage could not deliver the file", { code: response.status === 404 ? "FILE_STORAGE_NOT_FOUND" : "FILE_STORAGE_DOWNLOAD_FAILED" });
  return Buffer.from(await response.arrayBuffer());
}

export async function deletePrivateFile(asset: Pick<PrivateFileAsset, "publicId" | "resourceType" | "deliveryType">): Promise<void> {
  requireConfigured();
  if (!configured() && env.NODE_ENV === "test") { memoryAssets.delete(asset.publicId); return; }
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: asset.publicId, timestamp, type: asset.deliveryType, invalidate: true };
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) form.set(key, normalizeSignatureValue(value));
  form.set("api_key", env.CLOUDINARY_API_KEY!);
  form.set("signature", sign(params));
  const response = await storageProviderRequest(() => fetch(cloudinaryApi("raw", "destroy"), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, signal: AbortSignal.timeout(env.CLOUDINARY_TIMEOUT_MS) }));
  if (!response.ok) throw new HttpError(502, "Private file storage could not remove the file", { code: "FILE_STORAGE_DELETE_FAILED" });
}
