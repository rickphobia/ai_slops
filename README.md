# ai_slops

A home for the AI projects I build with Claude Code. Each project lives in its own folder and stands on its own.

Think of this repo as a bookshelf: every project is a separate book. Books sit side by side, but you can pull one off and read it without the others.

## Layout

```
ai_slops/
├── README.md            # this file: what the repo is and the project index
├── CLAUDE.md            # rules Claude Code follows when working here
├── projects/
│   └── <project-name>/  # one folder per project, fully self-contained
│       ├── README.md    # what it is, how to run it, current status
│       └── ...          # the project's own code, deps, config
└── templates/
    └── project/
        └── README.md    # starting point for a new project's README
```

## Rules

1. **One folder per project** under `projects/`. Use lowercase with hyphens: `projects/pdf-summarizer`.
2. **No sharing between projects.** A project never imports code from another project. If two need the same thing, copy it.
3. **Each project manages its own dependencies** (`package.json`, `requirements.txt`, etc.) inside its own folder. Nothing is installed at the repo root.
4. **Each project has a README** based on `templates/project/README.md`.
5. **Each project is built to company standards**: clear structure, tests, typed code, real logging, no hard-coded secrets. The full rules are in `CLAUDE.md`.
6. **Add the project to the index below** when you create it.

## Starting a new project

```bash
mkdir projects/my-project
cp templates/project/README.md projects/my-project/README.md
```

Then fill in the README and add a row to the index.

## Project index

| Project | What it does | Stack | Status |
|---------|--------------|-------|--------|
| _none yet_ | | | |

Status values: `idea`, `in progress`, `working`, `abandoned`.
