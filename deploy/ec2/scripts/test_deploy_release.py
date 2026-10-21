"""Failure injection tests; no Docker daemon, AWS, or production access."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parent

DOCKER = r'''#!/usr/bin/env python3
import os, pathlib, sys
args = sys.argv[1:]
root = pathlib.Path(os.environ['TEST_ROOT'])
def log(value):
    with (root / 'calls').open('a') as output:
        output.write(value + '\n')
def env_image(path):
    return next(line.split('=', 1)[1] for line in pathlib.Path(path).read_text().splitlines() if line.startswith('TWENTY_IMAGE='))
if args[0] == 'compose':
    image = env_image(args[args.index('--env-file') + 1])
    if 'ps' in args:
        print('worker-id' if args[-1] == 'worker' else 'old-server')
    if 'up' in args:
        log('up ' + image)
        (root / 'running').write_text(image)
        if image == 'candidate:new' and os.getenv('FAIL_START'):
            sys.exit(1)
        if image.startswith('twenty-rollback:') and os.getenv('FAIL_ROLLBACK'):
            sys.exit(1)
elif args[0] == 'inspect':
    if args[-1] == 'worker-id':
        image = (root / 'running').read_text()
        print('exited' if image == 'candidate:new' and os.getenv('FAIL_WORKER') else 'running')
    else:
        print('sha256:actual-running-image')
elif args[0] == 'tag':
    log('tag ' + args[1])
elif args[0] == 'run':
    if '--entrypoint' in args:
        sys.stdin.read()
        log('preflight')
        if os.getenv('FAIL_PREFLIGHT'):
            sys.exit(1)
    else:
        log('upgrade')
        if os.getenv('FAIL_UPGRADE'):
            sys.exit(1)
'''
CURL = r'''#!/usr/bin/env python3
import os, pathlib
image = (pathlib.Path(os.environ['TEST_ROOT']) / 'running').read_text()
print('503' if image == 'candidate:new' and os.getenv('FAIL_HEALTH') else '200', end='')
'''


class DeployReleaseTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.live = self.root / 'live'
        self.release = self.live / 'releases' / '101-1'
        shutil.copytree(SCRIPTS, self.release / 'scripts', ignore=shutil.ignore_patterns('__pycache__'))
        self.live_env = self.live / 'docker-compose.env'
        self.original_env = 'TWENTY_IMAGE=stale:env\nPG_DATABASE_URL=postgres://localhost/db\nREDIS_URL=redis://localhost\n'
        self.live_env.write_text(self.original_env)
        (self.live / 'docker-compose.prod.yml').write_text('previous compose')
        (self.release / 'docker-compose.prod.yml').write_text('candidate compose')
        (self.root / 'running').write_text('old:running')
        (self.root / 'calls').touch()
        binaries = self.root / 'bin'
        binaries.mkdir()
        for name, content in {'docker': DOCKER, 'curl': CURL, 'sleep': '#!/bin/sh\nexit 0\n', 'flock': '#!/bin/sh\n[ -z "$FAIL_LOCK" ]\n'}.items():
            binary = binaries / name
            binary.write_text(content)
            binary.chmod(0o755)
        self.environment = {**os.environ, 'PATH': f'{binaries}:{os.environ["PATH"]}', 'TEST_ROOT': str(self.root), 'LIVE_DEPLOY_DIR': str(self.live), 'TWENTY_IMAGE': 'candidate:new', 'PULL_IMAGE': 'false', 'AWS_REGION': ''}

    def deploy(self, **failures):
        return subprocess.run(['bash', str(self.release / 'scripts/deploy-release.sh')], env={**self.environment, **failures}, capture_output=True, text=True, timeout=30)

    def calls(self):
        return (self.root / 'calls').read_text()

    def test_success_promotes_only_after_upgrade_and_start(self):
        result = self.deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('preflight\nupgrade\nup candidate:new', self.calls())
        self.assertIn('TWENTY_IMAGE=candidate:new', self.live_env.read_text())
        self.assertEqual((self.live / 'docker-compose.prod.yml').read_text(), 'candidate compose')
        self.assertEqual((self.release / 'candidate.env').stat().st_mode & 0o777, 0o600)
        self.assertIn('tag sha256:actual-running-image', self.calls())

    def test_preflight_failure_does_not_migrate_or_replace_production(self):
        result = self.deploy(FAIL_PREFLIGHT='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('upgrade', self.calls())
        self.assertNotIn('up ', self.calls())
        self.assertEqual(self.live_env.read_text(), self.original_env)

    def test_upgrade_failure_keeps_previous_containers_and_config(self):
        result = self.deploy(FAIL_UPGRADE='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('up ', self.calls())
        self.assertEqual(self.live_env.read_text(), self.original_env)
        self.assertEqual((self.live / 'docker-compose.prod.yml').read_text(), 'previous compose')

    def test_start_or_readiness_or_worker_failure_restores_actual_previous_image(self):
        for failure in ['FAIL_START', 'FAIL_HEALTH', 'FAIL_WORKER']:
            with self.subTest(failure=failure):
                result = self.deploy(**{failure: '1'})
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('up twenty-rollback:101-1', self.calls())
                self.assertIn('TWENTY_IMAGE=twenty-rollback:101-1', self.live_env.read_text())
                self.assertEqual((self.live / 'docker-compose.prod.yml').read_text(), 'previous compose')
                self.assertIn('Previous release restored', result.stderr)

    def test_failed_rollback_is_reported_as_failure(self):
        result = self.deploy(FAIL_START='1', FAIL_ROLLBACK='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('ROLLBACK FAILED', result.stderr)

    def test_concurrent_deployment_is_rejected_before_mutation(self):
        result = self.deploy(FAIL_LOCK='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.calls(), '')
        self.assertEqual(self.live_env.read_text(), self.original_env)


if __name__ == '__main__':
    unittest.main()
