---
name: implement
description: "Implement one ticket (or a small spec) end to end: test-first, checked, reviewed, committed and opened as a PR."
disable-model-invocation: true
---

Implement the ticket or spec the user names, usually `projects/<name>/docs/tickets/<NN>-<slug>.md`. One ticket per session, per branch, per PR.

## Before starting

1. Read the ticket, the project's spec in `projects/<name>/docs/`, `projects/<name>/GLOSSARY.md`, and any `CLAUDE.md` in the project. The root `CLAUDE.md` rules apply throughout.
2. Check every ticket in **Blocked by** has status `done`. If any doesn't, stop and tell the user.
3. Work on the branch the session gave you. If there isn't one, create `<project-name>/<NN>-<slug>` from `main`.

## Build

- Use /tdd at the seams agreed in the spec.
- Stay inside the areas the ticket's **Touches** lists. If the work needs to change another area, stop and tell the user: a parallel session may be working there.
- Run type checks and single test files regularly, using the commands in the project README. Run the full lint, type check and test suite at the end. All must pass before you commit.

## Finish

1. Use /review-diff against `main` and fix what it finds. Don't chase judgement-call nits.
2. Tick the acceptance criteria in the ticket file and set its status to `done`.
3. Update the project README and `.env.example` if anything they describe changed.
4. Commit with the project prefix: `<project-name>: <imperative summary>`.
5. Push and open a PR using /pr. Show the user the test output and the PR link.

Never weaken, skip or delete a test to make it pass. If you can't get it green, say what's failing.
