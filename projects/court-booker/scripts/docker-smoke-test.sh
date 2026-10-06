#!/usr/bin/env bash
# Builds the Docker image, starts a container with throwaway secrets and a throwaway data folder
# mounted as the deploy mounts it, checks /healthz and the login page answer and that the database
# was written to the data folder, then removes it.
# Usage: scripts/docker-smoke-test.sh   (run from projects/court-booker)
set -euo pipefail

# shellcheck source=deploy/settings.sh
source deploy/settings.sh

image=court-booker:smoke-test
container=court-booker-smoke-test-$$
port=${SMOKE_TEST_PORT:-18000}
base="http://127.0.0.1:$port/ai-projects/court-booker"
url="$base/healthz"

docker build --tag "$image" .
password_hash=$(openssl rand -hex 16 | docker run --rm --interactive "$image" court-booker hash-password)
data_dir=$(mktemp -d)
trap 'docker rm --force "$container" >/dev/null; rm -r "$data_dir"' EXIT
# Same user and mount as deploy/settings.sh, so a database that isn't kept across deploys fails here.
docker run --detach --name "$container" --publish "127.0.0.1:$port:8000" \
  --user "$(id -u):$(id -g)" --env HOME=/tmp \
  --volume "$data_dir:$DATA_MOUNT" \
  --env COURT_BOOKER_OPERATOR_PASSWORD_HASH="$password_hash" \
  --env COURT_BOOKER_SESSION_SECRET="$(openssl rand -hex 32)" \
  --env COURT_BOOKER_PROFILE_KEY="$(openssl rand -base64 32 | tr "+/" "-_")" \
  "$image" >/dev/null

for _ in $(seq 30); do
  if curl --silent --fail "$url"; then
    echo
    echo "OK: $url answered"
    # The login page proves the templates made it into the image.
    curl --silent --fail --output /dev/null "$base/login"
    echo "OK: $base/login answered"
    if [ ! -f "$data_dir/court-booker.sqlite3" ]; then
      echo "FAIL: the database isn't in the data folder mounted at $DATA_MOUNT, so a redeploy would lose it" >&2
      exit 1
    fi
    echo "OK: the database is in the data folder"
    exit 0
  fi
  sleep 1
done

echo "FAIL: $url did not answer within 30 seconds. Container logs:" >&2
docker logs "$container" >&2
exit 1
