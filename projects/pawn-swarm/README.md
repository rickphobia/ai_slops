# Pawn Swarm

A browser auto-battler on a chess board: your white pawns are your army and your money. Mix of Brotato, How Many Dudes and chess.

## Status

`in progress` — walking skeleton: the page draws an empty 16×16 board. No game rules yet; see `docs/tickets/` for what comes next.

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
npm run check          # everything CI runs except the build: lint, format, type check, tests
npm run lint           # ESLint
npm run format:check   # Prettier (npm run format to fix)
npm run typecheck      # tsc, strict
npm test               # Vitest, once
npx vitest             # Vitest, watch mode
```

CI runs the same checks plus `npm run build` on every push that touches this folder (`.github/workflows/pawn-swarm.yml`).

## Configuration

Vite reads these from `.env` and bakes them into the build. The game checks them on page load and shows an error on the page if one is missing or invalid.

| Variable | Required | What it does |
|----------|----------|--------------|
| `VITE_TICK_MS` | yes | Length of one tick at 1× speed, in milliseconds (1–10000). Spec value: 250. |
| `VITE_BOARD_SIZE` | yes | Files and ranks on the board (4–64). Spec value: 16. |
| `VITE_DEFAULT_SEED` | yes | Seed for a new run when none is given (0–4294967295). |

## How it works

`src/main.ts` loads the config, creates the logger and the canvas renderer, and draws the board. Game rules will live in pure modules (`board`, `battle`, `shop`, `run`) that never touch the DOM; the `adapters/` only draw state and pass player actions in. See `docs/spec.md`.

## Folder layout

```
index.html                  # page shell: canvas + startup error box
src/
  main.ts                   # entrypoint: wires config, logger and renderer
  config.ts                 # reads and validates VITE_* env vars
  logger.ts                 # level-based console logger
  adapters/
    canvas-renderer.ts      # draws the board on a <canvas>
tests/
  config.test.ts
docs/
  spec.md, tickets/, decisions/
```

## Debugging

- Logs go to the browser console, prefixed `[pawn-swarm]`. Default level is `info`.
- Add `?debug=1` to the URL for debug logs, e.g. `http://localhost:5173/?debug=1`.
- **"Pawn Swarm could not start: VITE_… is missing"** — there is no `.env`, or it lacks that variable. Run `cp .env.example .env` and restart `npm run dev` (Vite only reads `.env` at startup).
- **Blank page, no error** — open the console; a script error before startup would show there.

## Docs

- `docs/spec.md` — what the demo is
- `GLOSSARY.md` — the game's words
- `docs/decisions/` — why things are the way they are
