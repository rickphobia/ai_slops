# 12: Shop stats panel

**What to build:** A How Many Dudes-style stats panel in the shop, so the player can judge their army before spending. One row per pawn type with its count, HP, attack and damage per second; army totals; and the last wave's results.

**Blocked by:** 06

**Status:** ready

**Touches:** shop, run, adapters/dom-ui

- [ ] One row per owned pawn type: icon, name, count, HP, attack, damage per second (attack ÷ cooldown)
- [ ] Army totals: pawns, total HP, total damage per second
- [ ] Last wave: black pieces taken, pawns gained, pawns lost, biggest swarm, time taken
- [ ] Battle records these numbers as it runs; the panel only reads them (tested)
- [ ] Works at phone width (rows stack or scroll inside the panel)
- [ ] Screenshot in the PR
