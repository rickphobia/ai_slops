# 04: Real-time battle core

**What to build:** The battle becomes the prototype's real-time swarm, with knights only. One pawn starts in the middle of the 20×14 board; the whole wave of knights lands at once after red warning squares; pawns walk straight (never diagonally) toward the nearest knight and strike it; knights L-jump after a 0.4s red warning and hit the 3×3 block where they land; touching a knight hurts; every kill drops plain pawns on the spot, shrunk by crowding. Waves 1 and 2 play through to the existing win/lose flow. Speed (0.5×–2×) and pause from ticket 03 keep working.

**Blocked by:** 03

**Status:** done

**Touches:** battle, board, catalog, run, adapters/canvas-renderer, adapters/dom-ui, entrypoint

Replaces the tick-based battle from tickets 02–03 (decision 0002). Use `docs/prototype/swarm-prototype.html` as the reference for behaviour and numbers.

- [x] `step(state, inputs)` advances one 1/60s step; pure, seeded RNG in state; same seed gives the same battle (tested)
- [x] Positions are continuous board units; black pieces stay on square centres
- [x] White pawns move along one axis at a time with the 30% switch rule (tested: no step changes both x and y), push apart, and strike in range on cooldown
- [x] Army placed in a spiral around the centre at wave start
- [x] Whole wave lands at once on distinct squares away from the centre, after a 1.2s warning
- [x] Knight moves: 0.4s warning, then L-jump; pawns on the 3×3 landing squares are hit, pawns off them aren't (tested)
- [x] Contact damage: 1 every 1.5s to pawns touching a black piece (tested)
- [x] Drops spawn on the death square mid-battle and burst outward; crowding formula applied (tested)
- [x] Spatial grid for "pawns near a point"; 300 pawns stay smooth at 60 fps in a browser
- [x] Renderer: 20×14 board drawn large and sharp (2× resolution), bigger pawn glyphs, HP bars, warning squares, damage numbers, death bursts, "+n ♟" pop-ups, pawn counter bump
- [x] Battle events (hit, death, drop) drive the effects; rules don't compute visuals
- [x] Screenshot in the PR
