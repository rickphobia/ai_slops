# 07: Skills and common skills

**What to build:** During battle, one skill button per pawn type on the board, with hotkeys 1–9 and a cooldown in seconds. Pressing it fires the skill for every pawn of that type. Skills work while paused and fire on the next step. Charge, Hold the line, Volley and Fork work.

**Blocked by:** 06

**Status:** done

**Touches:** skills, battle, adapters/dom-ui, entrypoint

- [x] Skills module tracks cooldowns and validates a use; pure
- [x] Skill uses are recorded as inputs (step, skill); same seed + same inputs replays the same battle (tested)
- [x] Buttons show cooldown; hotkeys 1–9 in button order; Space toggles pause
- [x] Charge, Hold the line, Volley, Fork match the spec (tested)
- [x] Cooldowns block early reuse (tested)
- [x] Screenshot in the PR
