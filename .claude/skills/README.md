# Skills

Project-wide skills for Claude Code. Every session in this repo, local or cloud, loads them.

## Source

All skills here except where noted are adapted from [mattpocock/skills](https://github.com/mattpocock/skills) at commit `d81f3a1` (2026-09-29), MIT licence — see `LICENSE-mattpocock-skills`. The `pr` skill also credits Dex Horthy (see `pr/CREDITS.md`).

The first commit that added them (`Vendor 11 skills from mattpocock/skills (unmodified)`) is the untouched copy, so `git diff` against it shows every change we made.

## What we changed

- Specs, tickets, glossary and decision records live inside each project (`projects/<name>/docs/...`, `projects/<name>/GLOSSARY.md`), not at the repo root or in GitHub Issues.
- Tickets are local files, not GitHub Issues: cloud sessions have no `gh` CLI, and files keep each project's work separate.
- `to-tickets` adds a **Touches** field (to know which tickets can run in parallel) and makes ticket 01 of a new project a walking skeleton.
- `implement` follows this repo's `CLAUDE.md`: blockers check, project-prefixed commits, full checks before commit, review, one PR per ticket.
- `code-review` is renamed `review-diff` (Claude Code has a built-in `code-review`), and reviews against `CLAUDE.md` and the ticket.
- `ADR` is renamed "decision record" in `docs/decisions/`, to match `CLAUDE.md`.
- `setup-matt-pocock-skills` is not included; the conventions above replace it.

## Updating from upstream

1. Clone mattpocock/skills and diff the skill against the commit above.
2. Apply the upstream changes by hand, keeping our changes.
3. Update the commit hash in this file.
