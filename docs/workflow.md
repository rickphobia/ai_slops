# How we work with Claude Code

Distilled 2026-10-01 from Anthropic's [best practices](https://code.claude.com/docs/en/best-practices), Harper Reed's codegen workflow, and talks by Boris Cherny (creator of Claude Code), Matt Pocock, Dex Horthy and Andrej Karpathy. Reddit and YouTube pages were blocked from the research environment; talk content came from published transcripts.

Experienced engineers all land on the same loop: **spec → plan → build in small steps → verify → review → commit.** The difference between "vibe coding" and real engineering is that you stay responsible for the code — you read it.

## The loop

1. **Spec.** Have Claude interview you one question at a time until the idea is clear, then write `docs/spec.md`. Start a fresh session to build from it.
2. **Plan.** Use plan mode (Shift+Tab). Break the spec into thin vertical slices — each one works end to end (a tiny feature through every layer), not "all the database code, then all the UI". Save the checklist in `docs/plan.md` so progress survives across sessions. Skip planning only if the diff fits in one sentence.
3. **Build one slice per loop.** Write the test first, watch it fail, make it pass, commit, tick the box, stop for review.
4. **Verify.** Claude must run something that proves it works — tests, the app, a screenshot. Boris Cherny says this alone 2–3x's output quality.
5. **Review in a fresh context.** A second session or review subagent checks the diff against the plan. Don't chase every nit — that's how over-engineering starts.
6. **Commit, then `/clear`** before the next slice.

## Habits that prevent slop

- **Read the code, not just the plan.** Dex Horthy's team stopped reading code for six months and had to rip out large parts.
- **Keep context small.** Quality drops once the context is ~40% full. Use `/clear` between tasks, subagents for research, and after two failed corrections, `/clear` and restate the problem instead of arguing.
- **Keep CLAUDE.md short.** Under ~200 lines. For each line ask "would Claude make a mistake without this?" Add a line each time Claude gets something wrong; prune after model upgrades.
- **Turn hard rules into hooks.** CLAUDE.md is advice; hooks always run. Use them for format/lint after edits and blocking `rm -rf` or `.env` access.
- **Guard the tests.** Commit tests before the code that passes them. Agents have been caught mocking, editing or hard-coding tests to go green.
- **Give it the docs.** Paste URLs or use Context7 so it doesn't invent APIs.
- **Security for anything deployed:** no API keys in frontend code, database access rules switched on. These are the most common holes in AI-built apps.

## Parallel work (later)

Once the loop feels natural: run several sessions at once, each in its own git worktree or cloud session, each on a separate slice.
