# 24: The pressure plate

**What to build:** The Generator's turnstile is replaced by an electric pressure plate set into the track at the same corner. Each lap the Worker's feet strike the plate: it sparks and lights up, a pulse runs along a cable to the Generator, and the loudspeaker lamp flares. He no longer pushes anything; his running body is the power. He still stops to breathe on the plate after his last lap, where the Overseer stands (ticket 15). The rules don't change (spec: stories 90, 91, 93, 94; "Rules decisions": Generator and Toil).

**Blocked by:** 15 (The Overseer at the Generator), 23 (Run the track)

**Status:** ready

**Touches:** adapters/field, adapters/audio, assets

**Effort:** medium

- [ ] The turnstile is gone. A flat metal pressure plate lies across the track where it stood (simple shapes), with a cable from it to the Generator. Tapping the plate or the Generator still sends him
- [ ] Each time he runs over the plate it flashes and gives off a few sparks, a pulse travels along the cable, and the loudspeaker lamp flares brighter for a moment before settling to its usual glow
- [ ] He runs over it at full stride, not pushing; he stops to breathe standing on it after his last lap, and the Overseer's spot by it is unchanged
- [ ] The turnstile's sound from ticket 15 becomes an electric snap or buzz when he hits the plate (CC0, credited), on the same audio bus
- [ ] The code and tests speak of the plate, not a turnstile: signal, constants, TrackPath's starting point, lap-clock comments and test names
- [ ] GLOSSARY (Generator), the spec's "Generator and Toil" and the README describe the plate. Leave done tickets 15 and 23 as they are, since they record what was built then
- [ ] With reduced motion on (ticket 12), the sparks and lamp flare are skipped; the plate's light and the sound stay
- [ ] No blood, wounds or gore; the plate never hurts him on screen
- [ ] Works in the web export on a phone-sized screen (record what was checked in the PR)
