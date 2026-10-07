# 15: The Overseer at the Generator

**What to build:** When the Worker stops on the Generator to breathe, the Overseer comes: a whistle, then the whip. The Worker flinches, staggers and starts running again. The Generator whines while it turns and winds down when the Worker stops; footsteps, the whistle and the whip crack are heard. This is the one shown act of physical punishment in the game, chosen by the owner, and it stays without blood, wounds or gore (spec: stories 95; "Content rules").

**Blocked by:** 14 (Worker Toil)

**Status:** ready

**Touches:** adapters/field, adapters/audio, assets

**Effort:** medium

- [ ] The Overseer stands near the Generator: a second CC0 character (a different look from the Worker, credited), a person in a uniform, not a caricature
- [ ] Each time the Worker stops on the Generator, the Overseer blows a whistle; if the Worker hasn't started again after a short moment, the Overseer cracks a whip (a whip prop, credited) and the Worker flinches and staggers (the model's HitRecieve animation), then starts running again
- [ ] No blood, wounds, marks or gore; the camera does not zoom in on it
- [ ] Sounds (CC0, credited): footsteps on the Generator, a Generator whine that rises with speed and winds down when it stops, the whistle, the whip crack
- [ ] One audio bus for these sounds, so ticket 12's volume and mute can control them; the first sound only plays after the player's first tap (browsers block audio before that)
- [ ] With reduced motion on (once ticket 12 adds it) the stagger is skipped; the sounds stay
- [ ] Timings (how long before the whistle, how long before the whip) are named values in one place
- [ ] Works in the web export on a phone-sized screen with sound (record what was checked in the PR)
