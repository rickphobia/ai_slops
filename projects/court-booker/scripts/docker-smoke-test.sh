#!/usr/bin/env bash
# Builds the Docker image, starts a container and checks /healthz answers, then removes it.
# Usage: scripts/docker-smoke-test.sh   (run from projects/court-booker)
set -euo pipefail

image=court-booker:smoke-test
container=court-booker-smoke-test-$$
port=${SMOKE_TEST_PORT:-18000}
url="http://127.0.0.1:$port/ai-projects/court-booker/healthz"

docker build --tag "$image" .
trap 'docker rm --force "$container" >/dev/null' EXIT
docker run --detach --name "$container" --publish "127.0.0.1:$port:8000" "$image" >/dev/null

for _ in $(seq 30); do
  if curl --silent --fail "$url"; then
    echo
    echo "OK: $url answered"
    exit 0
  fi
  sleep 1
done

echo "FAIL: $url did not answer within 30 seconds. Container logs:" >&2
docker logs "$container" >&2
exit 1
