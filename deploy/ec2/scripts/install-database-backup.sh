#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_ENV_FILE="${DB_BACKUP_ENV_FILE:-${DEPLOY_DIR}/docker-compose.env}"
PG_IMAGE="${DB_BACKUP_PG_IMAGE:-postgres:18}"

if [[ "${EUID}" -ne 0 ]]; then
  echo 'Run this installer as root on the CRM EC2 host.' >&2
  exit 1
fi
# These values are embedded in systemd units, so accept simple absolute paths only.
if [[ ! "${BACKUP_ENV_FILE}" =~ ^/[a-zA-Z0-9_./-]+$ ]] || [[ ! "${PG_IMAGE}" =~ ^[a-zA-Z0-9_./:@-]+$ ]]; then
  echo 'Invalid environment path or PostgreSQL client image.' >&2
  exit 1
fi
for binary in python3 docker aws systemctl systemd-analyze; do
  command -v "${binary}" >/dev/null
done
test -f "${BACKUP_ENV_FILE}"
python3 "${SCRIPT_DIR}/backup-database.py" check --env-file "${BACKUP_ENV_FILE}"
systemd-analyze calendar '*-*-* 03:00:00 Asia/Seoul' >/dev/null
docker pull "${PG_IMAGE}"

install -d -m 700 /usr/local/lib/twenty-db-backup /var/lib/twenty-db-backup
install -m 700 "${SCRIPT_DIR}/backup-database.py" /usr/local/lib/twenty-db-backup/backup-database.py

cat > /etc/systemd/system/twenty-db-backup.service <<EOF
[Unit]
Description=Twenty PostgreSQL dump to existing S3 bucket
Wants=network-online.target
After=network-online.target docker.service
Requires=docker.service
StartLimitIntervalSec=21600
StartLimitBurst=3

[Service]
Type=oneshot
User=root
UMask=0077
Environment=DB_BACKUP_PG_IMAGE=${PG_IMAGE}
Environment=AWS_PAGER=
ExecStart=/usr/bin/python3 /usr/local/lib/twenty-db-backup/backup-database.py backup --env-file ${BACKUP_ENV_FILE}
TimeoutStartSec=6h
TimeoutStopSec=60
Restart=on-failure
RestartSec=15min
StandardOutput=journal
StandardError=journal
EOF

cat > /etc/systemd/system/twenty-db-backup.timer <<'EOF'
[Unit]
Description=Twenty database backup at 03:00 Asia/Seoul every day

[Timer]
OnCalendar=*-*-* 03:00:00 Asia/Seoul
Persistent=true
AccuracySec=1min
Unit=twenty-db-backup.service

[Install]
WantedBy=timers.target
EOF

systemd-analyze verify /etc/systemd/system/twenty-db-backup.service /etc/systemd/system/twenty-db-backup.timer
systemctl daemon-reload
systemctl reset-failed twenty-db-backup.service || true
# A first backup must succeed before enabling the daily timer.
systemctl start twenty-db-backup.service
systemctl enable --now twenty-db-backup.timer
systemctl list-timers twenty-db-backup.timer --no-pager
echo 'Installed daily 03:00 KST backup. Check journalctl -u twenty-db-backup.service.'
