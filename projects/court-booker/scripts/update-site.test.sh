#!/usr/bin/env bash
# Checks that deploy/update-site.sh starts the container with the deploy settings of the commit it
# deploys, not those of the checkout it was started from. Runs against a throwaway git repo and a
# fake docker that records its commands, so it needs neither Docker nor the network.
# Usage: scripts/update-site.test.sh   (run from projects/court-booker)
set -euo pipefail

project=$PWD
work=$(mktemp -d)
trap 'rm -r "$work"' EXIT

# A repo whose main moves on from the commit the server has checked out, changing the data mount.
git init --quiet --initial-branch=main "$work/origin"
mkdir -p "$work/origin/projects/court-booker"
cp -r "$project/deploy" "$work/origin/projects/court-booker/"
git -C "$work/origin" add .
git -C "$work/origin" -c user.name=test -c user.email=test@example.com commit --quiet -m old
git clone --quiet "$work/origin" "$work/src"
sed -i 's|^DATA_MOUNT=.*|DATA_MOUNT=/new-mount|' "$work/origin/projects/court-booker/deploy/settings.sh"
git -C "$work/origin" -c user.name=test -c user.email=test@example.com commit --quiet -am new

# The fake docker: every container counts as healthy, no court-booker container is running yet.
mkdir "$work/bin"
cat >"$work/bin/docker" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$DOCKER_LOG"
EOF
chmod +x "$work/bin/docker"

mkdir "$work/data"
touch "$work/env"
PATH="$work/bin:$PATH" DOCKER_LOG="$work/docker.log" \
  COURT_BOOKER_REPO_URL="$work/origin" COURT_BOOKER_SRC_DIR="$work/src" \
  COURT_BOOKER_ENV_FILE="$work/env" COURT_BOOKER_DATA_DIR="$work/data" \
  "$work/src/projects/court-booker/deploy/update-site.sh" 2>"$work/deploy.log" || {
  echo "FAIL: update-site.sh failed:" >&2
  cat "$work/deploy.log" >&2
  exit 1
}

if ! grep -q -- "--volume $work/data:/new-mount " "$work/docker.log"; then
  echo "FAIL: the container wasn't started with the deployed commit's data mount. docker calls:" >&2
  cat "$work/docker.log" >&2
  exit 1
fi
echo "OK: update-site.sh used the deploy settings of the commit it deployed"
