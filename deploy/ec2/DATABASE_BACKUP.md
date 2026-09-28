# PostgreSQL daily S3 backups

Schedule: **03:00 Asia/Seoul every day**, independent of the CRM worker. Destination: the existing `STORAGE_S3_NAME` bucket, under **`database-backups/`**. Retention: current objects expire after 30 days; expired noncurrent versions are removed after one further day. S3 lifecycle processing is asynchronous. Other prefixes and existing lifecycle rules are preserved by the configuration command.

## What is backed up

`pg_dump --format=custom` exports the entire configured `PG_DATABASE_URL` database, including core metadata and all workspace schemas/data. Every completed run has:

```text
database-backups/YYYY/MM/DD/<UTC timestamp>-<unique suffix>/database.dump
database-backups/YYYY/MM/DD/<UTC timestamp>-<unique suffix>/manifest.json
```

The manifest is uploaded **last**. A dump without its manifest is not a completed backup. Dumps use S3 SSE-S3 encryption. The runner checks archive readability, decompresses all archive sections, calculates SHA-256, uploads, and checks object size and checksum metadata before publishing the completion manifest. SHA-256 must also be checked after downloading for restore; checking metadata alone is not a full remote read-back.

The batch does not back up PostgreSQL cluster roles, external S3 attachments, or Secrets Manager values. Preserve the application encryption keys separately: restoring DB rows alone does not recover encrypted integration credentials. Keep RDS native backup/PITR in place; these exports complement it.

## Prerequisites

- Run on the Linux CRM EC2 host with Docker, Python 3, AWS CLI v2 and systemd.
- Existing server environment file supplies `PG_DATABASE_URL`, `PGSSLMODE`, `STORAGE_S3_NAME` and `STORAGE_S3_REGION`/`AWS_REGION`. The file is parsed as data, never sourced as shell code. If storage settings override the environment in the admin panel, verify the effective bucket and provide `DB_BACKUP_BUCKET` explicitly.
- The EC2 instance role requires `s3:PutObject`, `s3:GetObject` (HeadObject verification), and `s3:AbortMultipartUpload` for `<existing-bucket>/database-backups/*`. No static AWS access key is needed. Existing runtime role already grants GetObject/PutObject on the files bucket; add AbortMultipartUpload for the backup prefix if missing.
- Configuring retention additionally needs `s3:GetLifecycleConfiguration` and `s3:PutLifecycleConfiguration` on the existing bucket. These are setup permissions, not required for normal backup runs.
- Default client is `postgres:18`. pg_dump refuses a newer server major version; set `DB_BACKUP_PG_IMAGE` to a suitable tested image (or immutable digest) before installation. The first run validates compatibility. No production version is assumed to have been verified locally.
- Have enough free disk for one compressed full dump. Successful and normally failed runs remove temporary archives and credential files. Inspect `/var/lib/twenty-db-backup/run-*` after a host crash or forced kill.

## Install using the existing GitHub deployment identity

After this change is merged, open **Actions → Database Backup → Run workflow**, choose the environment already serving the CRM, and select `install`. This workflow uses the same GitHub Environment AWS role and EC2 target as Deploy EC2; it does not redeploy the application. It copies the scripts, merges S3 retention, runs the first backup and enables the timer. Use `status` to inspect or `run` for an extra backup. The environment name alone is not proof of production: confirm its EC2 target matches the existing CRM deployment.

The EC2 instance role must have the one-time lifecycle setup permissions listed above for `install`. An S3 connection used by the application does not imply permission to change lifecycle rules. An IAM administrator must add those setup permissions if missing; the install stops on AccessDenied and does not enable the timer. After setup, lifecycle write permission can be removed. Normal backup operations still use the existing EC2 instance role.

## Installation on the existing server

Copy `backup-database.py` and `install-database-backup.sh` into `/opt/twenty/deploy/ec2/scripts/`. The ordinary app deployment does not enable this timer automatically.

First use an authorized setup identity to merge the retention rules. The command refuses to write if reading the current policy fails. Avoid concurrent lifecycle edits while running it.

```bash
cd /opt/twenty/deploy/ec2
sudo python3 scripts/backup-database.py check --env-file docker-compose.env
sudo python3 scripts/backup-database.py configure-retention --env-file docker-compose.env
sudo bash scripts/install-database-backup.sh
```

The installer installs a stable copy under `/usr/local/lib/twenty-db-backup/`, runs a backup immediately, and enables the timer only after the first run succeeds. If the instance role lacks lifecycle setup permission, apply the prefix rules using an authorized administrator first; do not grant the app broader S3 access just to run nightly backups.

Overrides: `DB_BACKUP_ENV_FILE` selects the server env file for installation; `DB_BACKUP_PG_IMAGE` selects the PostgreSQL client. `DB_BACKUP_BUCKET` can override the bucket via a systemd service environment override. The existing S3 bucket should remain the default. `DB_BACKUP_DOCKER_NETWORK=bridge` is available for isolated local tests; EC2 defaults to host networking.

The service retries on failure after 15 minutes, at most three starts per six-hour window. It writes logs to journald and exits nonzero on failure. `Persistent=true` catches up a missed scheduled run after the host returns. This does not provide an off-host alert if the entire EC2 host is down.

```bash
systemctl list-timers twenty-db-backup.timer --no-pager
systemctl status twenty-db-backup.service --no-pager
journalctl -u twenty-db-backup.service --since yesterday --no-pager
sudo cat /var/lib/twenty-db-backup/last-success.json
```

To stop future runs without deleting backups:

```bash
sudo systemctl disable --now twenty-db-backup.timer
```

## Restore drill (always an isolated database first)

1. Select a run with a `manifest.json`. Download both files using an authorized S3 identity.
2. Compare the downloaded dump's SHA-256 and byte size against the manifest.
3. Provision an empty test database with the required PostgreSQL extensions. Use a compatible pg_restore client and target server.
4. Restore with `pg_restore --exit-on-error --no-owner --no-acl --dbname=<isolated-db> database.dump`. Configure credentials through protected environment/service files, not pasted command arguments. Never add `--clean` against the live CRM database.
5. Check schema/table counts, workspace/customer/contract records and application reads. Do not start workers or outbound integrations on restored production data until isolated.

## Validation

```bash
python3 -m unittest discover -s deploy/ec2/scripts -p 'test_database_backup.py' -v
bash -n deploy/ec2/scripts/install-database-backup.sh
```

Unit coverage includes failed dumps, failed uploads/verification, failed manifest upload, credential handling, lifecycle rule merging, and lifecycle AccessDenied. Actual S3 upload and Linux timer behavior must be verified on the deployment host; mock success is not production activation.

References: [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [S3 lifecycle configurations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-configuration-examples.html).
