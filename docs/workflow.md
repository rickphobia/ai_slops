# How we work with Claude Code

Distilled 2026-10-01 from Anthropic's [best practices](https://code.claude.com/docs/en/best-practices), Harper Reed's codegen workflow, and talks by Boris Cherny (creator of Claude Code), Matt Pocock, Dex Horthy and Andrej Karpathy. The skills are adapted from [mattpocock/skills](https://github.com/mattpocock/skills) and live in `.claude/skills/`.

Experienced engineers all land on the same loop: **spec → plan → build in small steps → verify → review → merge.** The difference between "vibe coding" and real engineering is that you stay responsible for the code — you read it.

## The loop

| # | Step | You type | What you get |
|---|------|----------|--------------|
| 1 | Start a session on `main`: in the cloud (claude.ai/code), or on the Beelink in `~/homelab/code/ai_slops` | "New project: `pdf-summarizer`" (or "work on `projects/pdf-summarizer`") | Claude knows which folder it owns |
| 2 | Describe it | What you want and what the finished product looks like | — |
| 3 | Get grilled | `/grill-with-docs` | Rounds of numbered questions, each with a recommended answer. Builds `GLOSSARY.md` and decision records as you go |
| 4 | Write the spec | `/to-spec` | `docs/spec.md`. **Read it.** |
| 5 | Split into tickets | `/to-tickets` | `docs/tickets/01-…md`, `02-…md`, each with **Blocked by** and **Touches**, plus which can run in parallel. You approve the breakdown |
| 6 | Build the skeleton | New session: `/implement projects/<name>/docs/tickets/01-…md` | Project runs, one test passes, CI green. One PR |
| 7 | Build in parallel | One new session per unblocked ticket: `/implement <ticket path>` | One PR per ticket |
| 8 | Review and merge | Try the PR's `▶ Try this version` link if it has one, skim the diff, check its `Review:` line, then merge. GitHub only allows it once `ci-gate` is green | Tickets marked `done` on `main` |
| 9 | Deploy | On the Beelink: `projects/<name>/deploy/update-site.sh`, or ask a local session to run it | Live at `rickphobia.com/ai-projects/<name>/` |
| 10 | Repeat 7–9 | Until all tickets are `done` | — |

New feature on an existing project: start again at step 2 — `/to-spec` writes `docs/specs/<feature>.md` and `/to-tickets` continues the numbering.

Bug: `/diagnosing-bugs`. It builds a failing check first, then fixes.

## Rules for parallel work

- Only run tickets in parallel when all their blockers are `done` **and** their **Touches** don't overlap. Two sessions editing the same area is like two painters on the same wall.
- Each parallel ticket gets its own fresh session, branch and PR. Two small tickets of the same kind can share one session to save its start-up cost.
- **On the Beelink, each parallel session needs its own worktree.** Cloud sessions each get their own clone; local sessions share `~/homelab/code/ai_slops` and would switch branches under each other. Start the extra ones from the repo root with `claude -w <project>-<NN>`: a worktree under `.claude/worktrees/`, on its own branch from `origin/main`, removed when you exit if it has nothing unsaved.
- Each ticket's session watches its own PR until it is green and mergeable: it fixes merge conflicts (by merging `main` in) and failing CI by itself, so a PR only waits on you once it is green. A cloud session keeps watching until merge and answers review comments; a local one runs `gh pr checks --watch`, tells you it is ready, and stops (reopen it with `claude --resume` to answer comments). You still review and merge.
- Merge one PR at a time; merging one can make the next conflict, and its session then fixes that.

## What protects `main`

You won't read every line of a 2,000-line PR, so automation carries most of the checking:

- **`ci-gate`** is the one required check. It waits for every other workflow run on the PR's head commit and fails if any fails, or if a changed project's workflow never ran. It reports once: if you re-run a failed workflow by hand, re-run `ci-gate` after it.
- **Ticket size.** `/to-tickets` aims for about 500 hand-written changed lines per ticket, so a PR can be skimmed.
- **Review line.** Every PR body says which review ran: `/review-diff` for big or core-rule changes, a self-review for small ones.
- **Guardrails.** `.claude/settings.json` (copied into each project, because a session reads it only from the folder it starts in) blocks reading `.env` files and asks before force-pushes, `git reset --hard`, `git clean -f`, `git branch -D` and `rm -rf`.

## Keeping token use down

Each step in a session re-reads everything the session has seen so far, so long sessions get expensive fast.

- **Opus 5.5 for everything; pick the effort, not the model.** Opus costs twice Sonnet per token but needs fewer tokens per task, so per finished task it is as cheap or cheaper at the same quality (Artificial Analysis, 2026-10: Opus low 42 points for $0.55 vs Sonnet medium 41 for $0.59; Opus medium 51 for $1.34 vs Sonnet high 47 for $1.08). Use **medium** for grilling, `/to-spec`, `/to-tickets` and hard tickets (walking skeletons, tricky logic), **low** for small tickets. If a low ticket needs more than one fix round, move it to medium. Avoid high and above unless a ticket keeps failing: cost climbs fast for little gain. Re-check when new models ship.
- **Keep the saved default at medium.** `/effort <level>` is saved as the default for every new session, so raising it for one hard task raises it for all of them. Set it back with `/effort medium` when that task is done.
- **Keep sessions short.** Start a fresh session when the topic changes or the old one has run all day. Ticket files hold the status (`ready` / `done`), so nothing is lost. The planning session ends once the tickets are committed; changes to the workflow itself get their own short session.
- **Watch a PR only when it matters.** Every GitHub event adds a few thousand tokens that are re-read for the rest of the session. For a small change, skip the watching and check CI yourself. The planning session never watches PRs; a second watcher doubles the cost.
- **Batch small changes.** Collect small fixes (a rename, a doc line) into one session instead of one session each.
- **`/review-diff` only for big tickets** (see `/implement`). It starts two extra sessions.
- **No agents or multi-agent workflows in parallel** unless the owner asks. Each one has its own full cost.
- **Keep `CLAUDE.md` short.** It is loaded into every session, so each extra line is paid for every time.
- **Check where the money goes** on the account usage page (cost per session and model) before guessing.

## Habits that prevent slop

- **Read the code, not just the plan.** Dex Horthy's team stopped reading code for six months and had to rip out large parts.
- **Fresh session per ticket.** Quality drops once the context is ~40% full. After two failed corrections, `/clear` and restate the problem instead of arguing.
- **Keep CLAUDE.md short.** For each line ask "would Claude make a mistake without this?" Add a line each time Claude gets something wrong; prune after model upgrades.
- **Turn hard rules into settings.** CLAUDE.md is advice; permission rules in `.claude/settings.json` always apply (see "What protects `main`"). Format and lint run in CI and before every commit. Reach for a hook only when a rule needs logic a permission pattern can't express.
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
| `/implement` | Build one ticket end to end, open a PR and keep it green until you merge |
| `/tdd` | Test-first loop (used by `/implement`) |
| `/review-diff` | Review a diff against `CLAUDE.md` and the ticket |
| `/pr` | Write a PR description with evidence and risk |
| `/diagnosing-bugs` | Debug with a failing check first |
| `codebase-design`, `domain-modeling` | Reference vocabulary the other skills load |
