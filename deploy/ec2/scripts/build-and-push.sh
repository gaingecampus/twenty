#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?Set AWS_REGION, for example ap-northeast-2}"
: "${ECR_REPOSITORY:?Set ECR_REPOSITORY, for example twenty-prod}"

IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short=12 HEAD)}"
APP_VERSION="${APP_VERSION:-0.0.0+${IMAGE_TAG//[^0-9A-Za-z-]/-}}"
DOCKER_TARGET="${DOCKER_TARGET:-twenty-aws}"
DOCKERFILE="${DOCKERFILE:-packages/twenty-docker/twenty/Dockerfile}"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
LATEST_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"

aws ecr describe-repositories \
  --repository-names "${ECR_REPOSITORY}" \
  --region "${AWS_REGION}" >/dev/null

aws ecr get-login-password --region "${AWS_REGION}" |
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

docker build \
  --file "${DOCKERFILE}" \
  --target "${DOCKER_TARGET}" \
  --build-arg "APP_VERSION=${APP_VERSION}" \
  --tag "${IMAGE_URI}" \
  --tag "${LATEST_URI}" \
  .

docker push "${IMAGE_URI}"
docker push "${LATEST_URI}"

echo "Pushed ${IMAGE_URI}"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "image_uri=${IMAGE_URI}"
    echo "image_tag=${IMAGE_TAG}"
  } >>"${GITHUB_OUTPUT}"
fi
