# 05: Full black army and 10 waves

**What to build:** Bishops, rooks, queens and the king join the battle with their chess moves and square hits, and a full run goes through all 10 waves from the spec table. Each wave lands in 3 pushes. The board becomes 16×11 and the game runs at the spec's 0.65 pace, with the spec's black HP values. Killing the king in wave 10 wins. End screens show wave reached, biggest swarm and pieces taken. A headless script plays N runs with a simple bot and prints win rate and peak swarm.

**Blocked by:** 04

**Status:** ready

**Touches:** board, battle, catalog, run, adapters/dom-ui, balance script

The paused old-ticket-04 branch `pawn-swarm/04-enemy-roster-drops-10-waves` has tested move generation for every piece; reuse it if it fits.

- [ ] Bishop, rook, queen move generation with reach limits; king one square (tested)
- [ ] Sliders hit every square they pass through; king hits the 3×3 landing block (tested)
- [ ] King calls 3 knights next to him every 6s, with warnings
- [ ] Shield-first targeting placeholder: pieces target the nearest pawn (shields come in 06)
- [ ] Black HP and HP growth per wave from the catalog (spec values); wave table 1–10 in the catalog
- [ ] Waves land in 3 pushes; next push at 25% left or after 25 game seconds; king in the last push; landing squares avoid white pawns (tested)
- [ ] Board 16×11; pace 0.65 game seconds per real second at 1×, never changing results (tested)
- [ ] Survivors carry over between waves at full HP; run reaches `won` on the king's death, `lost` at zero pawns (scripted tests)
- [ ] End screens with wave reached, biggest swarm, pieces taken, seed, "New run"
- [ ] `npm run balance` (or similar) plays N headless runs and prints win rate, waves reached and peak swarm; documented in the README
