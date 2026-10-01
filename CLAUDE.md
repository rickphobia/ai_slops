# CLAUDE.md

This repo holds many independent AI projects. Read `README.md` for the layout.

## When working here

- Find out which project the task is about. Work only inside `projects/<name>/` unless the task is about the repo itself.
- Never import or reference code from another project. Each project must run on its own.
- Install dependencies inside the project folder, never at the repo root.
- Run commands from the project folder (`cd projects/<name>`).
- If the project has its own `CLAUDE.md`, follow it as well.

## When creating a new project

1. Create `projects/<name>/` (lowercase, hyphens).
2. Copy `templates/project/README.md` into it and fill it in.
3. Add a row to the project index in the root `README.md`.

## When finishing work on a project

- Update that project's README if how to run it, or its status, changed.
- Update its status in the root index if it changed.
