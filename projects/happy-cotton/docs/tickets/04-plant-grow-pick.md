# 04: Plant, grow, pick

**What to build:** The player sees a field of plots from a fixed, angled camera, taps an empty plot to plant cotton, watches it grow through visible stages in real time, taps it to see how long is left, and picks it when ripe, clearing the plot to plant again. On a phone held upright, a prompt asks them to turn it sideways. This ticket creates the Farm rules seam the rest of the game is built on (spec: stories 11, 14–21, 80; "Modules": Farm rules).

**Blocked by:** 01 (Walking skeleton)

**Status:** done

**Touches:** rules, config/tuning, adapters/field, entrypoint

**Effort:** medium

- [x] Farm rules object with no scene tree, clock or file access, created with a tuning table
- [x] Commands plant and pick, each returning whether it happened and why not (for example "not empty", "not ripe")
- [x] Advance by seconds of online play moves growth through its stages; read-only plot views give stage and time left
- [x] Grow time comes from the tuning table (starting value 3 minutes); the test tuning table uses small round numbers
- [x] GUT tests drive the rules only through the public interface: plant, grow through each stage, pick when ripe, refuse to pick unripe or plant on a full plot
- [x] Field scene with tappable plots that work by touch and mouse alike, placeholder shapes for plots and growth stages, and the time left shown on tap
- [x] "Rotate your phone" overlay in portrait
- [x] Plant and pick are logged at debug level
