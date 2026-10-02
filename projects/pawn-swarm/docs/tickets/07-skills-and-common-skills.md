# 07: Skills and common skills

**What to build:** During battle, one skill button per pawn type on the board, with hotkeys 1–9 and a cooldown in seconds. Pressing it fires the skill for every pawn of that type. Skills work while paused and fire on the next step. Charge, Hold the line, Volley and Fork work.

**Blocked by:** 06

**Status:** ready

**Touches:** skills, battle, adapters/dom-ui, entrypoint

- [ ] Skills module tracks cooldowns and validates a use; pure
- [ ] Skill uses are recorded as inputs (step, skill); same seed + same inputs replays the same battle (tested)
- [ ] Buttons show cooldown; hotkeys 1–9 in button order; Space toggles pause
- [ ] Charge, Hold the line, Volley, Fork match the spec (tested)
- [ ] Cooldowns block early reuse (tested)
- [ ] Screenshot in the PR
