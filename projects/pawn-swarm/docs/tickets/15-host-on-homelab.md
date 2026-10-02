# 15: Host on the homelab

**What to build:** Put the game at `rickphobia.com/ai-projects/pawn-swarm/`, and make updating it one command on the server.

**Blocked by:** 10, 11 (last ticket in the queue)

**Status:** in review (waiting on the owner's run on the Beelink)

**Touches:** deploy/ (new), README

## The server

- A Beelink mini PC at home running Ubuntu. Docker runs nginx with `~/homelab/html` mounted as the site root. The owner works on it over VS Code Remote.
- It is on a home network, so GitHub can't push to it. The server pulls instead.
- The build already uses relative asset paths (`base: "./"` in `vite.config.ts`), so it works from a sub-folder.

## Plan

`deploy/update-site.sh`, run on the Beelink:
1. Fetch `main` into a checkout kept outside the site root (e.g. `~/homelab/src/ai_slops`).
2. Build inside a pinned `node` Docker image (`npm ci && npm run build`), so the server needs no Node install.
3. Copy `dist/` to a temp folder next to `~/homelab/html/ai-projects/pawn-swarm/`, then swap the two folders, so visitors never see half a deploy. Keep the previous build as `pawn-swarm.previous` for a one-command rollback.
4. Exit non-zero with a clear message on any failed step. The live site stays untouched when the build fails.

- [x] `deploy/update-site.sh` (`set -euo pipefail`; paths come from env vars with the defaults above, listed in `.env.example`)
- [x] `deploy/rollback.sh` swaps the previous build back
- [x] Optional systemd timer (`deploy/pawn-swarm-update.timer` + `.service`) that runs the update every 15 minutes, skipping the build when `main` hasn't changed
- [ ] No nginx config change needed if `/ai-projects/` already serves files from `~/homelab/html/ai-projects/`. Check that first and write down what you found in the README.
- [x] README "Deploy" section: first-time setup, update, rollback, how to check it worked (`curl -I https://rickphobia.com/ai-projects/pawn-swarm/`)
- [ ] Ran it on the Beelink once by hand and the game loads at the URL (owner confirms, since the session can't reach the server)
- [x] Shellcheck clean, and the CI workflow runs shellcheck on `deploy/`
