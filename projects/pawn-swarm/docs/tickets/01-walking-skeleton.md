# 01: Walking skeleton

**What to build:** A new developer can clone the repo, run the commands in the README, and see an empty 16×16 chess board in the browser. Lint, type checks and tests run locally and in CI.

**Blocked by:** None (can start immediately)

**Status:** done

**Touches:** project setup (package and tool config), config, logger, adapters/canvas-renderer, entrypoint, CI workflow, README

- [x] TypeScript (strict), Vite, Vitest, ESLint and Prettier set up with pinned versions and a committed lock file
- [x] Config module reads tick length, board size and default seed from env vars, validates them, and fails fast with a clear message; `.env.example` lists every variable
- [x] Level-based logger; `?debug=1` turns on debug level
- [x] Canvas draws an empty 16×16 board
- [x] One passing test (config validation)
- [x] `.github/workflows/pawn-swarm.yml`, scoped to `projects/pawn-swarm/**`, runs lint, type check and tests, and is green
- [x] README filled in from the template: install, run, test, config table, folder layout; status set to `in progress`
