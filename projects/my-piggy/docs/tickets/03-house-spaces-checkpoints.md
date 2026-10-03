# 03: The house: three spaces, doors and checkpoints

**What to build:** The Piggy wakes in the bedroom and can make their way through the hallway into the kitchen, nudging doors open with their head. The faster a door is pushed, the louder it creaks. Entering each **space** takes a **checkpoint**. Reaching the kitchen back door ends the **night** with a plain end card. This ticket is the only one that edits the house layout: it also places the markers later tickets attach to, so they never need to edit it.

**Blocked by:** 01 (Walking skeleton)

**Status:** ready

**Touches:** house layout, Night, end card, main

- [ ] Grey-box bedroom, hallway and kitchen as described in the spec (bedroom safe-ish, long hallway, kitchen with a table to hide under and the back door)
- [ ] Doors open when the Piggy pushes them with their head; the creak's loudness depends on push speed (recorded as a door-push noise value for the noise ticket)
- [ ] The walkable area is mapped for Godot pathfinding (Mum will use it)
- [ ] Named markers placed: give-in spots (bedroom bowl, kitchen slop bowl, kitchen bin), the hallway mirror, the back-door glass, Mum's route points, Mum's start point
- [ ] Night tracks the current space; entering a space takes a checkpoint (tested through Night)
- [ ] Restoring a checkpoint puts the Piggy back where and how they were on entering that space (tested through Night; a debug key triggers it in game until being caught exists)
- [ ] Reaching the back door ends the night and shows a plain end card saying this is a first playable and inviting feedback
- [ ] Logs say which space was entered and when a checkpoint is taken or restored
