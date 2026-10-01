# How we work with Claude Code

Distilled 2026-10-01 from Anthropic's [best practices](https://code.claude.com/docs/en/best-practices), Harper Reed's codegen workflow, and talks by Boris Cherny (creator of Claude Code), Matt Pocock, Dex Horthy and Andrej Karpathy. The skills are adapted from [mattpocock/skills](https://github.com/mattpocock/skills) and live in `.claude/skills/`.

Experienced engineers all land on the same loop: **spec → plan → build in small steps → verify → review → merge.** The difference between "vibe coding" and real engineering is that you stay responsible for the code — you read it.

## The loop

| # | Step | You type | What you get |
|---|------|----------|--------------|
| 1 | Start a cloud session on `main` | "New project: `pdf-summarizer`" (or "work on `projects/pdf-summarizer`") | Claude knows which folder it owns |
| 2 | Describe it | What you want and what the finished product looks like | — |
| 3 | Get grilled | `/grill-with-docs` | Rounds of numbered questions, each with a recommended answer. Builds `GLOSSARY.md` and decision records as you go |
| 4 | Write the spec | `/to-spec` | `docs/spec.md`. **Read it.** |
| 5 | Split into tickets | `/to-tickets` | `docs/tickets/01-…md`, `02-…md`, each with **Blocked by** and **Touches**, plus which can run in parallel. You approve the breakdown |
| 6 | Build the skeleton | New session: `/implement projects/<name>/docs/tickets/01-…md` | Project runs, one test passes, CI green. One PR |
| 7 | Build in parallel | One new session per unblocked ticket: `/implement <ticket path>` | One PR per ticket |
| 8 | Review and merge | Read each PR's code, then merge | Tickets marked `done` on `main` |
| 9 | Repeat 7–8 | Until all tickets are `done` | — |

New feature on an existing project: start again at step 2 — `/to-spec` writes `docs/specs/<feature>.md` and `/to-tickets` continues the numbering.

Bug: `/diagnosing-bugs`. It builds a failing check first, then fixes.

## Rules for parallel work

- Only run tickets in parallel when all their blockers are `done` **and** their **Touches** don't overlap. Two sessions editing the same area is like two painters on the same wall.
- Each parallel ticket gets its own fresh session, branch and PR.
- Merge one PR at a time. If the next one conflicts, ask its session to merge `main` in and re-run the checks.

## Habits that prevent slop

- **Read the code, not just the plan.** Dex Horthy's team stopped reading code for six months and had to rip out large parts.
- **Fresh session per ticket.** Quality drops once the context is ~40% full. After two failed corrections, `/clear` and restate the problem instead of arguing.
- **Keep CLAUDE.md short.** For each line ask "would Claude make a mistake without this?" Add a line each time Claude gets something wrong; prune after model upgrades.
- **Turn hard rules into hooks.** CLAUDE.md is advice; hooks always run. Use them for format/lint after edits and for blocking `rm -rf` or `.env` access.
- **Guard the tests.** Agents have been caught mocking, editing or hard-coding tests to go green. `/review-diff` checks the diff against the ticket.
- **Give it the docs.** Paste URLs or use Context7 so it doesn't invent APIs.
- **Security for anything deployed:** no API keys in frontend code, database access rules switched on. These are the most common holes in AI-built apps.

## Skills reference

| Skill | Use it to |
|-------|-----------|
| `/grill-with-docs` | Get interviewed about an idea; records glossary terms and decisions |
| `/grilling` | Same interview, without writing docs |
| `/to-spec` | Turn the conversation into a spec file |
| `/to-tickets` | Turn a spec into ticket files with blockers and parallel batches |
| `/implement` | Build one ticket end to end and open a PR |
| `/tdd` | Test-first loop (used by `/implement`) |
| `/review-diff` | Review a diff against `CLAUDE.md` and the ticket |
| `/pr` | Write a PR description with evidence and risk |
| `/diagnosing-bugs` | Debug with a failing check first |
| `codebase-design`, `domain-modeling` | Reference vocabulary the other skills load |
