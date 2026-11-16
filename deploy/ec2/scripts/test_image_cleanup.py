"""Check deployment cleanup without accessing a Docker daemon."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parent
DOCKER = '''#!/bin/bash
case "$*" in
  'ps --all --quiet') echo container ;;
  'inspect --format {{.Image}} container') echo sha256:running ;;
  'image ls --no-trunc --format {{.ID}} {{.Repository}}:{{.Tag}}')
    printf '%s\\n' 'sha256:running registry/app:old' 'sha256:running twenty-rollback:current-running' 'sha256:previous twenty-rollback:protected' 'sha256:old registry/app:obsolete' 'sha256:rollback twenty-rollback:obsolete' 'sha256:new registry/app:new' 'sha256:other other/app:old' ;;
  'image rm '*) echo "$*" >> "$CALLS" ;;
esac
'''


class ImageCleanupTest(unittest.TestCase):
    def test_only_obsolete_deployment_images_are_removed(self):
        for name in ['run-upgrade.sh', 'deploy-on-ec2.sh']:
            with self.subTest(script=name), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                docker = root / 'docker'
                docker.write_text(DOCKER)
                docker.chmod(0o755)
                calls = root / 'calls'
                calls.touch()
                source = (SCRIPTS / name).read_text()
                function = source.split('cleanup_docker_disk_usage() {', 1)[1].split('\n}', 1)[0]
                result = subprocess.run(
                    ['bash', '-euc', 'cleanup_docker_disk_usage() {' + function + '\n}\ncleanup_docker_disk_usage'],
                    env={**os.environ, 'PATH': f'{root}:{os.environ["PATH"]}', 'CALLS': str(calls), 'TWENTY_IMAGE': 'registry/app:new', 'PROTECTED_ROLLBACK_IMAGE': 'twenty-rollback:protected'},
                    capture_output=True, text=True,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(calls.read_text().splitlines(), [
                    'image rm registry/app:obsolete',
                    'image rm twenty-rollback:obsolete',
                ])


if __name__ == '__main__':
    unittest.main()
