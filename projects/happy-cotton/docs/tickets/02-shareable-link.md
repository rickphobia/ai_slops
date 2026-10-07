# 02: Shareable link

**What to build:** Anyone can open `rickphobia.com/ai-projects/happy-cotton/` and play whatever is on `main`. The owner updates the site with one command on the server and can roll back a bad build, the same way as the repo's other web games (spec: "Owner and developer" stories 76–78).

**Blocked by:** 01 (Walking skeleton)

**Status:** ready

**Touches:** deploy, CI, README

**Effort:** low

- [ ] Deploy script pulls `main` into the server checkout, exports the web build in a pinned container with the pinned Godot version and templates, and swaps the result into the site folder; the previous build is kept for rollback
- [ ] Any failed step exits non-zero, names the step and leaves the live site unchanged; it does nothing if `main` hasn't moved, unless forced
- [ ] Rollback script restores the previous build
- [ ] Deploy settings are environment variables listed in `.env.example` with their defaults
- [ ] CI runs `shellcheck` on the deploy scripts
- [ ] A loading indicator shows while the web build downloads, and a browser without WebGL 2 gets a clear message instead of a black screen
- [ ] README "Deploy" section: first-time setup, update, rollback, and the nginx/`.wasm` check with a "not checked yet" line for the owner to fill in

**Owner steps:** run the deploy script on the Beelink, check `https://rickphobia.com/ai-projects/happy-cotton/` returns 200, and record the result in the README.
