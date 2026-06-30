#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

COMPOSE_FILE="${COMPOSE_FILE:-${DEPLOY_DIR}/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-${DEPLOY_DIR}/docker-compose.env}"

read_env_value() {
  local env_var_name="$1"

  awk -v key="${env_var_name}" '
    /^[[:space:]]*#/ || /^[[:space:]]*$/ { next }
    {
      line = $0
      sub(/^[[:space:]]*/, "", line)
      if (index(line, key "=") == 1) {
        print substr(line, length(key) + 2)
        exit
      }
    }
  ' "${ENV_FILE}"
}

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Missing compose file: ${COMPOSE_FILE}" >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

TWENTY_IMAGE="${TWENTY_IMAGE:-$(read_env_value TWENTY_IMAGE)}"
AWS_REGION="${AWS_REGION:-$(read_env_value AWS_REGION)}"
TWENTY_HOST_PORT="${TWENTY_HOST_PORT:-$(read_env_value TWENTY_HOST_PORT)}"
TWENTY_HOST_PORT="${TWENTY_HOST_PORT:-3000}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${TWENTY_HOST_PORT}/healthz}"

: "${TWENTY_IMAGE:?Set TWENTY_IMAGE in ${ENV_FILE}}"

cleanup_docker_disk_usage() {
  echo "Docker disk usage before cleanup:"
  docker system df || true

  docker container prune --force
  docker image prune --all --force
  docker builder prune --all --force

  echo "Docker disk usage after cleanup:"
  docker system df || true
  df -h /
}

if [ -n "${AWS_REGION:-}" ]; then
  ECR_REGISTRY="${TWENTY_IMAGE%%/*}"
  aws ecr get-login-password --region "${AWS_REGION}" |
    docker login --username AWS --password-stdin "${ECR_REGISTRY}"
fi

if docker image inspect "${TWENTY_IMAGE}" >/dev/null 2>&1; then
  echo "Docker image already exists locally: ${TWENTY_IMAGE}"
else
  cleanup_docker_disk_usage
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" pull
fi

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --remove-orphans

for attempt in $(seq 1 60); do
  status="$(curl -s -o /dev/null -w '%{http_code}' "${HEALTH_URL}" || true)"

  if [ "${status}" = "200" ]; then
    echo "Twenty is healthy at ${HEALTH_URL}"
    exit 0
  fi

  echo "Waiting for Twenty health check (${attempt}/60, HTTP ${status})"
  sleep 5
done

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs --tail=200 server
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs --tail=200 worker
echo "Twenty did not become healthy at ${HEALTH_URL}" >&2
exit 1
