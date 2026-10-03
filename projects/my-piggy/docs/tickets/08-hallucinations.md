# 08: Hallucinations

**What to build:** **Humanity** becomes something the player can feel. **Pig vision** gets blurrier and more washed out as humanity drops, and the Piggy's breathing and heartbeat sound more like a pig's. **Slop** looks and sounds like rotten slop at high humanity. Below the threshold it shows as the player's favourite snacks, swapping only while nobody is looking at it. The hallway mirror shows the Piggy's old human body for a moment before flickering to the truth. At low humanity it shows only the pig. The end card's line of text and the reflection in the back-door glass change with humanity.

**Blocked by:** 04 (The body), 05 (Look and atmosphere)

**Status:** ready

**Touches:** Hallucinations, look (pig vision post-effect), slop bowl and mirror objects, breathing sound sets, end card

- [ ] Hallucinations is a rules class: given humanity and whether an object is in view, it decides what each lying object shows, how strong pig vision is, and which breathing set plays (tested, including the threshold edges)
- [ ] A lying object never changes while in view (tested)
- [ ] Slop bowls show slop or snacks by humanity; the chewing sound changes with them
- [ ] The hallway mirror shows the old body then flickers to the pig at high humanity, and only the pig below the threshold (placeholder models are fine)
- [ ] Pig vision post-effect strength follows humanity and works in the web export
- [ ] Breathing and heartbeat sound sets switch with humanity
- [ ] End card text and the back-door glass reflection have at least two humanity variants
- [ ] All thresholds live in the tuning table
- [ ] PR says how to try it (e.g. give in at every spot, then visit the mirror)
