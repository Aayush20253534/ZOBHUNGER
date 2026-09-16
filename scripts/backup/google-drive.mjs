import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function errorText(response) {
  const text = await response.text();
  return text.slice(0, 1200);
}

export async function exchangeRefreshToken() {
  const clientId = requireEnv("GOOGLE_DRIVE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_DRIVE_CLIENT_SECRET");
  const refreshToken = requireEnv("GOOGLE_DRIVE_REFRESH_TOKEN");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Google OAuth token refresh failed (${response.status}): ${await errorText(response)}`);
  const payload = await response.json();
  if (!payload.access_token) throw new Error("Google OAuth response did not include an access token");
  return payload.access_token;
}

async function driveFetch(accessToken, path, init = {}) {
  const response = await fetch(path.startsWith("http") ? path : `${DRIVE_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Google Drive API failed (${response.status}): ${await errorText(response)}`);
  return response;
}

export async function ensureDriveFolder(accessToken, folderId) {
  const response = await driveFetch(accessToken, `/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType,trashed&supportsAllDrives=true`);
  const folder = await response.json();
  if (folder.trashed) throw new Error("Configured Google Drive backup folder is in trash");
  if (folder.mimeType !== "application/vnd.google-apps.folder") throw new Error("GOOGLE_DRIVE_FOLDER_ID does not refer to a folder");
  return folder;
}

export async function resumableUploadFile(accessToken, { filePath, name, folderId, mimeType = "application/octet-stream", appProperties = {} }) {
  const stat = await fs.stat(filePath);
  const metadata = { name, parents: [folderId], appProperties };
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const session = await driveFetch(accessToken, `${DRIVE_UPLOAD_API}/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,size,createdTime,webViewLink,md5Checksum`, {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "x-upload-content-type": mimeType,
          "x-upload-content-length": String(stat.size),
        },
        body: JSON.stringify(metadata),
      });
      const uploadUrl = session.headers.get("location");
      if (!uploadUrl) throw new Error("Google Drive resumable upload did not return a session URL");

      const body = Readable.toWeb(createReadStream(filePath));
      const uploaded = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "content-type": mimeType,
          "content-length": String(stat.size),
        },
        body,
        duplex: "half",
        signal: AbortSignal.timeout(15 * 60_000),
      });
      if (!uploaded.ok) throw new Error(`Google Drive upload failed (${uploaded.status}): ${await errorText(uploaded)}`);
      const file = await uploaded.json();
      if (Number(file.size) !== stat.size) throw new Error(`Google Drive uploaded size mismatch: local=${stat.size}, remote=${file.size}`);
      return file;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

export async function uploadJson(accessToken, { value, name, folderId, appProperties = {} }) {
  const boundary = `zobhunger-${randomUUID()}`;
  const metadata = JSON.stringify({ name, parents: [folderId], appProperties });
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(value, null, 2)}\r\n--${boundary}--\r\n`;
  const response = await driveFetch(accessToken, `${DRIVE_UPLOAD_API}/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,size,createdTime,webViewLink,md5Checksum`, {
    method: "POST",
    headers: { "content-type": `multipart/related; boundary=${boundary}` },
    body,
  });
  return response.json();
}

export async function listBackupManifests(accessToken, folderId, pageSize = 20) {
  const q = `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false and appProperties has { key='zobhungerBackupManifest' and value='true' }`;
  const params = new URLSearchParams({
    q,
    pageSize: String(pageSize),
    orderBy: "createdTime desc",
    fields: "files(id,name,size,createdTime,webViewLink,md5Checksum)",
  });
  const response = await driveFetch(accessToken, `/files?${params.toString()}`);
  return (await response.json()).files ?? [];
}

export async function downloadDriveFile(accessToken, fileId, outputPath) {
  const response = await driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, {
    signal: AbortSignal.timeout(15 * 60_000),
  });
  if (!response.body) throw new Error("Google Drive download returned no body");
  const nodeBody = Readable.fromWeb(response.body);
  const output = createWriteStream(outputPath, { flags: "wx", mode: 0o600 });
  await pipeline(nodeBody, output);
}

export async function getJsonFile(accessToken, fileId) {
  const response = await driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`);
  return response.json();
}

export async function deleteDriveFile(accessToken, fileId) {
  await driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, { method: "DELETE" });
}

export async function pruneOldBackups(accessToken, folderId, retentionDays) {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return { deleted: 0 };
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000);
  const q = `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false and appProperties has { key='zobhungerBackup' and value='true' } and createdTime < '${cutoff.toISOString()}'`;
  const params = new URLSearchParams({ q, pageSize: "1000", fields: "files(id,name,createdTime)" });
  const response = await driveFetch(accessToken, `/files?${params.toString()}`);
  const files = (await response.json()).files ?? [];
  for (const file of files) await deleteDriveFile(accessToken, file.id);
  return { deleted: files.length };
}

export async function oauthExchangeAuthorizationCode({ clientId, clientSecret, redirectUri, code }) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Google OAuth authorization exchange failed (${response.status}): ${await errorText(response)}`);
  return response.json();
}

export function googleAuthorizationUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: DRIVE_SCOPE,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function findOrCreateBackupFolder(accessToken, folderName = "ZOBHUNGER Database Backups") {
  const escaped = folderName.replaceAll("'", "\\'");
  const q = `name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const params = new URLSearchParams({ q, pageSize: "10", fields: "files(id,name,webViewLink,createdTime)", orderBy: "createdTime asc" });
  const listed = await driveFetch(accessToken, `/files?${params.toString()}`);
  const files = (await listed.json()).files ?? [];
  if (files.length) return files[0];

  const created = await driveFetch(accessToken, "/files?fields=id,name,webViewLink,createdTime", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: folderName, mimeType: "application/vnd.google-apps.folder" }),
  });
  return created.json();
}
