# 12: Shop stats panel

**What to build:** A How Many Dudes-style stats panel in the shop, so the player can judge their army before spending. One row per pawn type with its count, HP, attack and damage per second; army totals; and the last wave's results.

**Blocked by:** 06

**Status:** done

**Touches:** shop, run, adapters/dom-ui

- [x] One row per owned pawn type: icon, name, count, HP, attack, damage per second (attack ÷ cooldown)
- [x] Army totals: pawns, total HP, total damage per second
- [x] Last wave: black pieces taken, pawns gained, pawns lost, biggest swarm, time taken
- [x] Battle records these numbers as it runs; the panel only reads them (tested)
- [x] Works at phone width (rows stack or scroll inside the panel)
- [x] Screenshot in the PR
