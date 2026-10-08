# 15: The Overseer at the Generator

**What to build:** When the Worker stops on the Generator to breathe, the crops halt and the Overseer comes: a whistle, then the whip. The Worker flinches, staggers and starts running again. The Generator whines while it turns and winds down when he stops; footsteps, the whistle and the whip crack are heard. This is the one shown act of physical punishment in the game, chosen by the owner, and it stays without blood, wounds or gore The Generator also powers The App, so when it stops, The App's screen flickers and dims until he runs again (spec: stories 93, 95; "Rules decisions": Generator and Toil; "Content rules").

**Blocked by:** 14 (Run the Generator)

**Status:** ready

**Touches:** rules, config/tuning, adapters/field, adapters/app_overlay, adapters/audio, assets

**Effort:** medium

- [ ] The rules end the Worker's breath with the Overseer instead of a fixed time: a whistle after a set time, the whip after a further set time, then he runs again; both are emitted as events; the whip changes no numbers; times come from the tuning table, with GUT tests
- [ ] The Overseer stands near the Generator: a second CC0 character (a different look from the Worker, credited), a person in a uniform, not a caricature
- [ ] On the whistle event he blows a whistle; on the whip event he cracks a whip (a whip prop, credited) and the Worker flinches and staggers (the model's HitRecieve animation), then runs again
- [ ] While the Generator is stopped, The App's overlay flickers and dims (still readable and tappable); it comes back to full brightness when he runs again. Skipped flicker with reduced motion on, the dimming stays
- [ ] No blood, wounds, marks or gore; the camera does not zoom in on it
- [ ] Sounds (CC0, credited): footsteps on the Generator, a Generator whine that rises with speed and winds down when it stops, the whistle, the whip crack
- [ ] One audio bus for these sounds, so ticket 12's volume and mute can control them; the first sound plays only after the player's first tap (browsers block audio before that)
- [ ] With reduced motion on (once ticket 12 adds it) the stagger is skipped; the sounds stay
- [ ] Works in the web export on a phone-sized screen with sound (record what was checked in the PR)
