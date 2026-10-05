# 01: Walking skeleton

**What to build:** A new developer can clone the repo, run the commands in the README, and get court-booker running locally and in Docker with `/healthz` answering. Settings are validated at startup, logs are structured, and lint, type checks, tests and the Docker build run locally and in CI. This is the first backend on the Beelink (decision 0001), so the Docker image is part of the skeleton.

**Blocked by:** None (can start immediately)

**Status:** ready

**Touches:** project setup, config, logging, web, entrypoint, docker, CI, README

**Effort:** `medium`

- [ ] Python project managed with `uv`, pinned Python version, committed lock file; `ruff` (lint + format), `mypy --strict` and `pytest` configured
- [ ] Config module loads every setting the spec lists that this ticket uses from environment variables, validates them, and fails at startup with a message naming the bad or missing variable; `.env.example` lists every variable with dummy values
- [ ] JSON-lines logger on stdout with a configurable level
- [ ] FastAPI app served under the `/ai-projects/court-booker/` path prefix, with an unauthenticated `/healthz` that returns OK and no data
- [ ] Thin entrypoint with a `serve` subcommand
- [ ] Dockerfile based on a pinned Playwright Python image; the container starts and `/healthz` answers
- [ ] At least one passing test (config validation) and one through the test client (`/healthz`)
- [ ] `.github/workflows/court-booker.yml` (`name: court-booker`, `paths:` scoped to the project) runs lint, format check, type check, tests and the Docker build, and is green
- [ ] `.claude/settings.json` copied from the root
- [ ] README filled in from the template: install, configure, run, test, Docker, config table, folder layout; status `in progress`
- [ ] Project added to the index in the root README
