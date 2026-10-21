#!/usr/bin/env bash
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LIVE_DEPLOY_DIR="${LIVE_DEPLOY_DIR:?Set LIVE_DEPLOY_DIR to the existing deployment directory}"
TARGET_IMAGE="${TWENTY_IMAGE:?Set TWENTY_IMAGE to the candidate image}"
# Child scripts must use their own env files, including during rollback.
unset TWENTY_IMAGE

exec 9>"${LIVE_DEPLOY_DIR}/.deploy.lock"
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }

LIVE_ENV="${LIVE_DEPLOY_DIR}/docker-compose.env"
LIVE_COMPOSE="${LIVE_DEPLOY_DIR}/docker-compose.prod.yml"
CANDIDATE_ENV="${RELEASE_DIR}/candidate.env"
PREVIOUS_ENV="${RELEASE_DIR}/previous.env"
PREVIOUS_COMPOSE="${RELEASE_DIR}/previous-compose.yml"
test -f "${LIVE_ENV}"
test "${LIVE_DEPLOY_DIR}" != "${RELEASE_DIR}"

set_image() {
  awk -v image="$1" '
    BEGIN { updated = 0 }
    /^[[:space:]]*TWENTY_IMAGE=/ { print "TWENTY_IMAGE=" image; updated = 1; next }
    { print }
    END { if (!updated) print "TWENTY_IMAGE=" image }
  ' "$2" > "$3"
}

cp "${LIVE_ENV}" "${PREVIOUS_ENV}"
set_image "${TARGET_IMAGE}" "${LIVE_ENV}" "${CANDIDATE_ENV}"
HAS_PREVIOUS=false
if [ -f "${LIVE_COMPOSE}" ]; then
  cp "${LIVE_COMPOSE}" "${PREVIOUS_COMPOSE}"
  previous_container="$(docker compose --env-file "${LIVE_ENV}" -f "${LIVE_COMPOSE}" ps -q server)"
  if [ -n "${previous_container}" ]; then
    previous_image="$(docker inspect --format '{{.Image}}' "${previous_container}")"
    rollback_image="twenty-rollback:$(basename "${RELEASE_DIR}")"
    docker tag "${previous_image}" "${rollback_image}"
    set_image "${rollback_image}" "${LIVE_ENV}" "${PREVIOUS_ENV}"
    HAS_PREVIOUS=true
  fi
fi

SWITCH_STARTED=false
COMMITTED=false
finish() {
  result=$?
  trap - EXIT INT TERM
  if [ "${result}" -ne 0 ] && [ "${COMMITTED}" = false ]; then
    if [ "${SWITCH_STARTED}" = true ] && [ "${HAS_PREVIOUS}" = true ]; then
      echo 'Candidate failed. Restoring the previous image and compose configuration.' >&2
      # Older releases only have /healthz. Their original compose healthcheck is retained.
      rollback_health_path=/healthz
      if grep -q '/healthz/ready' "${PREVIOUS_COMPOSE}"; then
        rollback_health_path=/healthz/ready
      fi
      if ENV_FILE="${PREVIOUS_ENV}" COMPOSE_FILE="${PREVIOUS_COMPOSE}" \
        HEALTH_PATH="${rollback_health_path}" bash "${SCRIPT_DIR}/deploy-on-ec2.sh"; then
        cp "${PREVIOUS_ENV}" "${LIVE_ENV}"
        cp "${PREVIOUS_COMPOSE}" "${LIVE_COMPOSE}"
        echo 'Previous release restored. Database migrations were not reversed.' >&2
      else
        echo "ROLLBACK FAILED. Recovery files: ${RELEASE_DIR}" >&2
      fi
    elif [ "${SWITCH_STARTED}" = false ]; then
      echo 'Deployment aborted before switching containers; previous release is retained.' >&2
    else
      echo "Initial deployment failed; no previous running release is available. Inspect ${RELEASE_DIR}." >&2
    fi
  fi
  exit "${result}"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

ENV_FILE="${CANDIDATE_ENV}" bash "${SCRIPT_DIR}/run-upgrade.sh"
SWITCH_STARTED=true
ENV_FILE="${CANDIDATE_ENV}" COMPOSE_FILE="${RELEASE_DIR}/docker-compose.prod.yml" \
  bash "${SCRIPT_DIR}/deploy-on-ec2.sh"

# Promote configuration only after application readiness succeeds.
cp "${CANDIDATE_ENV}" "${LIVE_ENV}"
cp "${RELEASE_DIR}/docker-compose.prod.yml" "${LIVE_COMPOSE}"
mkdir -p "${LIVE_DEPLOY_DIR}/scripts"
for script in run-upgrade.sh deploy-on-ec2.sh check-deployment-dependencies.cjs \
  bootstrap-ec2.sh build-and-push.sh backup-database.py install-database-backup.sh; do
  cp "${SCRIPT_DIR}/${script}" "${LIVE_DEPLOY_DIR}/scripts/${script}"
done
COMMITTED=true
echo "Deployment committed. Previous configuration retained in ${RELEASE_DIR}"
