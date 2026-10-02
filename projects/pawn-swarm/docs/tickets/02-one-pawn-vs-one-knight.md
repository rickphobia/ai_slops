# 02: One pawn vs one knight

**What to build:** Starting a run places 1 plain pawn against wave 1 (a single knight). The battle plays out on its own using chess moves and HP damage, and ends in a win screen or a game-over screen, each with a "new run" button.

**Blocked by:** 01

**Status:** done

**Touches:** catalog, board, battle, run, adapters/canvas-renderer, adapters/dom-ui, entrypoint

- [x] Catalog holds plain pawn and knight stats (HP, attack, cooldown) and wave 1 as data
- [x] Board generates legal pawn moves (forward one, capture diagonally forward) and knight moves (L-jump over blockers)
- [x] `createBattle` and `step(state, inputs)` are pure; a capture deals attack as damage; pieces die at 0 HP (`step` takes no `inputs` yet: there are no skills to pass until ticket 06)
- [x] Knight moves toward the nearest white pawn; ties broken by the seeded RNG; no `Math.random` in rule code
- [x] Same seed gives the same battle (tested)
- [x] Renderer draws pieces with chess glyphs and HP bars
- [x] Run state machine reaches `won` or `lost`; end screens show the result, seed and "new run"
- [x] Tests cover move generation, damage, death, wave end and determinism
