# Happy Cotton

An endless 3D farm game in the style of Hay Day, played in the browser, that satirises the Chinese state's forced-labour system in Xinjiang's cotton fields. The player is a Uyghur Worker; the cheerful App over the field belongs to the state. See `docs/spec.md` for the first playable and `GLOSSARY.md` for the game's words.

## Status

`in progress`: the walking skeleton (ticket 01). The project builds, its checks run in CI and a placeholder field loads in the editor and in the browser. No gameplay yet; the tickets in `docs/tickets/` add it.

## Requirements

- Linux or macOS shell (the setup script downloads the Linux x86_64 Godot; on another OS install the pinned Godot yourself)
- Godot **4.7.2** (stable), pinned in `scripts/godot-pin.env`, with its web export templates
- Python 3.11+ for the lint and format tools (`gdtoolkit`)
- `curl`, `unzip`, `sha512sum` for the setup script
- No accounts or API keys

## Setup

```bash
cd projects/happy-cotton
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # gdformat, gdlint
scripts/setup-godot.sh                                              # Godot + web templates, checksum-verified
```

`setup-godot.sh` puts `godot` in `~/.local/bin` (change with `GODOT_INSTALL_DIR`); make sure that folder is on your `PATH`. The templates download is 1.3 GB because it holds every platform; only the web files are kept. Re-running it skips what is already installed.

The GUT test addon (9.7.1) is vendored in `addons/gut/`, so there is nothing to install for it.

## Run

```bash
godot --path .          # play: today a placeholder field
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
godot --headless -s addons/gut/gut_cmdln.gd                         # all tests
godot --headless -s addons/gut/gut_cmdln.gd -gselect=test_tuning    # one test file (part of its name)
```

`godot --headless --import` exits 0 even when a script has errors, so `scripts/check.sh` reads its output instead, then runs `--check-only` on each script (which does return a failing exit code). Don't rely on the import's exit code alone.

## Export (web)

```bash
mkdir -p build/web
godot --headless --export-release Web build/web/index.html
python3 -m http.server --directory build/web 8000   # then open http://localhost:8000
```

The preset is single-threaded with the Compatibility (WebGL 2) renderer (decision 0001), so any static file server works with no special headers. The server must send `.wasm` files as `application/wasm`. The build is about 40 MB, mostly the engine. Browsers only run it from `localhost` or HTTPS.

CI (`.github/workflows/happy-cotton.yml`) runs `scripts/check.sh`, the web export and `shellcheck` on every push that touches this folder. Deploying to rickphobia.com arrives with ticket 02.

## Configuration

The game reads no environment variables. `.env.example` will list the deploy scripts' settings when they arrive (ticket 02).

All the game's numbers live in one tuning table, `data/tuning.tres`, described field by field in `src/config/tuning.gd`. The entry scene checks it at startup: a missing or out-of-range value stops the game with `Cannot start Happy Cotton:` and one line per bad value naming the field, on screen and in the log.

## How it works

- `src/main.tscn` / `src/main.gd` is the thin entrypoint: it logs the build version, loads and checks the tuning table, and shows the field. Later tickets wire the Farm rules to the adapters here.
- `src/config/` holds the tuning table and the build version (read from `version.txt`, which the build scripts write before an export; without it the build is a `dev build`).
- `src/adapters/` holds everything that talks to Godot or the outside world. Today that is the game log.
- The Farm rules (ticket 04 on) go in `src/rules/`: plain GDScript objects with no scene tree, clock or file access, tested through their public interface.

## Folder layout

```
project.godot          Godot settings: Compatibility renderer, landscape, strict typing warnings as errors
export_presets.cfg     the Web export preset (single-threaded)
data/tuning.tres       the tuning table's values
src/
  main.tscn, main.gd   entrypoint
  config/              tuning table, build version
  rules/               Farm rules (from ticket 04)
  adapters/            game log; later the field, The App overlay, save store, clock
tests/                 GUT tests, mirroring src/
addons/gut/            the GUT test addon (vendored, 9.7.1)
scripts/               setup-godot.sh, check.sh, godot-pin.env
docs/                  spec, tickets, decisions
```

## Debugging

Log lines go to Godot's output (the terminal running `godot`, or the browser console for the web build), one line per event: the level, the event, then `key=value` fields, for example:

```
[info] game started version="dev build"
[info] tuning loaded path="res://data/tuning.tres"
```

Warnings and errors go through `push_warning`/`push_error`, so they also show in the editor's Debugger panel. Tests capture lines by setting `GameLog.sink`; set `GameLog.minimum_level = GameLog.Level.DEBUG` to see debug lines.

Known failure modes:

- **`Cannot start Happy Cotton:` on screen** — the tuning table has a missing or out-of-range value; the message names it. Fix `data/tuning.tres`.
- **`check: FAILED at: type check`** — a script has an untyped declaration or an unsafe access; the lines above say which file and line.
- **Export fails with "No export template found"** — run `scripts/setup-godot.sh`.

## Decisions

See `docs/decisions/` for why things are the way they are.
