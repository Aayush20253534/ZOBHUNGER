# Production Checklist

## Code and CI

- [ ] `npm run verify` passes on the release revision.
- [ ] Security CI dependency/secret/CodeQL jobs are green or reviewed with documented reason.
- [ ] Frontend and backend are built from compatible revision.
- [ ] No uncommitted production-only code/config exists.

## Server configuration

- [ ] production `DATABASE_URL` points to PostgreSQL;
- [ ] `JWT_SECRET`, MFA key and HR PII key are distinct strong secrets;
- [ ] exact HTTPS `CLIENT_ORIGIN` and `PUBLIC_APP_URL` configured;
- [ ] Redis configured when enabled/provider budgets require it;
- [ ] Resend sender domain/config validated;
- [ ] Cloudinary private-storage config validated;
- [ ] malware scanner set to `clamav` or `http`;
- [ ] Cashfree uses correct sandbox/production credentials and environment;
- [ ] chatbot provider keys/models are current if enabled.

## Frontend configuration

- [ ] `NEXT_PUBLIC_DATA_MODE=api`;
- [ ] API URL includes `/api/v1` and is HTTPS in production;
- [ ] canonical site URL is correct;
- [ ] no secret is placed in `NEXT_PUBLIC_*`;
- [ ] Search Console/app-store optional values set only when valid.

## Deployment verification

- [ ] database migrations deployed;
- [ ] public health/readiness green;
- [ ] authenticated detailed health/metrics reviewed;
- [ ] business login/core portal smoke-tested;
- [ ] admin MFA and permission boundary smoke-tested;
- [ ] file upload/download and malware-scanner behavior checked;
- [ ] Resend test/live email evidence collected;
- [ ] Cashfree webhook/order reconciliation checked if payments enabled;
- [ ] real-device responsive review completed for critical flows;
- [ ] production release/check scripts pass.

## Data recovery

- [ ] GitHub backup workflow secrets are configured;
- [ ] scheduled encrypted Google Drive backups succeed at 01:00 and 13:00 IST;
- [ ] backup encryption key is held outside GitHub in a second secure location;
- [ ] latest backup passes `npm run backup:verify`;
- [ ] restore procedure has been tested in an isolated PostgreSQL database;
- [ ] provider-native snapshot/PITR policy is enabled when available.

Repository automation for twice-daily encrypted logical backups is documented in [Database backup and recovery](DATABASE_BACKUP_AND_RECOVERY.md). A successful upload is not equivalent to a tested restore.
