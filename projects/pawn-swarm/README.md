# Pawn Swarm

A browser auto-battler on a chess board: your white pawns are your army and your money. Mix of Brotato, How Many Dudes and chess.

## Status

`in progress` — the battle is the real-time swarm from the prototype (`docs/prototype/`, decision 0002): one pawn in the middle of a 16×11 board against all 10 waves of knights, bishops, rooks, queens and finally the king, each wave landing in 3 pushes. Kills drop pawns that snowball the swarm; killing the king wins. Pause and 0.5×–2× speed. Tickets 06–11 in `docs/tickets/` add the shop, skills, pawn types, black types and power-ups.

## Requirements

- Node.js 22.12 or newer (`.nvmrc` pins the version CI uses; `nvm use` picks it up)
- A modern browser
- No accounts or API keys

## Setup

```bash
cd projects/pawn-swarm
npm ci
cp .env.example .env   # the example values work as they are
```

## Run

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # static build in dist/
npm run preview   # serve dist/ locally
```

## Test

```bash
npm run check          # what CI runs: lint, format check, type check, tests
npm run lint           # ESLint
npm run format:check   # Prettier (npm run format to fix)
npm run typecheck      # tsc, strict
npm test               # Vitest, once
npx vitest             # Vitest, watch mode
```

CI runs `npm run check` and `npm run build` on every push that touches this folder (`.github/workflows/pawn-swarm.yml`).

## Balance check

```bash
npm run balance                        # 20 headless runs from seed 1
npm run balance -- --runs 100 --seed 7 # 100 runs from seed 7
```

Plays whole runs without a browser using a simple bot and prints each run's result, the win rate, how many runs ended in each wave, and the biggest swarm. Use it to see what a change to `catalog/` does to the game. It is not a CI gate. There is no shop or skills yet, so the bot only watches; it learns to recruit and fire skills in tickets 06 and 07. Today it wins no runs and mostly dies in waves 6–7 with at most ~70 pawns.

## Configuration

Vite reads these from `.env` and bakes them into the build. The game checks them on page load and shows an error on the page if one is missing or invalid.

| Variable | Required | What it does |
|----------|----------|--------------|
| `VITE_DEFAULT_SEED` | yes | Seed for a new run when none is given (0–4294967295). |

## How it works

`src/main.ts` loads the config, starts a run and drives it: every animation frame it asks the clock how many steps are due, advances the run that many steps, feeds each step's battle events to the effects, updates the HUD and redraws the board.

The battle runs at a fixed 60 steps per game second. The game plays at a pace of 0.65 game seconds per real second, so at 1× a step is due every 1/39 s. `tick-clock.ts` turns real time into steps: at 2× twice as often, while paused never. Pace and speed only change *when* steps run, never what a step does, so a seed plays out the same at every speed (tested in `tests/tick-clock.test.ts`).

The rules are pure functions with no DOM, so tests drive them directly:

- `run/` — the run state machine (`battle → next battle | won | lost`). `advanceRun` plays one step and keeps the biggest swarm and the pieces taken; the call after a cleared wave starts the next wave with the survivors at full HP. Killing the king, or clearing the last wave, wins.
- `battle/` — `step(state, inputs)` plays one step:
  1. `black-pieces.ts` lands the pieces whose warning ran out, with the wave's HP (35% more of the wave-1 HP per wave).
  2. `white-pawns.ts` moves each pawn toward the nearest black piece (where it is now, even mid-move: `piece-position.ts`), one axis at a time, and strikes when in reach and off cooldown. A kill calls `drops.ts`, which spawns plain pawns on the square (fewer as the swarm grows: crowding).
  3. Pawns push apart and stay on the board.
  4. Each black piece hurts the pawns touching it; the king calls 3 knights next to him every 6 s (`landing-squares.ts` picks free squares, with a 0.8 s warning). Then `black-moves.ts` carries on with its move: pick the legal move closest to the nearest pawn, warn on its hit squares for 0.4 s, move, and hit every pawn on them (`pawn-hits.ts`).
  5. `pushes.ts` lands the wave's next push once the last one is down to 25%, or after 25 s.
  `create-battle.ts` sets up a wave: the army in a spiral around the centre, the wave split into 3 pushes (the king in the last), and the first push's landing squares. `landing-squares.ts` puts each piece on a free square, half in a ring around the swarm, never within 3 squares of a pawn while there is room. `spatial-grid.ts` answers "which pawns are near this point" without checking every pawn.
- `board/` — squares, positions in board units (1 square = 1), and each piece's chess moves with the squares they hit: sliders (bishop, rook, queen) hit their whole path and can't pass through other black pieces; the knight and king hit the 3×3 block where they land.
- `catalog/` — stats, rule numbers and the 10-wave table as data. Rebalance here, then run `npm run balance`.
- `balance/` — plays headless runs with the bot and formats the report for `npm run balance`.
- `rng.ts` — the seeded RNG. Its state lives inside the battle state, so the same seed always plays out the same battle. Rule code never uses `Math.random`.

Each step also lists what happened in it (`strike`, `pawn-hurt`, `death`, `drop`, `landed`, `stomp`, `push`, `summon`). The rules never read these; they drive the logs and the on-screen effects.

The `adapters/` only draw state and report clicks; they never change rules:

- `art/` — every piece's drawing as SVG code, in the grotesque dark-fantasy style of `docs/art/` (decision 0003): all 11 pawn types, the 5 black pieces and the 8 black types, including ones the rules don't have yet. `animation.ts` lets one drawing play live (SMIL, for portraits) or as still frames (for the canvas). `portraitSvg(id, label)` in `portrait.ts` gives the DOM a live, animated portrait of a piece, e.g. for the shop.
- `canvas-renderer/piece-art.ts` — the one place that maps a piece to its drawing and size. At startup it decodes each drawing's 8 animation frames as one image; per square size it cuts sprite sheets from them, so a battle only copies pixels. Each piece shows the frame for the current time, offset by its id so a crowd doesn't blink in step.
- `canvas-renderer/board-art.ts` — paints the empty board: dark squares, old blood stains, a vignette.
- `canvas-renderer/effects.ts` — turns battle events into damage numbers, death bursts, "+n ♟" pop-ups, strike lines and landing rings, and ages them with game time (so they freeze on pause).
- `canvas-renderer/canvas-renderer.ts` — draws the board at 2× resolution or more (so the sprites are 2× too), warning squares, pieces back to front, and HP bars; `draw-effect.ts` draws each effect.

See `docs/spec.md`.

## Folder layout

```
index.html                  # page shell and styles: HUD, canvas, end screen, startup error box
art-gallery.html            # dev page: every drawing at game size and as a portrait (not in the build)
src/
  main.ts                   # entrypoint: config, game loop, wiring
  art-gallery.ts            # entrypoint of art-gallery.html
  fonts.css                 # Cinzel and Crimson Pro, self-hosted from @fontsource
  config.ts                 # reads and validates VITE_* env vars
  debug-options.ts          # ?pawns= for a big starting swarm
  logger.ts                 # level-based console logger
  startup-error.ts          # error type for a page that cannot start
  rng.ts                    # seeded RNG for rule code
  tick-clock.ts             # real time → steps due, with speed and pause
  catalog/                  # pieces.ts (stats), battle-rules.ts (rule numbers), waves.ts
  board/                    # square.ts (squares, points), moves.ts (chess moves, hit squares)
  battle/                   # battle-state.ts, create-battle.ts, step.ts and one file per phase
  run/                      # run.ts (run state machine)
  balance/                  # headless bot runs and their report
scripts/
  balance.mjs               # `npm run balance`: loads src/balance through Vite and prints the report
  adapters/
    art/                    # drawings as SVG code, animation frames, palette, portraits
    canvas-renderer/        # canvas-renderer.ts, piece-art.ts, board-art.ts, effects.ts, draw-effect.ts
    dom-ui/
      hud.ts                # pawn count, wave, black pieces left, seed
      battle-controls.ts    # pause and speed buttons
      end-screen.ts         # win / game-over screen: wave, biggest swarm, pieces taken, seed, "new run"
tests/                      # mirrors src/
docs/
  spec.md, tickets/, decisions/, screenshots/, prototype/
```

## Debugging

- Logs go to the browser console, prefixed `[pawn-swarm]`. Default level is `info`.
- Add `?debug=1` to the URL for debug logs, e.g. `http://localhost:5173/?debug=1`. Debug logs show every battle event (strike, hurt, death, drop, landing, stomp) with its step. That is a lot of logging in a big fight.
- Add `?pawns=300` to start every run with that many plain pawns (1–1000), to see how a big swarm plays and performs. Combine with `?debug=1` as `?pawns=300&debug=1`.
- Wave starts and ends, each push landing ("more black pieces incoming"), pause, resume and speed changes are logged at `info` with the step they happened on. The run's end logs the wave, biggest swarm and pieces taken.
- **"BoardFullError: Every square … is taken"** — a push or the wave table holds more black pieces than the 176 squares can fit. Lower the counts in `catalog/waves.ts`.
- **"RunStuckError" from `npm run balance`** — a run went on for over a million steps, so a rule is stuck (for example a piece that can never be reached). Replay that seed in the browser to watch it.
- **Replaying a battle** — the HUD and the end screen show the run's seed. Put it in `VITE_DEFAULT_SEED`, restart `npm run dev`, and the first run plays out exactly the same. "New run" picks a random seed. Speed and pauses don't change the result, so you can replay at 0.5× to watch a hard moment.
- **"Pawn Swarm could not start: VITE_… is missing"** — there is no `.env`, or it lacks that variable. Run `cp .env.example .env` and restart `npm run dev` (Vite only reads `.env` at startup).
- **"Pawn Swarm stopped: …"** — a rule threw during a battle and the game loop stopped. The console error has the seed, wave and step; replay that seed with `?debug=1` to see the steps before it.
- **Blank page, no error** — open the console; a script error before startup would show there.
- **Checking the art** — open `http://localhost:5173/art-gallery.html` while `npm run dev` runs. It shows every drawing through the game's own sprite code at game size (one square = 48 CSS px), and as the live portrait the shop uses.
- **"Pawn Swarm could not start: The "…" drawing could not be loaded as an image"** — that drawing's SVG is broken. `npm test` checks every drawing is well formed; the art gallery shows which one fails.

## Decisions

See `docs/decisions/` for why things are the way they are:

- [0001](docs/decisions/0001-browser-canvas-no-engine.md) — browser demo in TypeScript + Canvas, no game engine
- [0002](docs/decisions/0002-capture-is-an-attack.md) — a capture is an attack; the attacker stays put (tick-based battle, replaced by the one below)
- [0002](docs/decisions/0002-real-time-fixed-step-battle.md) — real-time fixed-step battle instead of a tick-by-tick board game
- [0003](docs/decisions/0003-svg-drawings-baked-to-sprite-frames.md) — piece art is SVG code, baked into sprite frames at startup

## Docs

- `docs/spec.md` — what the demo is
- `docs/art/` — the approved art direction and samples
- `GLOSSARY.md` — the game's words
