# 03: Battle controls and HUD

**What to build:** During a battle the player can pause and set speed to 0.5×, 1×, 1.5× or 2×, and sees the wave number, pawn count and run seed.

**Blocked by:** 02

**Status:** done

**Touches:** adapters/dom-ui, entrypoint

- [x] Speed buttons change real time per tick without changing battle results (same seed, same outcome at every speed)
- [x] Pause stops ticks; resume continues from the same state
- [x] HUD shows wave, white pawn count and seed, updated every tick
- [x] Screenshot of the HUD in the PR
