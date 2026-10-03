# My Piggy

A first-person horror game: you wake up as your own human head on a pig's body, and your family hunts you through the house in one long night. Built with Godot 4 and played in the browser. See `docs/spec.md` for the first playable.

## Status

`in progress` — tickets 01 and 02 are done: a title screen, a few seconds of black with breathing and a heartbeat, then you walk and look around a grey-box room as the Piggy. Escape pauses, with sensitivity, volume and the controls. It deploys to `https://rickphobia.com/ai-projects/my-piggy/`. There is no Mum, no body and no house yet; those come with tickets 03–08 in `docs/tickets/`.

## Requirements

- Linux or macOS shell (the setup script downloads the Linux x86_64 Godot; on another OS install the pinned Godot yourself)
- Godot **4.7.2** (stable), pinned in `scripts/godot-pin.env`, with its web export templates
- Python 3.11+ for the lint and format tools (`gdtoolkit`)
- `curl`, `unzip`, `sha512sum` for the setup script
- No accounts or API keys

## Setup

```bash
cd projects/my-piggy
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # gdformat, gdlint
scripts/setup-godot.sh                                              # Godot + web templates, checksum-verified
```

`setup-godot.sh` puts `godot` in `~/.local/bin` (change with `GODOT_INSTALL_DIR`); make sure that folder is on your `PATH`. The templates download is 1.3 GB because it holds every platform; only the web files are kept.

## Run

```bash
godot --path .          # play: click the title screen, then WASD to walk, mouse to look, Esc to pause
godot --path . --editor # open the project in the Godot editor
```

## Test

```bash
scripts/check.sh        # what CI runs: format check, lint, type check, tests (stops at the first failure)
```

Or one step at a time:

```bash
.venv/bin/gdformat --check src tests   # format check (drop --check to fix)
.venv/bin/gdlint src tests             # lint
godot --headless --import              # type check: "untyped declaration" and unsafe_* warnings are errors
godot --headless -s addons/gut/gut_cmdln.gd                                  # all tests
godot --headless -s addons/gut/gut_cmdln.gd -gselect=test_night   # one test file (part of its name)
```

`godot --headless --import` exits 0 even when a script has errors, so `scripts/check.sh` reads its output instead. Don't rely on the exit code alone.

## Export (web)

```bash
mkdir -p build/web
godot --headless --export-release Web build/web/index.html
python3 -m http.server --directory build/web 8000   # then open http://localhost:8000
```

The preset is single-threaded with the Compatibility (WebGL 2) renderer, so any static file server works with no special headers. The server must send `.wasm` files as `application/wasm`. The build is about 40 MB, mostly the engine.

The page around the game is `web/shell.html`: Godot's default web page with a "Loading My Piggy…" label under the progress bar and a plain-words message for browsers without WebGL 2. To try that message, start Chrome with `--disable-webgl2`.

CI (`.github/workflows/my-piggy.yml`) runs `scripts/check.sh`, the web export and `shellcheck` on every push that touches this folder.

## Deploy

The game is a static site, served at `https://rickphobia.com/ai-projects/my-piggy/` by nginx in Docker on the Beelink, with `~/homelab/html` as the site root. GitHub can't reach the home network, so the server pulls: you run one script there.

`deploy/update-site.sh` fetches `main` into `~/homelab/dev/ai_slops`, builds a small Docker image with the pinned Godot and its web export templates (`deploy/Dockerfile`, tagged with the Godot version, so it is built once per version), exports the web build inside it, copies the result to `~/homelab/html/ai-projects/my-piggy.new`, then renames it into place. The old build stays as `my-piggy.previous`. If any step fails, the script exits non-zero, names the step, and the live site stays as it was. If `main` hasn't moved since the last deploy, it does nothing.

### First-time setup (on the Beelink)

Needs `git`, `docker` (your user can run it without sudo) and `flock` (part of `util-linux`, already on Ubuntu). The checkout is shared with `pawn-swarm`; skip the clone if it is already there.

```bash
mkdir -p ~/homelab/dev && git clone https://github.com/rickphobia/ai_slops.git ~/homelab/dev/ai_slops
~/homelab/dev/ai_slops/projects/my-piggy/deploy/update-site.sh
```

The first run downloads the Godot export templates (1.3 GB) while building the image, so it takes a few minutes. Later runs reuse the image.

**One-time nginx check.** This was not checked from the development session (it can't reach the server). After the first run:

```bash
curl -I https://rickphobia.com/ai-projects/my-piggy/            # expect 200
curl -I https://rickphobia.com/ai-projects/my-piggy/index.wasm  # expect Content-Type: application/wasm
```

A `404` means nginx maps `/ai-projects/` somewhere other than `~/homelab/html/ai-projects/`; fix its `root`/`location` and reload nginx. A wrong `.wasm` type means nginx's `mime.types` is missing `application/wasm wasm;`; add it and reload. Record what you found here: checked 2026-10-03, the page returns `200` and `index.wasm` is served as `application/wasm`. Cloudflare sits in front of nginx (responses carry `server: cloudflare`).

### Cloudflare caching (optional)

By default Cloudflare does not cache `.wasm` files (`cf-cache-status: DYNAMIC`), so every visit downloads the 40 MB engine from the Beelink over the home upload. To have Cloudflare keep a copy instead, add a cache rule in the Cloudflare dashboard (rickphobia.com → Caching → Cache Rules → Create rule):

- **When:** URI Path starts with `/ai-projects/my-piggy/` **and** File extension is in `wasm`, `js`
- **Then:** Eligible for cache, Edge TTL 1 month

Only the engine files (`index.wasm`, `index.js` and the audio worklets) are cached. They change only when the Godot version in `scripts/godot-pin.env` changes. `index.pck` (the game itself) and `index.html` change on every deploy, so they stay uncached and a new deploy shows up at once. After a Godot version bump, purge the cache for `/ai-projects/my-piggy/` (Caching → Configuration → Custom Purge), or players get an old engine with a new game, which fails to start.

Check it: run `curl -I https://rickphobia.com/ai-projects/my-piggy/index.wasm` twice. The second should say `cf-cache-status: HIT`.

### Update

```bash
~/homelab/dev/ai_slops/projects/my-piggy/deploy/update-site.sh
```

To rebuild even though `main` hasn't changed: `MY_PIGGY_FORCE=1 ~/homelab/dev/ai_slops/projects/my-piggy/deploy/update-site.sh`.

Settings (all optional, shown with defaults in `.env.example`) are environment variables: `MY_PIGGY_REPO_URL`, `MY_PIGGY_BRANCH`, `MY_PIGGY_SRC_DIR`, `MY_PIGGY_SITE_ROOT`, `MY_PIGGY_SITE_SUBPATH`, `MY_PIGGY_FORCE`. The scripts do not read `.env`. The Godot version comes from `scripts/godot-pin.env`, the same pin CI uses.

### Roll back

```bash
~/homelab/dev/ai_slops/projects/my-piggy/deploy/rollback.sh
```

Swaps `my-piggy` and `my-piggy.previous`. Run it again to undo. The next `update-site.sh` run puts the latest `main` back, so fix `main` first.

### Check that it worked

```bash
curl -I https://rickphobia.com/ai-projects/my-piggy/   # expect HTTP 200
cat ~/homelab/dev/my-piggy.deployed-commit            # the commit that is live
```

Then open the URL, click the title screen and walk around.

## Configuration

The game reads no environment variables; the deploy scripts do (see "Deploy"). Game numbers live in one table, `data/tuning.tres` (a Godot resource, see `src/config/tuning.gd`). It is loaded and checked at startup: a missing or out-of-range value stops the game with a message that names the field.

| Field | What it does | Allowed range |
|-------|--------------|---------------|
| `walk_speed` | How fast the Piggy walks, metres per second | 0.1–10 |
| `mouse_sensitivity` | Radians the view turns per pixel of mouse movement, before the player's own setting | 0.0001–0.05 |
| `opening_seconds` | How long the opening lasts: black, breathing and a heartbeat before control is given | 0.5–20 |

The player's own settings (mouse sensitivity as a multiplier of 0.25–3, master volume 0–1) are set in the pause menu and saved to `user://settings.cfg`, which the web build keeps in the browser. See `src/config/player_settings.gd`.

## How it works

The rules of the game live in plain classes that know nothing about the scene tree; Godot scenes are thin adapters around them. Like a referee and the players: the rules read what happened and decide, and never touch the ball.

- `src/main.tscn` is the entry scene. `src/main.gd` loads and checks the tuning and the player's settings, starts a `Night`, spawns the Piggy, shows the title screen, runs the opening and the pause menu, owns the mouse, and keeps the logger up to date.
- `src/rules/game_flow.gd` — title screen, opening, playing, paused: when the player has control.
- `src/rules/night.gd` — one playthrough. The main test seam. Today it only knows its space (it starts in the bedroom) and how many steps have passed.
- `src/config/tuning.gd` — the tuning table and its checks.
- `src/config/player_settings.gd` — the player's sensitivity and volume, kept between visits.
- `src/adapters/piggy_controller.gd` — first-person movement and mouse look, via the input map in `project.godot`.
- `src/adapters/title_screen.gd`, `src/adapters/pause_menu.gd` — the two menus, built in code.
- `src/adapters/placeholder_sounds.gd` — synth breathing and heartbeat for the opening, until real sounds arrive.
- `src/adapters/game_log.gd` — the logger. Levels are debug, info, warning and error; every line carries the step and space name: `[info] step=0 space=bedroom Night started`.
- `src/adapters/grey_box_room.tscn` — the placeholder room.

## Folder layout

```
project.godot, export_presets.cfg   # Godot settings; web export preset
data/tuning.tres                    # the tuning table
src/
  main.gd, main.tscn                # entry scene
  config/                           # tuning table and its checks
  rules/                            # Night, GameFlow: pure rules, no scene tree
  adapters/                         # piggy controller, menus, sounds, logger, room scene
tests/                              # mirrors src/ (GUT)
addons/gut/                         # GUT 9.7.1, the test framework (vendored, unmodified)
scripts/                            # check.sh, setup-godot.sh, godot-pin.env (the pinned version)
deploy/                             # update-site.sh, rollback.sh, Dockerfile (server deploy)
web/shell.html                      # the web page around the game
docs/                               # spec, tickets, decisions
```

## Debugging

- Logs go to Godot's output: your terminal when you run `godot --path .`, or the browser console in the web build.
- The game does not start if the tuning table is wrong. The message on screen and in the log names the field.
- `godot --headless --import` printing `SCRIPT ERROR ... has no static type` means a declaration is missing its type. Add one.
- Web build is blank: check the browser console, and check that `.wasm` is served as `application/wasm`.
- Mouse won't capture after resuming: some browsers refuse for a moment after Escape. Click the game to capture it.
- Deploy failed: the last line of `update-site.sh` names the step. The live site was left as it was.

## Decisions

See `docs/decisions/` for why things are the way they are. Pinned versions are in `scripts/godot-pin.env` (Godot), `requirements.txt` (gdtoolkit) and `addons/gut/plugin.cfg` (GUT).
