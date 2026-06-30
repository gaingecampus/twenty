#!/usr/bin/env bash
set -euo pipefail

DOCKER_COMPOSE_VERSION="${DOCKER_COMPOSE_VERSION:-v2.36.2}"
DOCKER_CONFIG_DIR="/usr/local/lib/docker/cli-plugins"
DOCKER_COMPOSE_PATH="${DOCKER_CONFIG_DIR}/docker-compose"

retry() {
  for attempt in $(seq 1 5); do
    if "$@"; then
      return 0
    fi

    echo "Retrying command (${attempt}/5): $*" >&2
    sleep 10
  done

  return 1
}

install_packages() {
  if command -v dnf >/dev/null 2>&1; then
    retry dnf install -y awscli-2 docker jq
  else
    echo "Unsupported Linux distribution: dnf is required." >&2
    exit 1
  fi
}

ensure_docker() {
  install_packages

  systemctl enable docker
  systemctl start docker

  docker version >/dev/null
}

download_docker_compose() {
  local machine_architecture
  local compose_architecture

  machine_architecture="$(uname -m)"
  case "${machine_architecture}" in
    aarch64 | arm64)
      compose_architecture="aarch64"
      ;;
    x86_64 | amd64)
      compose_architecture="x86_64"
      ;;
    *)
      echo "Unsupported architecture for Docker Compose: ${machine_architecture}" >&2
      exit 1
      ;;
  esac

  mkdir -p "${DOCKER_CONFIG_DIR}"

  retry curl --fail --location --show-error --silent --retry 5 --retry-delay 3 \
    "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-${compose_architecture}" \
    --output "${DOCKER_COMPOSE_PATH}"

  chmod +x "${DOCKER_COMPOSE_PATH}"
}

ensure_docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    return
  fi

  if retry dnf install -y docker-compose-plugin; then
    if docker compose version >/dev/null 2>&1; then
      return
    fi
  fi

  download_docker_compose
  docker compose version >/dev/null
}

ensure_aws_identity() {
  aws sts get-caller-identity >/dev/null
}

ensure_app_directory() {
  local app_dir="${EC2_APP_DIR:-/opt/twenty/deploy/ec2}"

  mkdir -p "${app_dir}/scripts"

  if [ ! -f "${app_dir}/docker-compose.env" ]; then
    echo "Missing ${app_dir}/docker-compose.env." >&2
    echo "CloudFormation UserData should create it from Secrets Manager outputs." >&2
    exit 1
  fi
}

ensure_docker
ensure_docker_compose
ensure_aws_identity
ensure_app_directory

echo "EC2 bootstrap completed successfully."
