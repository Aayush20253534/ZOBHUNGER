# Database Backup and Recovery

## Purpose

ZOBHUNGER stores operational, employee, compliance and payment-related data in PostgreSQL. Repository automation creates an encrypted off-site PostgreSQL backup in Google Drive twice per day. The backup is a PostgreSQL custom-format archive, **not** a SQLite `.db` file.

Target schedule:

- **01:00 IST every day** (`19:30 UTC` on the previous calendar day);
- **13:00 IST every day** (`07:30 UTC`).

GitHub Actions cron uses UTC and scheduled runs can start a few minutes late during platform congestion. The schedule should therefore be treated as a target time, not a real-time scheduler guarantee.

## Backup flow

```text
Production PostgreSQL
        ↓
pg_dump --format=custom
        ↓
pg_restore --list integrity check
        ↓
SHA-256 of plaintext archive
        ↓
AES-256-GCM encryption
        ↓
SHA-256 + MD5 of encrypted artifact
        ↓
Google Drive resumable upload
        ↓
remote size/MD5 verification
        ↓
manifest JSON upload
        ↓
optional retention cleanup
```

The encrypted backup is named like:

```text
zobhunger-postgres-20260916-130000-IST.dump.enc
```

A matching manifest is uploaded with the dump metadata, encryption key identifier, hashes, file size and Drive file ID. Database URLs, passwords and encryption keys are never written to the manifest.

## Why OAuth is used instead of a service account

The backup targets a normal user-owned Google Drive. The repository uses Google OAuth with the `drive.file` scope so the scheduled job uploads as the authorized human user and only accesses files/folders created through this integration. The one-time helper creates the ZOBHUNGER backup folder through the same OAuth grant.

## One-time Google configuration

1. Create or select a Google Cloud project.
2. Enable **Google Drive API**.
3. Configure the Google OAuth consent screen. For a private/internal setup, keep access restricted to the required account/test users.
4. Create an OAuth client with application type **Desktop app**.
5. Copy the client ID and client secret locally. Do not commit the downloaded credential JSON.
6. From the repository root, set the client values and run the helper:

PowerShell:

```powershell
$env:GOOGLE_DRIVE_CLIENT_ID="<desktop-oauth-client-id>"
$env:GOOGLE_DRIVE_CLIENT_SECRET="<desktop-oauth-client-secret>"
npm run backup:drive-auth
```

The helper starts a loopback callback on `127.0.0.1:53682`, prints a Google authorization URL, creates/reuses `ZOBHUNGER Database Backups` in My Drive, and prints:

```text
GOOGLE_DRIVE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=...
```

Store those values as GitHub repository secrets immediately. Do not save the refresh token in the repository or documentation.

## GitHub Actions secrets

Configure these repository secrets:

| Secret | Purpose |
|---|---|
| `BACKUP_DATABASE_URL` | Externally reachable PostgreSQL URL used only by the backup runner. For Render, use the external database URL rather than an internal-only hostname. |
| `BACKUP_ENCRYPTION_KEY_B64` | Base64-encoded 32-byte AES backup key. |
| `GOOGLE_DRIVE_CLIENT_ID` | Google OAuth Desktop client ID. |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Google OAuth Desktop client secret. |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Long-lived user OAuth refresh token from `backup:drive-auth`. |
| `GOOGLE_DRIVE_FOLDER_ID` | Folder created/reused by the OAuth helper. |

Generate the encryption key locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Store it in a password manager as well as GitHub Secrets. **Losing this key makes the encrypted backups unrecoverable.** Do not rotate it by simply replacing the secret; first preserve the previous key and its key ID until all backups encrypted by it have expired.

Optional GitHub repository variables:

| Variable | Default | Purpose |
|---|---:|---|
| `BACKUP_ENCRYPTION_KEY_ID` | `primary` | Human-readable key identifier written to backup manifests. |
| `BACKUP_RETENTION_DAYS` | `0` | `0` means no automatic deletion. A positive value deletes integration-created backup files/manifests older than this many days. |

Until a retention policy is formally agreed, leave `BACKUP_RETENTION_DAYS` unset/zero instead of automatically deleting recovery material.

## Scheduled workflow

`.github/workflows/database-backup.yml` runs only on schedule or manual dispatch. It is intentionally **not** triggered by pull requests so untrusted PR code never receives database or Drive secrets.

The job installs PostgreSQL client tools and runs:

```bash
npm run backup:database
npm run backup:verify
```

The second command re-downloads the newest Drive copy, validates its hashes, decrypts it, and asks `pg_restore --list` to parse the archive. This gives every scheduled run an immediate recoverability check without modifying a database.

A non-secret execution report is also stored as a GitHub Actions artifact for 30 days. The report includes file IDs, hashes and success/failure metadata, but not database credentials or encryption keys.

## Manual backup

With the required environment variables available locally:

```bash
npm run backup:database
```

Do not run this against production from an untrusted/shared workstation.

## Verify the latest Drive backup

Verification downloads the latest manifest and encrypted dump, verifies size + hashes, decrypts it and asks `pg_restore --list` to parse the archive:

```bash
npm run backup:verify
```

This proves that the file in Drive is downloadable, authenticated by AES-GCM, decryptable with the retained key, checksum-consistent and structurally recognized as a PostgreSQL archive.

## Isolated restore drill

A real recovery drill should restore into a separate PostgreSQL database. The helper refuses normal-looking production database names and requires explicit confirmation.

Example:

```powershell
$env:BACKUP_RESTORE_DATABASE_URL="postgresql://.../zobhunger_restore_drill"
$env:BACKUP_RESTORE_CONFIRM="RESTORE_TO_ISOLATED_DATABASE"
npm run backup:restore
```

The target database name must contain `restore`, `recovery`, `drill` or `test`. If `BACKUP_DATABASE_URL` is also present, the script additionally refuses an identical source/target host, port and database combination.

After a restore drill, verify at minimum:

- user/admin account counts;
- business and worker records;
- employee joining/compliance records;
- payment/order records;
- attendance and deployment data;
- audit/security records;
- newest expected row timestamps.

Delete the temporary restore database after verification.

## Recovery policy

Drive backup automation is an off-site logical-backup layer. It does not replace provider snapshots or point-in-time recovery. When the PostgreSQL provider supports PITR, enable it as a separate layer so recovery can target a time between the twice-daily dumps.

Recommended operational evidence:

- both daily scheduled workflows remain green;
- backup age alert if no successful backup exists for more than 14 hours;
- monthly isolated restore drill;
- quarterly review of retention and encryption-key custody;
- provider-native snapshots/PITR enabled where available.
