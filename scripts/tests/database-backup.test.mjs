import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { decryptBackupFile, encryptBackupFile, sha256File } from "../backup/backup-crypto.mjs";

const root = resolve(import.meta.dirname, "../..");

async function text(relative) {
  return readFile(join(root, relative), "utf8");
}

test("backup encryption is authenticated and round-trips without exposing plaintext", async () => {
  const directory = await mkdtemp(join(tmpdir(), "zobhunger-backup-test-"));
  const source = join(directory, "source.dump");
  const encrypted = join(directory, "source.dump.enc");
  const restored = join(directory, "restored.dump");
  const key = randomBytes(32);
  try {
    const payload = Buffer.from("PostgreSQL backup fixture\nprivate employee data\n", "utf8");
    await writeFile(source, payload);
    await encryptBackupFile(source, encrypted, key);
    const encryptedBytes = await readFile(encrypted);
    assert.equal(encryptedBytes.includes(Buffer.from("private employee data")), false);
    await decryptBackupFile(encrypted, restored, key);
    assert.equal(await sha256File(source), await sha256File(restored));

    encryptedBytes[Math.floor(encryptedBytes.length / 2)] ^= 0xff;
    const tampered = join(directory, "tampered.enc");
    await writeFile(tampered, encryptedBytes);
    await assert.rejects(() => decryptBackupFile(tampered, join(directory, "tampered.dump"), key));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("database backup workflow runs at 1 AM and 1 PM IST and never exposes backup secrets in pull requests", async () => {
  const workflow = await text(".github/workflows/database-backup.yml");
  assert.match(workflow, /cron:\s*["']30 7 \* \* \*["']/);
  assert.match(workflow, /cron:\s*["']30 19 \* \* \*["']/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.match(workflow, /secrets\.BACKUP_DATABASE_URL/);
  assert.match(workflow, /secrets\.BACKUP_ENCRYPTION_KEY_B64/);
  assert.match(workflow, /secrets\.GOOGLE_DRIVE_REFRESH_TOKEN/);
  assert.match(workflow, /cancel-in-progress:\s*false/);
  assert.match(workflow, /npm run backup:database/);
  assert.match(workflow, /npm run backup:verify/);
});

test("backup implementation uses pg_dump custom format, encryption, Drive verification and guarded restore drills", async () => {
  const create = await text("scripts/backup/create-drive-backup.mjs");
  const postgres = await text("scripts/backup/postgres.mjs");
  const verify = await text("scripts/backup/verify-drive-backup.mjs");
  const drive = await text("scripts/backup/google-drive.mjs");

  assert.match(postgres, /--format=custom/);
  assert.match(create, /encryptBackupFile/);
  assert.match(create, /encryptedSha256/);
  assert.match(create, /md5Checksum/);
  assert.match(drive, /uploadType=resumable/);
  assert.match(drive, /drive\.file/);
  assert.match(verify, /pg_restore --list|verifyPostgresDumpArchive/);
  assert.match(verify, /RESTORE_TO_ISOLATED_DATABASE/);
  assert.match(verify, /restore\|recovery\|drill\|test/);
});
