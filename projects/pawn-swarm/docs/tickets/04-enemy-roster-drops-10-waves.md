# 04: Full enemy roster, drops, 10 waves

**What to build:** All black pieces (knight, bishop, rook, queen, king) fight with their chess moves. Killed enemies drop plain pawns on their square during the battle, which fight straight away. A run goes through 10 waves, with the king in wave 10; killing it wins the run. Surviving pawns carry over between waves.

**Blocked by:** 02

**Status:** ready

**Touches:** catalog, board, battle, run

- [ ] Board move generation for bishop, rook, queen and king, with blocking for sliders
- [ ] Enemy stats and drops from the spec table, in the catalog
- [ ] Wave table for waves 1–10 in the catalog; enemies enter from the top 3 ranks
- [ ] Drops spawn on the death square or the nearest free square in the same tick and act from the next tick
- [ ] Plain pawns that reach the back rank turn around and keep fighting
- [ ] Army carries over between waves; killing the king in wave 10 sets the run to `won`
- [ ] Tests cover each piece's moves, drop spawning, carry-over and a scripted run to `won` and to `lost`
