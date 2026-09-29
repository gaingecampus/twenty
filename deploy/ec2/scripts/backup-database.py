#!/usr/bin/env python3
"""Export the CRM database to its existing S3 bucket. No application worker needed."""
import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import tempfile
import time
import uuid
from urllib.parse import parse_qsl, unquote, urlsplit

PREFIX = 'database-backups/'
RULE_ID = 'TwentyDatabaseBackupRetention'


def read_env(path):
    result = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        key, separator, value = line.partition('=')
        if separator and re.fullmatch(r'[A-Z][A-Z0-9_]*', key):
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            result[key] = value
    return result


def settings(env_file):
    values = read_env(env_file)
    # Backup-specific overrides come from the service, not the app container.
    values.update({k: v for k, v in os.environ.items() if k.startswith('DB_BACKUP_')})
    bucket = values.get('DB_BACKUP_BUCKET') or values.get('STORAGE_S3_NAME', '')
    region = values.get('STORAGE_S3_REGION') or values.get('AWS_REGION', '')
    if not re.fullmatch(r'[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]', bucket):
        raise ValueError('Set STORAGE_S3_NAME or DB_BACKUP_BUCKET to the existing AWS S3 bucket')
    if not region:
        raise ValueError('Missing STORAGE_S3_REGION / AWS_REGION')
    if values.get('STORAGE_S3_ENDPOINT'):
        raise ValueError('This backup supports AWS S3; custom endpoints require explicit review')
    parsed = urlsplit(values.get('PG_DATABASE_URL', ''))
    if parsed.scheme not in ('postgres', 'postgresql') or not parsed.hostname or not parsed.username:
        raise ValueError('PG_DATABASE_URL must be a PostgreSQL URI')
    pg = dict(PGHOST=parsed.hostname, PGPORT=str(parsed.port or 5432),
              PGUSER=unquote(parsed.username), PGPASSWORD=unquote(parsed.password or ''),
              PGDATABASE=unquote(parsed.path.lstrip('/')),
              PGSSLMODE=values.get('PGSSLMODE') or 'require', PGCONNECT_TIMEOUT='20')
    query_keys = {'sslmode': 'PGSSLMODE', 'connect_timeout': 'PGCONNECT_TIMEOUT',
                  'application_name': 'PGAPPNAME', 'channel_binding': 'PGCHANNELBINDING'}
    for key, value in parse_qsl(parsed.query):
        if key not in query_keys:
            raise ValueError('Unsupported DB URI option; configure the backup explicitly: ' + key)
        pg[query_keys[key]] = value
    if not pg['PGDATABASE'] or any('\n' in v or '\r' in v for v in pg.values()):
        raise ValueError('Invalid database connection configuration')
    return values, bucket, region, pg


def run(command, *, timeout=7200, allow_error=False):
    env = dict(os.environ, AWS_PAGER='', AWS_RETRY_MODE='standard', AWS_MAX_ATTEMPTS='5')
    try:
        result = subprocess.run(command, capture_output=True, text=True, env=env, timeout=timeout)
    except BaseException:
        if command[:2] == ['docker', 'run'] and '--name' in command:
            subprocess.run(['docker', 'rm', '-f', command[command.index('--name') + 1]],
                           capture_output=True, timeout=30)
        raise
    if result.returncode and not allow_error:
        # No command/environment/stderr dump: these can contain database credentials.
        raise RuntimeError(command[0] + ' failed (exit ' + str(result.returncode) + ')')
    return result


def retention_rules(existing, days=30):
    rules = [r for r in existing if r.get('ID') not in (RULE_ID, RULE_ID + 'Markers')]
    rules.extend([
        {'ID': RULE_ID, 'Status': 'Enabled', 'Filter': {'Prefix': PREFIX},
         'Expiration': {'Days': days}, 'NoncurrentVersionExpiration': {'NoncurrentDays': 1},
         'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 1}},
        {'ID': RULE_ID + 'Markers', 'Status': 'Enabled', 'Filter': {'Prefix': PREFIX},
         'Expiration': {'ExpiredObjectDeleteMarker': True}},
    ])
    return rules


def configure_retention(env_file):
    _, bucket, region, _ = settings(env_file)
    aws = ['aws', '--region', region]
    result = run(aws + ['s3api', 'get-bucket-lifecycle-configuration', '--bucket', bucket], allow_error=True)
    if result.returncode:
        if 'NoSuchLifecycleConfiguration' not in result.stderr:
            raise RuntimeError('Cannot read existing S3 lifecycle rules; no rules changed')
        existing = {}
    else:
        existing = json.loads(result.stdout)
    configuration = {'Rules': retention_rules(existing.get('Rules', []))}
    with tempfile.TemporaryDirectory(prefix='crm-backup-lifecycle-') as directory:
        path = Path(directory) / 'lifecycle.json'
        path.write_text(json.dumps(configuration))
        command = aws + ['s3api', 'put-bucket-lifecycle-configuration', '--bucket', bucket,
                         '--lifecycle-configuration', 'file://' + str(path)]
        if existing.get('TransitionDefaultMinimumObjectSize'):
            command += ['--transition-default-minimum-object-size', existing['TransitionDefaultMinimumObjectSize']]
        run(command)
    verified = json.loads(run(aws + ['s3api', 'get-bucket-lifecycle-configuration', '--bucket', bucket]).stdout)
    if verified.get('Rules') != configuration['Rules']:
        raise RuntimeError('S3 lifecycle read-back differs; inspect configuration')
    print('Configured 30-day expiration only for s3://' + bucket + '/' + PREFIX, flush=True)


def record_history(base, work, state, record):
    """Keep a local fallback even if the database is unavailable; never log SQL errors."""
    local_saved = False
    try:
        history = state / 'history'
        history.mkdir(mode=0o700, exist_ok=True)
        target = history / (record['runId'] + '.json')
        temporary = target.with_suffix('.tmp')
        temporary.write_text(json.dumps(record, indent=2) + '\n')
        temporary.replace(target)
        local_saved = True
    except Exception:
        print('WARNING: Backup local history update failed for ' + record['runId'], file=sys.stderr, flush=True)
    try:
        # All values travel in a private SQL file, not shell interpolation or argv.
        payload = json.dumps(record).replace("'", "''")
        sql = work / 'history.sql'
        sql.write_text(r"""\set ON_ERROR_STOP on
SET statement_timeout = '20s';
SET lock_timeout = '5s';
CREATE SCHEMA IF NOT EXISTS backup_ops;
CREATE TABLE IF NOT EXISTS backup_ops.database_backup_runs (
  run_id text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('RUNNING','SUCCESS','FAILED')),
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  duration_ms bigint,
  file_size_bytes bigint,
  s3_path text NOT NULL,
  error_message text
);
INSERT INTO backup_ops.database_backup_runs
SELECT j->>'runId', j->>'status', (j->>'startedAt')::timestamptz,
  (j->>'completedAt')::timestamptz, (j->>'durationMs')::bigint,
  (j->>'fileSizeBytes')::bigint, j->>'s3Path', j->>'errorMessage'
FROM (SELECT '""" + payload + """'::jsonb AS j) payload
ON CONFLICT (run_id) DO UPDATE SET
 status=EXCLUDED.status, completed_at=EXCLUDED.completed_at,
 duration_ms=EXCLUDED.duration_ms, file_size_bytes=EXCLUDED.file_size_bytes,
 error_message=EXCLUDED.error_message;
""")
        sql.chmod(0o600)
        run(base + ['psql', '--no-password', '-X', '--file=/backup/history.sql'], timeout=60)
        return True
    except Exception:
        fallback = '; retained local history' if local_saved else '; local history also unavailable'
        print('WARNING: Backup history DB update failed' + fallback + ' for ' + record['runId'], file=sys.stderr, flush=True)
        return False


def backup(env_file, state_dir):
    values, bucket, region, pg = settings(env_file)
    state = Path(state_dir)
    state.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (state / 'backup.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('Another database backup is running') from None
        started = dt.datetime.now(dt.timezone.utc)
        monotonic_started = time.monotonic()
        run_id = started.strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:12]
        key = PREFIX + started.strftime('%Y/%m/%d/') + run_id
        image = values.get('DB_BACKUP_PG_IMAGE', 'postgres:18')
        container = 'twenty-database-backup-' + run_id.lower()
        with tempfile.TemporaryDirectory(prefix='run-', dir=state) as directory:
            work = Path(directory)
            credentials = work / 'pg.env'
            credentials.write_text(''.join(k + '=' + v + '\n' for k, v in pg.items()))
            credentials.chmod(0o600)
            base = ['docker', 'run', '--rm', '--name', container, '--network', values.get('DB_BACKUP_DOCKER_NETWORK', 'host'),
                    '--env-file', str(credentials), '--mount', 'type=bind,src=' + str(work.resolve()) + ',dst=/backup', image]
            dump_key = key + '/database.dump'
            record = dict(runId=run_id, status='RUNNING', startedAt=started.isoformat(),
                          completedAt=None, durationMs=None, fileSizeBytes=None,
                          s3Path='s3://' + bucket + '/' + dump_key, errorMessage=None)
            record_history(base, work, state, record)
            stage = 'database dump'
            try:
                print('Starting database export ' + run_id, flush=True)
                run(base + ['pg_dump', '--no-password', '--format=custom', '--lock-wait-timeout=30s',
                            '--file=/backup/database.dump'])
                dump = work / 'database.dump'
                if not dump.is_file() or dump.stat().st_size == 0:
                    raise RuntimeError('Database dump is empty')
                stage = 'archive validation'
                run(base + ['pg_restore', '--list', '/backup/database.dump'], timeout=300)
                # Also read every archive data block, so a truncated data section fails.
                run(base + ['pg_restore', '--file=/dev/null', '/backup/database.dump'])
                digest = hashlib.sha256()
                with dump.open('rb') as handle:
                    for chunk in iter(lambda: handle.read(1024 * 1024), b''):
                        digest.update(chunk)
                sha = digest.hexdigest()
                size = dump.stat().st_size
                record['fileSizeBytes'] = size
                aws = ['aws', '--region', region]
                stage = 'S3 dump upload'
                run(aws + ['s3', 'cp', str(dump), 's3://' + bucket + '/' + dump_key,
                           '--sse', 'AES256', '--only-show-errors', '--metadata', 'sha256=' + sha])
                stage = 'S3 upload verification'
                head = json.loads(run(aws + ['s3api', 'head-object', '--bucket', bucket, '--key', dump_key]).stdout)
                if head.get('ContentLength') != size or head.get('Metadata', {}).get('sha256') != sha:
                    raise RuntimeError('Uploaded dump verification failed; no completion manifest written')
                completed = dt.datetime.now(dt.timezone.utc).isoformat()
                manifest = dict(format='postgresql-custom', startedAt=started.isoformat(), completedAt=completed,
                                bucket=bucket, key=dump_key, bytes=size, sha256=sha, clientImage=image,
                                database=pg['PGDATABASE'], scope='single database; all schemas and data',
                                restoreNotes='Provision matching extensions and roles separately. App encryption keys and S3 files are separate.')
                manifest_path = work / 'manifest.json'
                manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
                stage = 'S3 manifest upload'
                run(aws + ['s3', 'cp', str(manifest_path), 's3://' + bucket + '/' + key + '/manifest.json',
                           '--sse', 'AES256', '--only-show-errors'])
                # A run is complete only if the manifest upload also succeeds.
                stage = 'local success record'
                status = state / 'last-success.tmp'
                status.write_text(json.dumps(manifest, indent=2) + '\n')
                status.replace(state / 'last-success.json')
                print('Backup complete: s3://' + bucket + '/' + dump_key + ' (' + str(size) + ' bytes)', flush=True)
                record['status'] = 'SUCCESS'
            except BaseException as error:
                record['status'] = 'FAILED'
                # Exception text can include credentials, argv, and customer data.
                record['errorMessage'] = stage + ' failed: ' + type(error).__name__ + '; inspect server journal'
                raise
            finally:
                record['completedAt'] = dt.datetime.now(dt.timezone.utc).isoformat()
                record['durationMs'] = round((time.monotonic() - monotonic_started) * 1000)
                record_history(base, work, state, record)



def main():
    os.umask(0o077)
    def terminated(_signum, _frame):
        raise RuntimeError('Backup interrupted')
    signal.signal(signal.SIGTERM, terminated)
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['backup', 'configure-retention', 'check'])
    parser.add_argument('--env-file', default='/opt/twenty/deploy/ec2/docker-compose.env')
    parser.add_argument('--state-dir', default='/var/lib/twenty-db-backup')
    args = parser.parse_args()
    try:
        if args.action == 'backup':
            backup(args.env_file, args.state_dir)
        elif args.action == 'configure-retention':
            configure_retention(args.env_file)
        else:
            _, bucket, region, _ = settings(args.env_file)
            print(json.dumps(dict(bucket=bucket, region=region, prefix=PREFIX, retentionDays=30)))
    except (ValueError, OSError, RuntimeError, subprocess.TimeoutExpired) as error:
        # TimeoutExpired.__str__ includes argv; only report its type.
        print('Database backup failed: ' + (type(error).__name__ if isinstance(error, subprocess.TimeoutExpired) else str(error)), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
