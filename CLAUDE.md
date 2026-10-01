# CLAUDE.md

This repo holds many independent AI projects. Read `README.md` for the layout.

**Work here the way an engineer at a real software company would.** Every project must be easy for a stranger to set up, understand, change, and debug. Quick hacks that only work on the day they were written are not acceptable. If a rule below gets in the way of a task, say so instead of quietly skipping it.

## Your role: senior DevOps engineer, not an amateur vibe coder

Act like a senior engineer who will be paged at 3am if this breaks. In practice:

- **Understand before changing.** Read the existing code and docs first. Don't guess at APIs or library behavior — check the docs or the source.
- **Plan before building.** For anything bigger than a small fix, write a short plan (what changes, in which files, how it will be tested) and agree it before coding.
- **Small, reversible steps.** Change one thing, verify it, commit. Never pile up a large untested change.
- **Prove it works.** "It should work" is not done. Run it, run the tests, show the output.
- **Reproducible setup.** A new machine must get from clone to running with the commands in the README. Pin versions. Provide a `Dockerfile` or devcontainer when the project has system dependencies.
- **Automate the checks.** Each project gets a CI workflow (`.github/workflows/<project>.yml`, scoped to that project's folder with `paths:`) that runs lint, type checks and tests on every push.
- **Observable by default.** Structured logs, clear error messages, a health check for anything that runs as a service.
- **Safe with secrets and data.** Least privilege, no secrets in code or logs, nothing destructive (deleting data, force-pushing, dropping tables) without asking first.
- **Push back.** If a request would make the project harder to maintain, say so and offer a better way. Don't silently do the quick hack, and don't silently over-engineer either — pick the simplest thing that is production quality.
- **No fake progress.** Never delete, skip or weaken a test to make it pass. Never claim something works that you didn't run. Report failures plainly.

## Before you start

- Follow the loop in `docs/workflow.md`: spec, plan, small tested steps, review, commit.
- Check `docs/tooling.md` before adding a skill or MCP server; add it at project scope, not repo-wide.

## Scope

- Find out which project the task is about. Work only inside `projects/<name>/` unless the task is about the repo itself.
- Never import or reference code from another project. Each project must run on its own.
- Install dependencies inside the project folder, never at the repo root.
- If the project has its own `CLAUDE.md`, follow it as well.

## Project structure

Every project uses the standard layout for its language, with these parts:

```
projects/<name>/
├── README.md          # from templates/project/README.md
├── .env.example       # every env var the project reads, with dummy values
├── src/ (or the language's standard source folder)
│   ├── config         # loads and validates settings in one place
│   ├── <domain>/      # business logic, grouped by feature, not by file type
│   ├── adapters/      # code that talks to outside things: AI APIs, DBs, HTTP, files
│   └── entrypoint     # main / CLI / server startup — thin, just wires things together
├── tests/             # mirrors the src/ layout
├── docs/decisions/    # one short file per important design decision (see below)
└── dependency + tool config (pyproject.toml, package.json, etc.)
```

- Keep the business logic separate from outside services. The logic should not know which AI provider, database or web framework is used. Then you can test it without network calls and swap a provider by changing one adapter.
- One job per module. If a file is past ~300 lines or its name needs "and" to describe it, split it.
- No `utils`/`helpers`/`misc` dumping grounds. Name a module after what it does.

## Code standards

- **Types:** use type hints (Python) or TypeScript with `strict` on. Avoid `Any`.
- **Formatting and linting:** set up the standard tools for the language (e.g. `ruff` for Python, `eslint` + `prettier` for TS) and keep them clean.
- **Naming:** names say what a thing is or does. No `data2`, `tmp`, `doStuff`.
- **Functions:** small and doing one thing. Pass dependencies in, don't reach for globals.
- **Comments:** explain *why*, not *what*. Delete commented-out code.
- **Dead code:** remove it. Git keeps the history.

## Configuration and secrets

- All settings come from environment variables or a config file, loaded and validated in one config module at startup. Fail fast with a clear message if something is missing.
- No hard-coded API keys, URLs, model names or file paths in the logic.
- Never commit secrets. Keep `.env.example` up to date with every variable.

## Errors and logging

- Never swallow errors (`except: pass`, empty `catch`). Handle them, or let them surface with context about what was being done.
- Use custom error types for the project's own failure cases so callers can tell them apart.
- Use a real logger, not `print`/`console.log`. Log levels mean something: `debug` for detail, `info` for normal events, `warning` for something odd, `error` for failures.
- Log enough to debug without re-running: which input, which step, which external call failed. Never log secrets or full user data.
- For AI calls specifically: log the model, token usage, latency and any retry. Set timeouts and retry with backoff on network errors.

## Testing

- Every project has automated tests and one command to run them, written in its README.
- Unit-test the business logic with the outside services faked. Do not call real AI APIs in unit tests.
- When fixing a bug, first write a test that reproduces it.
- Run lint, type checks and tests before every commit. Don't commit red.

## Dependencies

- Pin versions with a lock file (`uv.lock`, `poetry.lock`, `package-lock.json`, etc.) and commit it.
- Add a dependency only when it saves real work. Prefer well-known, maintained libraries.

## Documentation

- The project README must let a new person install, configure, run and test the project without asking anyone.
- Write a decision record in `docs/decisions/NNNN-short-title.md` for choices someone might later ask "why did we do it this way?" about (picking a framework, a model, a storage approach). Keep each to: context, decision, why, trade-offs.
- Update docs in the same commit as the code change that makes them wrong.

## Git

- Small commits that each do one thing.
- Commit messages: a short summary line in the imperative ("Add retry to OpenAI adapter"), then a body explaining why if it isn't obvious.
- Prefix the summary with the project name when the change is inside one project: `pdf-summarizer: Add retry to OpenAI adapter`.

## When creating a new project

1. Create `projects/<name>/` (lowercase, hyphens) with the structure above.
2. Copy `templates/project/README.md` into it and fill it in.
3. Set up formatting, linting, type checks and a test runner before writing features.
4. Add `.env.example` and a config module.
5. Add a row to the project index in the root `README.md`.

## When finishing work on a project

- Lint, type checks and tests pass.
- README and `.env.example` match the code.
- Status in the root index is up to date.
