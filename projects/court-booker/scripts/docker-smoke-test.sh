#!/usr/bin/env bash
# Builds the Docker image, starts a container with throwaway secrets and checks /healthz and the
# login page answer, then removes it.
# Usage: scripts/docker-smoke-test.sh   (run from projects/court-booker)
set -euo pipefail

image=court-booker:smoke-test
container=court-booker-smoke-test-$$
port=${SMOKE_TEST_PORT:-18000}
base="http://127.0.0.1:$port/ai-projects/court-booker"
url="$base/healthz"

docker build --tag "$image" .
password_hash=$(openssl rand -hex 16 | docker run --rm --interactive "$image" court-booker hash-password)
trap 'docker rm --force "$container" >/dev/null' EXIT
docker run --detach --name "$container" --publish "127.0.0.1:$port:8000" \
  --env COURT_BOOKER_OPERATOR_PASSWORD_HASH="$password_hash" \
  --env COURT_BOOKER_SESSION_SECRET="$(openssl rand -hex 32)" \
  "$image" >/dev/null

for _ in $(seq 30); do
  if curl --silent --fail "$url"; then
    echo
    echo "OK: $url answered"
    # The login page proves the templates made it into the image.
    curl --silent --fail --output /dev/null "$base/login"
    echo "OK: $base/login answered"
    exit 0
  fi
  sleep 1
done

echo "FAIL: $url did not answer within 30 seconds. Container logs:" >&2
docker logs "$container" >&2
exit 1
