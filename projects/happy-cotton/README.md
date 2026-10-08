# Happy Cotton

An endless 3D farm game in the style of Hay Day, played in the browser, that satirises the Chinese state's forced-labour system in Xinjiang's cotton fields. The player is a Uyghur Worker; the cheerful App over the field belongs to the state. See `docs/spec.md` for the first playable and `GLOSSARY.md` for the game's words.

## Status

`in progress`: tickets 01–08, 10, 11, 13 and 14. The game opens on the title screen; Start goes to the field. Tap an empty plot to plant cotton, tap the Generator outside the field's gate to send the Worker to run on it, and watch the cotton grow through its stages (seedling, flowering, green bolls, open cotton), tap it to see the time left, and tap it when ripe to pick it. Crops grow only while the Worker runs: the loudspeaker's lamp glows while he does. After a few laps he slows, staggers and stops bent over to breathe, the crops halt and the lamp dims, then he runs again. Planting or picking brings him back to the field. Drag to look around the field, and pinch or scroll to zoom, within limits; moving the view never plants or picks. The field is dusty and fenced, under harsh light and haze, with the Worker standing beside it. The App sits over the field: a Quota bar, the Shift's time left, Labour Points and the Mascot's announcements. Each 10-minute Shift ends with a Quota check (confetti when met) and the next Shift starts at once with a higher Quota. A missed Quota sends the Worker to a Study Session: a plain room with a loudspeaker and a countdown covers the field, planting, picking and the Generator are refused, crops halt, and the Shift's clock waits until it ends. Each one in a row lasts twice as long (5, 10, 20, then 40 minutes at most); a met Quota resets that, and The App's words grow colder with each miss in a row. Switching away from the tab pauses the Shift, but the night shift goes on: crops grow at a quarter of the running speed with no Generator, and a Study Session keeps counting down. Coming back, the Mascot gives a short summary of the time away, what ripened, what Withered and the Study Session time served. Ripe cotton left unpicked for 8 hours (online or offline, not counting Study Sessions) Withers: the plot shows a dry, slumped bush, The App logs it as Negligence, docks Labour Points (never below zero) and sends the Worker to a 60-minute Study Session, longer than any for a missed Quota. Tap a Withered plot to clear it before replanting. Every plant, pick and lap wears the Worker down: The App's bar shows his Exhaustion. As it rises the field drains of colour, he slumps and slows, he manages fewer laps before he stops to breathe, above 50% each plant, pick or clear takes a moment before he can do the next, and above 75% a pick can drop its cotton (nothing counted, nothing earned). The rest hour button (bottom right) spends Labour Points on a rest: he leaves the Generator, crops halt, the Shift keeps counting, and his Exhaustion falls, but never below a floor that rises at the end of every Shift. A missed Quota takes the rest hour away for the next Shift. Time away recovers a little Exhaustion, and the away summary says how much. The server deploy scripts publish `main` to `https://rickphobia.com/ai-projects/happy-cotton/`. No saving yet, so closing the game still starts it afresh; the tickets in `docs/tickets/` add them.

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
godot --path .          # play: the title screen, then the field: click (or tap) a plot to plant, the Generator (left of the field) to make crops grow, a plot again to see time left or, when ripe, to pick; a Withered plot to clear it; the rest hour button to rest; drag to pan, wheel (or pinch) to zoom
godot --path . --editor # open the project in the Godot editor
godot --path . -- --debug   # debug mode: adds the Skip time control (see below)
```

### Debug mode and Skip time

Debug mode is for the owner, to see growth and offline time without waiting hours. Turn it on with `-- --debug` on the command line (desktop) or `?debug=1` in the page URL (web, e.g. `http://localhost:8000/?debug=1`). Without it no debug control is shown.

In debug mode two buttons at the top right, **Skip +1 hour** and **Skip +8 hours**, feed that much time through the same offline resume as really being away that long (the away summary included), so they exercise the real rules rather than a shortcut. Each is logged: `[info] skip time seconds=3600.0`, then the `offline resume` line. To see Withering: plant a plot, press Skip +1 hour (it ripens), then Skip +8 hours (it Withers, The App logs Negligence and the Study Session starts).

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

- `assets/` holds the CC0 models and textures (Kenney's Nature Kit, Quaternius's Modular Men, a Poly Haven ground texture). `assets/CREDITS.md` lists every file; add a row there when adding one. The field code replaces the plant and fence models' colours with its muted palette; the Worker keeps the model's own colours.

- `src/adapters/title/` is the first scene: the game's name, the content note (exact wording from the spec's content rules), Start and the Sources page. Start opens `src/main.tscn`.
- `src/content/sources_register.gd` is the one list of sources the game draws on; the Sources page is built from it, and a test checks every entry is complete with a unique id. Add a source there before the game uses a claim or a piece of state vocabulary from it.
- `src/content/app_text.gd` holds The App's words: the text for each message key the rules emit (with `{named}` slots for its values), the overlay's labels, and the doublespeak terms, each tied to a source id. A line that uses a term or makes a claim lists its source ids. `tests/content/test_app_text.gd` fails if a key the rules can emit (`Farm.MESSAGE_KEYS`) has no text, a cited id isn't in the register, or a line uses a term without citing its source. A new message key goes in `Farm.MESSAGE_KEYS` and here. The test can only catch a listed term or a bad id: a line that makes a factual claim without using a term must list its source ids by hand, so check that in review. Note where in the source each term is documented, next to it in `DOUBLESPEAK`.
- `src/main.tscn` / `src/main.gd` is the thin entrypoint: it logs the build version, loads and checks the tuning table, creates the Farm rules, advances them every frame, turns a tapped plot into plant, pick or "show time left" and a tapped Generator into `run_generator`, shows the Worker, and passes the rules' App messages (as text from the App text table) and Shift to The App overlay.
- `src/adapters/clock/wall_clock.gd` works out offline time while the game runs: a hidden tab stops frames, so a gap of 10 seconds or more between two frames (less the frame's own step) is reported as offline time; a device clock set back reports a negative gap, which the rules count as zero. Offline time since the last save, on start, comes with saving (ticket 09).
- `src/adapters/debug/` holds debug mode: `debug_mode.gd` reads `?debug=1` from the page URL or `--debug` from the command line, and `skip_time_panel.gd` is the Skip time control. The entrypoint adds the panel only in debug mode.
- `src/config/` holds the tuning table and the build version (read from `version.txt`, which the build scripts write before an export; without it the build is a `dev build`).
- `src/adapters/` holds everything that talks to Godot or the outside world: the game log, the title screen, the field scene (`field/`: plots, fence, the Worker, the cotton plant at each stage in `crop_looks.gd`, the fence with its gate (`fence_look.gd`), the Generator built from simple shapes with its pump, pipe and loudspeaker lamp (`generator.gd`), the Worker walking out to it, running, slowing on his last lap, staggering into his breath and walking back (`worker_motion.gd`, using only the model's Walk, Run, HitRecieve and Idle animations), tap and click picking through the camera, the time-left label, and pan and zoom: `pointer_gesture.gd` tells a tap from a drag or pinch, so only a press released in place plants or picks, and `field_camera.gd` holds the camera's pan and zoom limits; the camera's angle never changes), The App overlay (`app_overlay/`: Quota bar, Shift timer, Labour Points, the Mascot and its speech bubble, confetti, and the Study Session room in `study_room.gd`; it catches no taps) and the "turn your phone sideways" cover shown in portrait.
- `src/rules/` holds the Farm rules: `Farm` with the commands `plant`, `pick`, `clear`, `run_generator` and `buy_rest_hour` (each returns a `CommandResult`: whether it happened, and a reason key if not), `advance(seconds)` for online play, `resume_offline(seconds)` for time away (crops grow at `offline_growth_rate` whatever the Worker was doing, a Study Session counts down, the Shift waits; negative time counts as zero and more than `offline_cap_seconds` is cut to it; it returns an `AwayReport` for the log and emits the away summary), read-only `PlotView`s (stage and time left), the `WorkerView` (in the field, running, breathing or resting, laps left before he breathes, and Exhaustion), `exhaustion()` and `exhaustion_floor()`, `rest_seconds_left()`, the `ShiftView` (number, Quota, picked, time left) and Labour Points. Crops grow only while the Worker runs on the Generator; after `laps_before_breath` laps of `lap_seconds` he breathes for `breath_seconds`, and the laps since his last breath carry over when he leaves it. A plant or pick that happens brings him back to the field. Online play counts the Shift down whatever he is doing; at its end the Quota is checked and the next Shift starts with the Quota raised by a fixed step. A missed Quota starts a Study Session (`study_session_seconds_left()`): it takes the Worker off the Generator, plant, pick and `run_generator` are refused with `in_study_session`, crops halt, and the Shift's clock waits until it ends. Its length doubles for each miss in a row up to the tuning cap; a met Quota resets the count. Picks count from zero each Shift, so a surplus carries no credit. Exhaustion (`exhaustion.gd`, 0 to 100) rises with each plant, pick and lap; above `slow_exhaustion` field work leaves him busy for `slow_action_seconds` (refused with `worker_busy`), above `mistake_exhaustion` a pick drops its cotton when the injected roll comes up under `dropped_cotton_chance`, and the laps in a run fall towards `fewest_laps_before_breath`, set when the run starts. The Generator's laps and breaths live in `toil.gd`. The rest hour costs `rest_hour_price`, lasts `rest_hour_seconds` of online play (it waits while away, like the Shift) and lowers Exhaustion by `rest_hour_recovery`, never below the floor, which rises by `exhaustion_floor_rise` at each Shift's end. A missed Quota sets `rest_hour_taken_away()` for the next Shift, and a Study Session cuts a rest short. `Farm.new(tuning, plots, roll)` takes the roll as a Callable returning 0 to 1, so tests decide every dropped pick. What The App should say comes out of `take_messages()` as `AppMessage`s: a key plus values, never text. Plain GDScript objects with no scene tree, clock or file access, tested through their public interface with the fast tuning table in `tests/rules/fast_tuning.gd`.

## Folder layout

```
project.godot          Godot settings: Compatibility renderer, landscape, strict typing warnings as errors
export_presets.cfg     the Web export preset (single-threaded)
data/tuning.tres       the tuning table's values
src/
  main.tscn, main.gd   entrypoint
  config/              tuning table, build version
  content/             sources register, App text
  rules/               Farm rules: plots, plant, pick, the Generator and growth, Shift and Quota, Labour Points, App messages
  adapters/            game log, title screen, field scene, The App overlay, rotate prompt, wall clock, debug mode; later save store
assets/                CC0 models and textures; CREDITS.md names each one's author, licence and link
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

Plant, pick and sending the Worker to the Generator are logged at debug level, including refusals with their reason, for example `[debug] plant plot=3`, `[debug] pick refused plot=3 reason=&"not_ripe"` or `[debug] run generator`. So is each change in what the Worker is doing: `[debug] worker activity="running"`, `"breathing"` or `"in_field"`. Each Quota check is logged at info level: `[info] quota checked shift=1 picked=8 quota=10 met=false`. So is each Study Session, with its length and how many in a row: `[info] study session started seconds=300.0 minutes=5 in_a_row=1` and `[info] study session ended in_a_row=1`. Each return from offline time (a hidden tab shown again, or Skip time) is logged at info level: `[info] offline resume seconds=600.0 ripened=2 study_seconds_served=0.0 exhaustion_recovered=1.7`. A rest hour bought is logged at info level (`[info] rest hour bought labour_points_left=4`), a refused one at debug (`[debug] rest hour refused reason=&"not_enough_labour_points"`). Its end and each dropped pick are logged at info level: `[info] rest hour ended exhaustion=22.0`, `[info] cotton dropped exhaustion=81.5`. If the clock's time couldn't be used as given, a warning comes first: `[warning] offline time adjusted problem=&"negative_offline_time" seconds_away=-60.0 seconds_counted=0.0`, or `problem=&"offline_time_capped"` past the tuning's cap. An App message with no text logs `[warning] app message has no text key=...` (the content test should catch that first).

Crops grow (while he runs) and the Shift counts down on frame time, and Godot caps one frame's step at about 0.13 s, so below roughly 8 frames a second (a software-rendered browser, a struggling phone) crops grow slower than the wall clock. A hidden tab stops frames, so it counts as offline: the wall clock reports the hidden time when the tab is shown again.

Warnings and errors go through `push_warning`/`push_error`, so they also show in the editor's Debugger panel. Tests capture lines by setting `GameLog.sink`; set `GameLog.minimum_level = GameLog.Level.DEBUG` to see debug lines.

Known failure modes:

- **`Cannot start Happy Cotton:` on screen** — the tuning table has a missing or out-of-range value; the message names it. Fix `data/tuning.tres`.
- **`check: FAILED at: type check`** — a script has an untyped declaration or an unsafe access; the lines above say which file and line.
- **Export fails with "No export template found"** — run `scripts/setup-godot.sh`.
- **`update-site: FAILED while <step>`** — the step names what broke (fetching, building the image, exporting, swapping folders); the live site is unchanged unless it says "swapping folders". Fix it and run the script again.
- **"Happy Cotton can't start in this browser"** — the browser has no WebGL 2 (or lacks another feature the message names).

## Decisions

See `docs/decisions/` for why things are the way they are.
