# 06: Skills and common skills

**What to build:** During a battle the HUD shows one skill button per pawn type on the board, with hotkeys 1–9 and a visible cooldown. Pressing it fires the skill for every pawn of that type. Skills work while paused and fire on the next tick. Plain pawn (Charge), Shield (Hold the line), Spear (Volley) and Twin (Fork) skills work.

**Blocked by:** 03, 05

**Status:** ready

**Touches:** skills, battle, adapters/dom-ui, entrypoint

- [ ] Skills module tracks cooldowns and validates a use (ready, legal target); pure
- [ ] Skill uses are recorded as inputs (tick, skill, target); same seed + same inputs replays the same battle (tested)
- [ ] Buttons show cooldown in seconds; hotkeys 1–9 map to buttons in order
- [ ] Using a skill while paused queues it for the next tick
- [ ] Charge, Hold the line, Volley and Fork match the spec (tested)
- [ ] Cooldowns block early reuse (tested)
