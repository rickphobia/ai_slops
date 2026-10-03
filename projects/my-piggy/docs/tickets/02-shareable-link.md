# 02: Shareable link: deploy, title screen and pause menu

**What to build:** Friends can open `rickphobia.com/ai-projects/my-piggy/` and play whatever is on `main`. They land on a title screen that sets the mood and warns them what they're in for. One click starts the game: a few seconds of black with breathing and a heartbeat, then the eyes open. Escape pauses, frees the mouse, and offers sensitivity, volume and the controls list. The owner updates the site with one command on the server, the same way as `pawn-swarm` (see its README, "Deploy").

**Blocked by:** 01 (Walking skeleton)

**Status:** done

**Touches:** deploy, CI workflow (shell-script check step), README (deploy section), `.env.example`, title screen, pause menu, settings, Piggy controller (sensitivity only)

- [x] Deploy script pulls `main` into the server checkout, exports the web build in a pinned container that has the pinned Godot version and export templates, and swaps the result into `~/homelab/html/ai-projects/my-piggy/`. The previous build is kept for rollback. Any failed step exits non-zero, names the step, and leaves the live site unchanged. It does nothing if `main` hasn't moved, unless forced.
- [x] Deploy settings are environment variables listed in `.env.example` with defaults
- [x] README deploy section: first-time setup, update, rollback, and a one-time check that nginx serves `.wasm` as `application/wasm` and `/ai-projects/my-piggy/` returns 200 (record what was found)
  - Not checkable from the dev session (no server access): the README has the commands and a "not checked yet" line for the owner to fill in on first deploy.
- [x] CI runs `shellcheck` on the deploy scripts
- [x] Title screen: game name, "headphones recommended", a short content note (body horror, implied violence), click to start
- [x] A loading indicator shows while the web build downloads
- [x] A browser without WebGL 2 gets a clear message, not a black screen
- [x] The click that starts the game also unlocks audio and captures the mouse
- [x] Opening: a few seconds of black with breathing and a heartbeat (placeholder sounds are fine), then control is given
- [x] Escape pauses the game and releases the mouse; the pause menu has mouse sensitivity, master volume, the controls list, and resume
- [x] Sensitivity and volume persist between visits (browser storage via Godot's user folder)
