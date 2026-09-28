import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('backup', Path(__file__).with_name('backup-database.py'))
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.env = self.root / 'app.env'
        self.env.write_text('PG_DATABASE_URL=postgres://user:p%40ss@localhost:5432/crm\n'
                            'PGSSLMODE=disable\nSTORAGE_S3_NAME=crm-test-bucket\nSTORAGE_S3_REGION=ap-northeast-2\n')

    def test_credentials_parsed_without_shell_execution(self):
        _, bucket, _, pg = backup.settings(self.env)
        self.assertEqual(pg['PGPASSWORD'], 'p@ss')
        self.assertEqual(bucket, 'crm-test-bucket')

    def test_retention_preserves_unrelated_rules_and_is_idempotent(self):
        attachment = {'ID': 'attachments', 'Status': 'Enabled', 'Filter': {'Prefix': 'files/'}}
        merged = backup.retention_rules([attachment])
        self.assertEqual(merged[0], attachment)
        self.assertEqual(backup.retention_rules(merged), merged)
        self.assertEqual(merged[1]['Expiration']['Days'], 30)
        self.assertEqual(merged[1]['NoncurrentVersionExpiration']['NoncurrentDays'], 1)
        self.assertEqual(merged[1]['Filter']['Prefix'], 'database-backups/')

    def test_cannot_read_lifecycle_never_overwrites_it(self):
        error = subprocess.CompletedProcess([], 1, '', 'AccessDenied')
        with patch.object(backup, 'run', return_value=error) as run:
            with self.assertRaisesRegex(RuntimeError, 'no rules changed'):
                backup.configure_retention(self.env)
            self.assertEqual(run.call_count, 1)

    def scenario(self, fail=None, corrupt_head=False):
        calls = []
        def run(command, **kwargs):
            calls.append(command)
            if 'pg_dump' in command:
                if fail == 'dump':
                    raise RuntimeError('dump failed')
                mount = command[command.index('--mount') + 1]
                directory = mount.split('src=', 1)[1].split(',dst=')[0]
                (Path(directory) / 'database.dump').write_bytes(b'fake archive')
            if 's3' in command and 'cp' in command and command[command.index('cp') + 1].endswith('database.dump') and fail == 'upload':
                raise RuntimeError('upload failed')
            if 'head-object' in command:
                import hashlib
                return subprocess.CompletedProcess(command, 0, json.dumps({
                    'ContentLength': 0 if corrupt_head else 12,
                    'Metadata': {'sha256': hashlib.sha256(b'fake archive').hexdigest()}}), '')
            if 's3' in command and 'cp' in command and command[command.index('cp') + 1].endswith('manifest.json') and fail == 'manifest':
                raise RuntimeError('manifest failed')
            return subprocess.CompletedProcess(command, 0, '', '')
        return calls, run

    def test_success_marks_only_after_dump_and_manifest_upload(self):
        calls, runner = self.scenario()
        with patch.object(backup, 'run', side_effect=runner):
            backup.backup(self.env, self.root / 'state')
        result = json.loads((self.root / 'state/last-success.json').read_text())
        self.assertEqual(result['bytes'], 12)
        self.assertIn('/manifest.json', ' '.join(calls[-1]))
        self.assertNotIn('p@ss', repr(calls))
        self.assertNotIn('postgres://', repr(calls))
        self.assertEqual(list((self.root / 'state').glob('run-*')), [])

    def test_dump_failure_never_uploads(self):
        calls, runner = self.scenario(fail='dump')
        with patch.object(backup, 'run', side_effect=runner):
            with self.assertRaises(RuntimeError):
                backup.backup(self.env, self.root / 'state')
        self.assertFalse(any('s3' in c for c in calls))
        self.assertFalse((self.root / 'state/last-success.json').exists())

    def test_bad_upload_or_failed_manifest_never_marks_success(self):
        for failure, corrupt in [(None, True), ('manifest', False), ('upload', False)]:
            calls, runner = self.scenario(fail=failure, corrupt_head=corrupt)
            with patch.object(backup, 'run', side_effect=runner):
                with self.assertRaises(RuntimeError):
                    backup.backup(self.env, self.root / 'state')
            self.assertFalse((self.root / 'state/last-success.json').exists())
            self.assertEqual(list((self.root / 'state').glob('run-*')), [])


if __name__ == '__main__':
    unittest.main()
