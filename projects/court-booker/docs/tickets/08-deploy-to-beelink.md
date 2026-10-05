# 08: Deploy to the Beelink

**What to build:** The owner runs one script on the Beelink to build `main` into a Docker image and swap the running court-booker container, keeping the old one if the new one fails `/healthz`, and one script to roll back. The README explains the one-time setup: the env file, the data folder, the nginx proxy entry and the Uptime Kuma check. Spec user stories 50–53.

**Blocked by:** 01 (Walking skeleton)

**Status:** ready

**Touches:** deploy, README

**Effort:** low

- [ ] `deploy/update-site.sh` follows the pawn-swarm pattern (own checkout in `~/homelab/dev`, `flock`, does nothing if `main` hasn't moved, names the failing step): builds the image tagged with the commit, starts the new container with the env file and data volume on the shared Docker network, waits for `/healthz`, then retires the old one; on failure the old one keeps running
- [ ] `deploy/rollback.sh` restarts the previous image tag
- [ ] The env file and data volume live outside the repo under `~/homelab`; their paths are settings with defaults
- [ ] Scripts pass `shellcheck` in CI
- [ ] README "Deploy" section: one-time setup (env file with a generated encryption key and password hash, data folder, the nginx `location /ai-projects/court-booker/` proxy block to paste, the Uptime Kuma HTTP check on `/healthz`), then updating and rolling back

**Owner steps:** once 02 (Operator login) is merged: create the env file and data folder, add the nginx `location` block and reload nginx, run `deploy/update-site.sh`, and add the Uptime Kuma check.
