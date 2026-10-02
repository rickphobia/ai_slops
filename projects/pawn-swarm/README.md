# Pawn Swarm

A browser auto-battler on a chess board: your white pawns are your army and your money. Mix of Brotato, How Many Dudes and chess.

## Status

`in progress` — the game was redesigned around a real-time swarm after a prototype (`docs/prototype/`, decision 0002). The current build is still the old tick-based battle: one plain pawn fights wave 1 (a single knight), with pause, 0.5×–2× speed and a HUD showing wave, pawn count and seed. Tickets 04–11 in `docs/tickets/` rebuild it to the new spec.

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

## Configuration

Vite reads these from `.env` and bakes them into the build. The game checks them on page load and shows an error on the page if one is missing or invalid.

| Variable | Required | What it does |
|----------|----------|--------------|
| `VITE_TICK_MS` | yes | Length of one tick at 1× speed, in milliseconds (1–10000). Spec value: 250. |
| `VITE_BOARD_SIZE` | yes | Files and ranks on the board (4–64). Spec value: 16. |
| `VITE_DEFAULT_SEED` | yes | Seed for a new run when none is given (0–4294967295). |

## How it works

`src/main.ts` loads the config, starts a run and drives it: every animation frame it asks the tick clock how many ticks are due, advances the run that many ticks, updates the HUD and redraws the board.

`tick-clock.ts` turns real time into ticks. At 1× a tick is due every `VITE_TICK_MS`; at 2× every half of that; while paused, never. Speed only changes *when* ticks run, never what a tick does, so a seed plays out the same at every speed (tested in `tests/tick-clock.test.ts`).

The rules are pure functions with no DOM, so tests drive them directly:

- `run/` — the run state machine (`battle → won | lost`). `advanceRun` moves it one tick.
- `battle/` — `createBattle` sets up the pieces; `step` plays one tick: each piece counts down its cooldown, then moves or captures. A capture deals the attacker's attack as damage; the attacker stays on its square.
- `board/` — legal moves per piece kind.
- `catalog/` — stats and waves as data. Rebalance here.
- `rng.ts` — the seeded RNG. Its state lives inside the battle state, so the same seed always plays out the same battle. Rule code never uses `Math.random`.

The `adapters/` only draw state and report clicks; they never change rules. See `docs/spec.md`.

## Folder layout

```
index.html                  # page shell: HUD, canvas, end screen, startup error box
src/
  main.ts                   # entrypoint: config, game loop, wiring
  config.ts                 # reads and validates VITE_* env vars
  logger.ts                 # level-based console logger
  startup-error.ts          # error type for a page that cannot start
  rng.ts                    # seeded RNG for rule code
  tick-clock.ts             # real time → ticks due, with speed and pause
  catalog/                  # pieces.ts (stats), waves.ts (enemies per wave)
  board/                    # square.ts, moves.ts (move generation)
  battle/                   # battle-state.ts, create-battle.ts, step.ts
  run/                      # run.ts (run state machine)
  adapters/
    canvas-renderer.ts      # draws the board, pieces and HP bars on a <canvas>
    dom-ui/
      hud.ts                # wave, white pawn count, seed
      battle-controls.ts    # pause and speed buttons
      end-screen.ts         # win / game-over screen with "new run"
tests/                      # mirrors src/
docs/
  spec.md, tickets/, decisions/, screenshots/
```

## Debugging

- Logs go to the browser console, prefixed `[pawn-swarm]`. Default level is `info`.
- Add `?debug=1` to the URL for debug logs, e.g. `http://localhost:5173/?debug=1`. Debug logs show every hit and death with its tick.
- Pause, resume and speed changes are logged at `info` with the tick they happened on.
- **Replaying a battle** — the HUD and the end screen show the run's seed. Put it in `VITE_DEFAULT_SEED`, restart `npm run dev`, and the first run plays out exactly the same. "New run" picks a random seed. Speed and pauses don't change the result, so you can replay at 0.5× to watch a hard moment.
- **"Pawn Swarm could not start: VITE_… is missing"** — there is no `.env`, or it lacks that variable. Run `cp .env.example .env` and restart `npm run dev` (Vite only reads `.env` at startup).
- **"Pawn Swarm stopped: …"** — a rule threw during a battle and the game loop stopped. The console error has the seed, wave and tick; replay that seed (below) with `?debug=1` to see the ticks before it.
- **Blank page, no error** — open the console; a script error before startup would show there.

## Decisions

See `docs/decisions/` for why things are the way they are:

- [0001](docs/decisions/0001-browser-canvas-no-engine.md) — browser demo in TypeScript + Canvas, no game engine
- [0002](docs/decisions/0002-capture-is-an-attack.md) — a capture is an attack; the attacker stays put

## Docs

- `docs/spec.md` — what the demo is
- `GLOSSARY.md` — the game's words
