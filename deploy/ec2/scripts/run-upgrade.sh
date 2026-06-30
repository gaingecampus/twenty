#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

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

if [ ! -f "${ENV_FILE}" ]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

TWENTY_IMAGE="${TWENTY_IMAGE:-$(read_env_value TWENTY_IMAGE)}"
PG_DATABASE_URL="${PG_DATABASE_URL:-$(read_env_value PG_DATABASE_URL)}"
REDIS_URL="${REDIS_URL:-$(read_env_value REDIS_URL)}"
AWS_REGION="${AWS_REGION:-$(read_env_value AWS_REGION)}"
PG_SSL_ALLOW_SELF_SIGNED="${PG_SSL_ALLOW_SELF_SIGNED:-$(read_env_value PG_SSL_ALLOW_SELF_SIGNED)}"
PGSSLMODE="${PGSSLMODE:-$(read_env_value PGSSLMODE)}"
PULL_IMAGE="${PULL_IMAGE:-$(read_env_value PULL_IMAGE)}"
PG_SSL_ALLOW_SELF_SIGNED="${PG_SSL_ALLOW_SELF_SIGNED:-true}"
PGSSLMODE="${PGSSLMODE:-require}"
PULL_IMAGE="${PULL_IMAGE:-true}"

normalize_pg_database_url_for_self_signed_ssl() {
  if [ "${PG_SSL_ALLOW_SELF_SIGNED}" != "true" ]; then
    return
  fi

  if [[ "${PG_DATABASE_URL}" != *"sslmode=require"* ]]; then
    return
  fi

  PG_DATABASE_URL="${PG_DATABASE_URL//\?sslmode=require&/?}"
  PG_DATABASE_URL="${PG_DATABASE_URL//&sslmode=require&/&}"
  PG_DATABASE_URL="${PG_DATABASE_URL//\?sslmode=require/}"
  PG_DATABASE_URL="${PG_DATABASE_URL//&sslmode=require/}"

  local tmp_file
  tmp_file="$(mktemp)"

  awk -v database_url="${PG_DATABASE_URL}" '
    BEGIN { updated = 0 }
    /^PG_DATABASE_URL=/ {
      print "PG_DATABASE_URL=" database_url
      updated = 1
      next
    }
    { print }
    END {
      if (updated == 0) {
        print "PG_DATABASE_URL=" database_url
      }
    }
  ' "${ENV_FILE}" >"${tmp_file}"

  mv "${tmp_file}" "${ENV_FILE}"
}

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

missing_env_vars=()

for env_var_name in TWENTY_IMAGE PG_DATABASE_URL REDIS_URL; do
  if [ -z "${!env_var_name:-}" ]; then
    missing_env_vars+=("${env_var_name}")
  fi
done

if [ "${#missing_env_vars[@]}" -gt 0 ]; then
  echo "Missing required env var(s) in ${ENV_FILE}: ${missing_env_vars[*]}" >&2
  echo "Use ${DEPLOY_DIR}/docker-compose.env.example as a template." >&2
  exit 1
fi

normalize_pg_database_url_for_self_signed_ssl

if [ -n "${AWS_REGION:-}" ]; then
  ECR_REGISTRY="${TWENTY_IMAGE%%/*}"
  aws ecr get-login-password --region "${AWS_REGION}" |
    docker login --username AWS --password-stdin "${ECR_REGISTRY}"
fi

if [ "${PULL_IMAGE}" = "true" ]; then
  cleanup_docker_disk_usage
  docker pull "${TWENTY_IMAGE}"
elif ! docker image inspect "${TWENTY_IMAGE}" >/dev/null 2>&1; then
  echo "Docker image not found locally: ${TWENTY_IMAGE}" >&2
  echo "Set PULL_IMAGE=true with a pushed image URI, or run the deploy workflow first." >&2
  exit 1
fi

docker run --rm \
  --env-file "${ENV_FILE}" \
  -e DISABLE_DB_MIGRATIONS=true \
  -e DISABLE_CRON_JOBS_REGISTRATION=true \
  -e PG_SSL_ALLOW_SELF_SIGNED="${PG_SSL_ALLOW_SELF_SIGNED}" \
  -e PGSSLMODE="${PGSSLMODE}" \
  "${TWENTY_IMAGE}" \
  sh -lc '
    set -e

    has_schema="$(psql -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = '\''core'\'')" "${PG_DATABASE_URL}" | tr -d "[:space:]")"

    if [ "${has_schema}" = "f" ]; then
      echo "Database appears empty. Running initial setup..."
      yarn database:init:prod
    else
      echo "Database already initialized. Running migrations..."
      yarn database:migrate:prod --force --include-slow
    fi

    yarn command:prod cache:flush
    yarn command:prod upgrade
    yarn command:prod cron:register:all
    yarn command:prod cache:flush
  '

echo "Database upgrade and cron registration completed."
