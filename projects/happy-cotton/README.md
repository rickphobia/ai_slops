# Happy Cotton

An endless 3D farm game in the style of Hay Day, played in the browser, that satirises the Chinese state's forced-labour system in Xinjiang's cotton fields. The player is a Uyghur Worker; the cheerful App over the field belongs to the state. See `docs/spec.md` for the first playable and `GLOSSARY.md` for the game's words.

## Status

`in progress`: tickets 01–03. The game opens on the title screen with its Sources page; Start goes to a placeholder field. The server deploy scripts publish `main` to `https://rickphobia.com/ai-projects/happy-cotton/`. No gameplay yet; the tickets in `docs/tickets/` add it.

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
godot --path .          # play: the title screen, then a placeholder field
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

The preset uses a custom page shell, `web/shell.html`: a loading bar with a percentage while the build downloads, and a plain message instead of a black screen when the browser has no WebGL 2. The preset is single-threaded with the Compatibility (WebGL 2) renderer (decision 0001), so any static file server works with no special headers. The server must send `.wasm` files as `application/wasm`. The build is about 40 MB, mostly the engine. Browsers only run it from `localhost` or HTTPS.

CI (`.github/workflows/happy-cotton.yml`) runs `scripts/check.sh`, the web export and `shellcheck` (on `scripts/` and `deploy/`) on every push that touches this folder.

## Deploy

The game is a static site, served at `https://rickphobia.com/ai-projects/happy-cotton/` by nginx in Docker on the Beelink, with `~/homelab/html` as the site root. GitHub can't reach the home network, so the server pulls: you run one script there.

`deploy/update-site.sh` fetches `main` into `~/homelab/dev/ai_slops`, builds the `happy-cotton-godot:<version>` Docker image from `deploy/Dockerfile` (a digest-pinned Ubuntu plus the Godot and web templates pinned in `scripts/godot-pin.env`, checksum-verified; no Godot install needed on the server), writes `version.txt` (short commit and date), exports the web build in that image, copies it to `~/homelab/html/ai-projects/happy-cotton.new`, then renames it into place. The old build stays as `happy-cotton.previous`. If any step fails, the script exits non-zero, names the step, and the live site stays as it was. If `main` hasn't moved since the last deploy, it does nothing.

### First-time setup (on the Beelink)

Needs `git`, `docker` (your user can run it without sudo) and `flock` (part of `util-linux`, already on Ubuntu). The checkout in `~/homelab/dev/ai_slops` is shared with the other projects' deploy scripts; it is created if missing.

```bash
~/homelab/code/ai_slops/projects/happy-cotton/deploy/update-site.sh   # first run, from any checkout
```

The first run builds the image, which downloads the 1.3 GB templates bundle: allow about 10 minutes. Later runs reuse the image and take under a minute.

**nginx check.** No nginx change is needed if `/ai-projects/` is already served from `~/homelab/html/ai-projects/`. After the first run, check the page and that `.wasm` is sent as `application/wasm` (browsers refuse to stream-compile it otherwise):

```bash
curl -I https://rickphobia.com/ai-projects/happy-cotton/                                    # expect 200
curl -sI https://rickphobia.com/ai-projects/happy-cotton/index.wasm | grep -i content-type  # expect application/wasm
```

If the page is `404`, fix nginx's `root`/`location` for `/ai-projects/`; if the type is wrong, add `application/wasm wasm;` to its `mime.types` and reload nginx. Not checked yet: the owner fills in the date and result after the first deploy.

### Update

```bash
~/homelab/dev/ai_slops/projects/happy-cotton/deploy/update-site.sh
```

To rebuild even though `main` hasn't changed: `HAPPY_COTTON_FORCE=1 ~/homelab/dev/ai_slops/projects/happy-cotton/deploy/update-site.sh`.

Settings (all optional, shown with defaults in `.env.example`) are environment variables: `HAPPY_COTTON_REPO_URL`, `HAPPY_COTTON_BRANCH`, `HAPPY_COTTON_SRC_DIR`, `HAPPY_COTTON_SITE_ROOT`, `HAPPY_COTTON_SITE_SUBPATH`, `HAPPY_COTTON_FORCE`. The scripts do not read `.env`.

### Roll back

```bash
~/homelab/dev/ai_slops/projects/happy-cotton/deploy/rollback.sh
```

Swaps `happy-cotton` and `happy-cotton.previous`. Run it again to undo. The next `update-site.sh` run puts the latest `main` back, so fix `main` before running it.

### Check that it worked

```bash
curl -I https://rickphobia.com/ai-projects/happy-cotton/   # expect HTTP 200
cat ~/homelab/dev/happy-cotton.deployed-commit            # the commit that is live
```

Then open the URL: the loading bar fills, then the field shows. The browser console's first game line is `[info] game started version="<commit> <date>"`.

## Configuration

The game reads no environment variables. `.env.example` lists the deploy scripts' settings with their defaults (see "Deploy").

All the game's numbers live in one tuning table, `data/tuning.tres`, described field by field in `src/config/tuning.gd`. The entry scene checks it at startup: a missing or out-of-range value stops the game with `Cannot start Happy Cotton:` and one line per bad value naming the field, on screen and in the log.

## How it works

- `src/adapters/title/` is the first scene: the game's name, the content note (exact wording from the spec's content rules), Start and the Sources page. Start opens `src/main.tscn`.
- `src/content/sources_register.gd` is the one list of sources the game draws on; the Sources page is built from it, and a test checks every entry is complete with a unique id. Add a source there before the game uses a claim or a piece of state vocabulary from it.
- `src/main.tscn` / `src/main.gd` is the thin entrypoint: it logs the build version, loads and checks the tuning table, and shows the field. Later tickets wire the Farm rules to the adapters here.
- `src/config/` holds the tuning table and the build version (read from `version.txt`, which the build scripts write before an export; without it the build is a `dev build`).
- `src/adapters/` holds everything that talks to Godot or the outside world. Today that is the game log and the title screen.
- The Farm rules (ticket 04 on) go in `src/rules/`: plain GDScript objects with no scene tree, clock or file access, tested through their public interface.

## Folder layout

```
project.godot          Godot settings: Compatibility renderer, landscape, strict typing warnings as errors
export_presets.cfg     the Web export preset (single-threaded)
data/tuning.tres       the tuning table's values
src/
  main.tscn, main.gd   entrypoint
  config/              tuning table, build version
  content/             sources register
  rules/               Farm rules (from ticket 04)
  adapters/            game log, title screen; later the field, The App overlay, save store, clock
tests/                 GUT tests, mirroring src/
addons/gut/            the GUT test addon (vendored, 9.7.1)
scripts/               setup-godot.sh, check.sh, godot-pin.env
deploy/                update-site.sh, rollback.sh, Dockerfile (the server's export image)
web/shell.html         the web page around the game: loading bar, no-WebGL 2 message
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
- **`update-site: FAILED while <step>`** — the step names what broke (fetching, building the image, exporting, swapping folders); the live site is unchanged unless it says "swapping folders". Fix it and run the script again.
- **"Happy Cotton can't start in this browser"** — the browser has no WebGL 2 (or lacks another feature the message names).

## Decisions

See `docs/decisions/` for why things are the way they are.
