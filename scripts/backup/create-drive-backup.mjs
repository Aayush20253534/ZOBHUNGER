import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encryptBackupFile, md5File, parseEncryptionKey, sha256File } from "./backup-crypto.mjs";
import { createPostgresDump, pgDumpVersion, verifyPostgresDumpArchive } from "./postgres.mjs";
import { ensureDriveFolder, exchangeRefreshToken, pruneOldBackups, resumableUploadFile, uploadJson } from "./google-drive.mjs";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function istStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(date).reduce((map, part) => (map[part.type] = part.value, map), {});
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}-IST`;
}

async function main() {
  const databaseUrl = requireEnv("BACKUP_DATABASE_URL");
  const folderId = requireEnv("GOOGLE_DRIVE_FOLDER_ID");
  const encryptionKey = parseEncryptionKey();
  const keyId = process.env.BACKUP_ENCRYPTION_KEY_ID?.trim() || "primary";
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || "0");
  if (!Number.isInteger(retentionDays) || retentionDays < 0 || retentionDays > 3650) throw new Error("BACKUP_RETENTION_DAYS must be an integer between 0 and 3650");

  const workDir = await fs.mkdtemp(join(tmpdir(), "zobhunger-db-backup-"));
  const stamp = istStamp();
  const baseName = `zobhunger-postgres-${stamp}`;
  const dumpPath = join(workDir, `${baseName}.dump`);
  const encryptedPath = join(workDir, `${baseName}.dump.enc`);
  let backupDriveFileId = null;

  try {
    console.log(`[backup] Creating PostgreSQL custom-format dump ${baseName}.dump`);
    await createPostgresDump(databaseUrl, dumpPath);
    await verifyPostgresDumpArchive(dumpPath);
    const dumpStat = await fs.stat(dumpPath);
    if (dumpStat.size <= 0) throw new Error("pg_dump produced an empty backup");

    const dumpSha256 = await sha256File(dumpPath);
    const pgVersion = await pgDumpVersion();
    const encryption = await encryptBackupFile(dumpPath, encryptedPath, encryptionKey);
    const encryptedStat = await fs.stat(encryptedPath);
    const encryptedSha256 = await sha256File(encryptedPath);
    const encryptedMd5 = await md5File(encryptedPath);

    const accessToken = await exchangeRefreshToken();
    const folder = await ensureDriveFolder(accessToken, folderId);
    console.log(`[backup] Uploading encrypted backup to Google Drive folder "${folder.name}"`);

    const backupFile = await resumableUploadFile(accessToken, {
      filePath: encryptedPath,
      name: `${baseName}.dump.enc`,
      folderId,
      appProperties: {
        zobhungerBackup: "true",
        backupType: "postgres-custom-encrypted",
        encryptionKeyId: keyId,
      },
    });
    backupDriveFileId = backupFile.id;
    if (backupFile.md5Checksum && backupFile.md5Checksum.toLowerCase() !== encryptedMd5.toLowerCase()) {
      throw new Error(`Google Drive checksum mismatch for uploaded backup (local ${encryptedMd5}, remote ${backupFile.md5Checksum})`);
    }

    const manifest = {
      schemaVersion: 1,
      application: "ZOBHUNGER",
      createdAtUtc: new Date().toISOString(),
      createdAtTimezone: "Asia/Kolkata",
      databaseFormat: "pg_dump custom format",
      pgDumpVersion: pgVersion,
      encryption: encryption.format,
      encryptionKeyId: keyId,
      backupFileName: backupFile.name,
      backupDriveFileId: backupFile.id,
      backupWebViewLink: backupFile.webViewLink ?? null,
      plaintextDumpSizeBytes: dumpStat.size,
      plaintextDumpSha256: dumpSha256,
      encryptedSizeBytes: encryptedStat.size,
      encryptedSha256,
      encryptedMd5,
    };

    const manifestFile = await uploadJson(accessToken, {
      value: manifest,
      name: `${baseName}.manifest.json`,
      folderId,
      appProperties: { zobhungerBackup: "true", zobhungerBackupManifest: "true" },
    });

    const retention = await pruneOldBackups(accessToken, folderId, retentionDays);
    const report = {
      ok: true,
      createdAtUtc: manifest.createdAtUtc,
      backup: { id: backupFile.id, name: backupFile.name, size: encryptedStat.size, sha256: encryptedSha256 },
      manifest: { id: manifestFile.id, name: manifestFile.name },
      retentionDays,
      deletedByRetention: retention.deleted,
    };
    await fs.mkdir(".release-artifacts", { recursive: true });
    await fs.writeFile(".release-artifacts/database-backup-report.json", JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
    console.log(`[backup] Success: ${backupFile.name} (${encryptedStat.size} bytes)`);
    console.log(`[backup] Manifest: ${manifestFile.name}`);
    if (retentionDays > 0) console.log(`[backup] Retention cleanup deleted ${retention.deleted} old Drive item(s)`);
  } catch (error) {
    await fs.mkdir(".release-artifacts", { recursive: true }).catch(() => {});
    await fs.writeFile(".release-artifacts/database-backup-report.json", JSON.stringify({ ok: false, at: new Date().toISOString(), message: error instanceof Error ? error.message : "Unknown backup failure", partialBackupDriveFileId: backupDriveFileId }, null, 2) + "\n", { mode: 0o600 }).catch(() => {});
    throw error;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`[backup] FAILED: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
