---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, written as one file per ticket in the project's docs/tickets folder.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

Tickets are files in the project, not GitHub issues, so they work in every session and stay with their project. If it's unclear which project under `projects/` this is for, ask.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a spec path as an argument, read it in full.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the vocabulary in `projects/<name>/GLOSSARY.md`, and respect the decision records in `projects/<name>/docs/decisions/`.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first
- **For a new project, ticket 01 is always the walking skeleton:** the project installs, runs, has one passing test, and lint, type checks and CI are green. Every other ticket is blocked by it.

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

Also give each ticket the **areas it touches**: the modules or folders it will most likely change, named at module level (`adapters/model`, `summarizer`), not file paths. Two unblocked tickets can run in parallel only if their areas don't overlap; otherwise one must block the other.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **Touches**: the areas it will likely change
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Which tickets can run in parallel (unblocked and touching different areas)? Show these as batches.
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Write the tickets

Write one file per approved ticket at `projects/<name>/docs/tickets/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Continue the numbering if tickets already exist. Use the template below: one ticket per file, never a single combined file.

Work the **frontier**: any ticket whose blockers are all `done`. For a purely linear chain that means top to bottom.

Commit the ticket files on their own (`<name>: Add tickets for <feature>`) so every parallel session starts from the same list.

<ticket-template>

# <NN>: <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Status:** ready

**Touches:** the areas (modules or folders) this ticket will likely change.

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

</ticket-template>

Status is `ready` or `done`. The ticket's own PR sets it to `done` and ticks the criteria, so the status merges together with the code.


Avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
