# 09: Rot

**What to build:** The house **rots** as **humanity** drops, as a **hallucination**. Each **space** shows one of three rot stages. **Cosy**: a warm family home at night, with amber lamps, saturated colours, kids' drawings and family photos, a ticking clock and a TV murmuring through a wall. **Soured**: sour colours, stains, grime and flies. **Grotesque**: wet meat walls, sickly green-brown lamps, family photos with pig faces, dripping and wet breathing in the walls. A space changes stage only while the player isn't looking at it. Only colours, textures, props and sounds change: how dark the hiding places are stays the same at every stage, so stealth is equally hard throughout. Being caught restores the checkpoint's humanity, and the rot follows it.

**Blocked by:** 08 (Hallucinations)

**Status:** ready

**Touches:** Hallucinations (rot stage), look (rot sets), house lighting (lamp colours), house props, ambient sound, debug overlay (rot stage)

- [ ] Hallucinations decides each space's rot stage from humanity and whether the space is in view (tested, including the threshold edges and "never changes while in view")
- [ ] Being caught puts the rot back to the checkpoint's stage (tested through Night)
- [ ] Each space has a cosy, soured and grotesque set: materials, lamp colours and props (placeholders are fine)
- [ ] Light levels and shadow layout are the same in all three sets (lamp colours change, lamp energy and placement don't)
- [ ] The ambient bed has a sound set per stage (homely, souring, wet), still through the muffled channel
- [ ] The rot thresholds live in the tuning table (cosy at 70 and above, soured 69–40, grotesque below 40)
- [ ] The debug overlay shows each space's rot stage
- [ ] Works in the web export
- [ ] PR says how to try it (e.g. give in three and six times, leave a space and come back)
