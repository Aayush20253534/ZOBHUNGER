import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decryptBackupFile, md5File, parseEncryptionKey, sha256File } from "./backup-crypto.mjs";
import { databaseIdentity, restorePostgresDump, verifyPostgresDumpArchive } from "./postgres.mjs";
import { downloadDriveFile, ensureDriveFolder, exchangeRefreshToken, getJsonFile, listBackupManifests } from "./google-drive.mjs";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const folderId = requireEnv("GOOGLE_DRIVE_FOLDER_ID");
  const key = parseEncryptionKey();
  const accessToken = await exchangeRefreshToken();
  await ensureDriveFolder(accessToken, folderId);

  const manifestId = process.env.GOOGLE_DRIVE_BACKUP_MANIFEST_ID?.trim() || (await listBackupManifests(accessToken, folderId, 1))[0]?.id;
  if (!manifestId) throw new Error("No ZOBHUNGER backup manifest was found in the configured Google Drive folder");
  const manifest = await getJsonFile(accessToken, manifestId);
  if (manifest.schemaVersion !== 1 || !manifest.backupDriveFileId) throw new Error("Backup manifest is invalid or unsupported");

  const workDir = await fs.mkdtemp(join(tmpdir(), "zobhunger-db-verify-"));
  const encryptedPath = join(workDir, "backup.dump.enc");
  const dumpPath = join(workDir, "backup.dump");
  try {
    console.log(`[backup:verify] Downloading ${manifest.backupFileName}`);
    await downloadDriveFile(accessToken, manifest.backupDriveFileId, encryptedPath);
    const encryptedStat = await fs.stat(encryptedPath);
    if (encryptedStat.size !== Number(manifest.encryptedSizeBytes)) throw new Error("Downloaded encrypted backup size does not match manifest");
    const [sha256, md5] = await Promise.all([sha256File(encryptedPath), md5File(encryptedPath)]);
    if (sha256 !== manifest.encryptedSha256) throw new Error("Downloaded encrypted backup SHA-256 does not match manifest");
    if (manifest.encryptedMd5 && md5 !== manifest.encryptedMd5) throw new Error("Downloaded encrypted backup MD5 does not match manifest");

    await decryptBackupFile(encryptedPath, dumpPath, key);
    const dumpSha = await sha256File(dumpPath);
    if (dumpSha !== manifest.plaintextDumpSha256) throw new Error("Decrypted PostgreSQL dump SHA-256 does not match manifest");
    await verifyPostgresDumpArchive(dumpPath);
    console.log("[backup:verify] Encrypted backup downloaded, authenticated, decrypted and validated by pg_restore --list.");

    if (process.argv.includes("--restore")) {
      const restoreUrl = requireEnv("BACKUP_RESTORE_DATABASE_URL");
      if (process.env.BACKUP_RESTORE_CONFIRM !== "RESTORE_TO_ISOLATED_DATABASE") {
        throw new Error("Set BACKUP_RESTORE_CONFIRM=RESTORE_TO_ISOLATED_DATABASE to permit a restore drill");
      }
      const restoreIdentity = databaseIdentity(restoreUrl);
      if (!/(restore|recovery|drill|test)/i.test(restoreIdentity.database)) {
        throw new Error(`Refusing restore: target database name "${restoreIdentity.database}" must contain restore, recovery, drill, or test`);
      }
      const sourceUrl = process.env.BACKUP_DATABASE_URL?.trim();
      if (sourceUrl) {
        const sourceIdentity = databaseIdentity(sourceUrl);
        if (sourceIdentity.host === restoreIdentity.host && sourceIdentity.port === restoreIdentity.port && sourceIdentity.database === restoreIdentity.database) {
          throw new Error("Refusing restore: restore target resolves to the same database as BACKUP_DATABASE_URL");
        }
      }
      console.log(`[backup:verify] Restoring into isolated database ${restoreIdentity.database} on ${restoreIdentity.host}`);
      await restorePostgresDump(dumpPath, restoreUrl);
      console.log("[backup:verify] Restore drill completed successfully.");
    }
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`[backup:verify] FAILED: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
