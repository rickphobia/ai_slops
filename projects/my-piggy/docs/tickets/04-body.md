# 04: The body: urge, outbursts, suppress, give in

**What to build:** The Piggy's body fights them. The **urge** builds on its own, faster while trotting. Warning signs come first: heavier breathing, the camera twitching, a low grunt. Then comes an **outburst**: a snort, a squeal or a lunge. Holding Space **suppresses** it, which slows the Piggy to a crawl, only delays it, and makes the eventual outburst louder. Pressing E at a give-in spot makes the Piggy **give in**: a few uncomfortable seconds that clear the urge quietly and cost hidden **humanity**. Creep and trot are added to walking. All numbers come from the spec's "Rules" section via the tuning table. `?debug=1` shows humanity and urge.

**Blocked by:** 02 (Shareable link), 03 (The house)

**Status:** ready

**Touches:** Body, tuning, Piggy controller (creep, trot, suppress slowdown, lunge, camera twitch, give-in interaction), body sounds, Night (body state in checkpoints), debug overlay (new)

- [ ] Body is a rules class with no scene-tree dependency; tested through Night with a test tuning table
- [ ] Urge rises at rest and faster while trotting; warning signs start at the warning threshold; an outburst happens at the peak if nothing is done (tested)
- [ ] Each suppressed outburst makes the urge rise faster for the rest of the space (tested)
- [ ] Holding suppress at the peak delays the outburst, slows movement, and raises the next outburst's loudness per second held; holding past the limit forces the outburst at that loudness (tested)
- [ ] Giving in at a give-in spot takes a few seconds, drops the urge to 0, costs humanity, makes a quiet noise, and each spot works once per checkpoint (tested)
- [ ] Humanity starts at 100, never rises, and is never shown outside the debug overlay
- [ ] Checkpoints save and restore urge, humanity, the urge rise rate and used give-in spots (tested)
- [ ] Body events carry a position and loudness so the noise ticket can consume them without changing Body
- [ ] Creep (Ctrl or C), walk and trot (Shift) at tuned speeds; lunge outbursts move the Piggy a short distance; outbursts jerk the camera
- [ ] Placeholder sounds for breathing, grunts, snorts, squeals and wet chewing; the give-in camera presses into the bowl and can't look away for its duration
- [ ] `?debug=1` overlay shows humanity and urge; it is off by default
- [ ] All new numbers live in the tuning table and are checked at startup
