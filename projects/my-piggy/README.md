# My Piggy

A first-person horror game: you wake up as your own human head on a pig's body, and your family hunts you through the house in one long night. Built with Godot 4 and played in the browser. See `docs/spec.md` for the first playable.

## Status

`in progress` — ticket 01 (walking skeleton) is done: you can walk and look around a grey-box room as the Piggy, and the checks, tests and web export all run. There is no Mum, no body and no house yet; those come with tickets 02–08 in `docs/tickets/`.

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
cp .env.example .env                                                # no values needed yet
```

`setup-godot.sh` puts `godot` in `~/.local/bin` (change with `GODOT_INSTALL_DIR`); make sure that folder is on your `PATH`. The templates download is 1.3 GB because it holds every platform; only the web files are kept.

## Run

```bash
godot --path .          # play: WASD to walk, mouse to look, click to capture the mouse, Esc to release it
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

CI (`.github/workflows/my-piggy.yml`) runs `scripts/check.sh`, the web export and `shellcheck` on every push that touches this folder.

## Configuration

My Piggy reads no environment variables. Game numbers live in one table, `data/tuning.tres` (a Godot resource, see `src/config/tuning.gd`). It is loaded and checked at startup: a missing or out-of-range value stops the game with a message that names the field.

| Field | What it does | Allowed range |
|-------|--------------|---------------|
| `walk_speed` | How fast the Piggy walks, metres per second | 0.1–10 |
| `mouse_sensitivity` | Radians the view turns per pixel of mouse movement | 0.0001–0.05 |

## How it works

The rules of the game live in plain classes that know nothing about the scene tree; Godot scenes are thin adapters around them. Like a referee and the players: the rules read what happened and decide, and never touch the ball.

- `src/main.tscn` is the entry scene. `src/main.gd` loads and checks the tuning, starts a `Night`, spawns the Piggy in the room and keeps the logger up to date.
- `src/rules/night.gd` — one playthrough. The main test seam. Today it only knows its space (it starts in the bedroom) and how many steps have passed.
- `src/config/tuning.gd` — the tuning table and its checks.
- `src/adapters/piggy_controller.gd` — first-person movement and mouse look, via the input map in `project.godot`.
- `src/adapters/game_log.gd` — the logger. Levels are debug, info, warning and error; every line carries the step and space name: `[info] step=0 space=bedroom Night started`.
- `src/adapters/grey_box_room.tscn` — the placeholder room.

## Folder layout

```
project.godot, export_presets.cfg   # Godot settings; web export preset
data/tuning.tres                    # the tuning table
src/
  main.gd, main.tscn                # entry scene
  config/                           # tuning table and its checks
  rules/                            # Night: pure rules, no scene tree
  adapters/                         # piggy controller, logger, room scene
tests/                              # mirrors src/ (GUT)
addons/gut/                         # GUT 9.7.1, the test framework (vendored, unmodified)
scripts/                            # check.sh, setup-godot.sh, godot-pin.env (the pinned version)
docs/                               # spec, tickets, decisions
```

## Debugging

- Logs go to Godot's output: your terminal when you run `godot --path .`, or the browser console in the web build.
- The game does not start if the tuning table is wrong. The message on screen and in the log names the field.
- `godot --headless --import` printing `SCRIPT ERROR ... has no static type` means a declaration is missing its type. Add one.
- Web build is blank: check the browser console, and check that `.wasm` is served as `application/wasm`.

## Decisions

See `docs/decisions/` for why things are the way they are. Pinned versions are in `scripts/godot-pin.env` (Godot), `requirements.txt` (gdtoolkit) and `addons/gut/plugin.cfg` (GUT).
