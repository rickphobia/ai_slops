# 15: The Overseer at the Generator

**What to build:** When the Worker stops on the Generator to breathe, the crops halt and the Overseer comes: a whistle, then the whip. The Worker flinches, staggers and starts running again. The Generator whines while it turns and winds down when he stops; footsteps, the whistle and the whip crack are heard. This is the one shown act of physical punishment in the game, chosen by the owner, and it stays without blood, wounds or gore (spec: stories 93, 95; "Rules decisions": Generator and Toil; "Content rules").

**Blocked by:** 14 (Run the Generator), 23 (Run the track)

**Status:** done

**Touches:** rules, config/tuning, adapters/field, adapters/app_overlay, adapters/audio, assets

**Effort:** medium

- [x] The rules end the Worker's breath with the Overseer instead of a fixed time: a whistle after a set time, the whip after a further set time, then he runs again; both are emitted as events; the whip changes no numbers; times come from the tuning table, with GUT tests
- [x] The Overseer stands by the Generator's turnstile, where the Worker stops to breathe: a second CC0 character (a different look from the Worker, credited), a person in a uniform, not a caricature
- [x] On the whistle event he blows a whistle; on the whip event he cracks a whip (a whip prop, credited) and the Worker flinches and staggers (the model's HitRecieve animation), then runs again
- [x] No blood, wounds, marks or gore; the camera does not zoom in on it
- [x] Sounds (CC0, credited): footsteps on the track, the turnstile turning, a Generator whine that rises with speed and winds down when it stops, the whistle, the whip crack
- [x] One audio bus for these sounds, so ticket 12's volume and mute can control them; the first sound plays only after the player's first tap (browsers block audio before that)
- [x] The Generator powers The App as well as the loudspeaker (story 93): while the Worker isn't running, The App overlay dims, and it brightens again when he runs
- [x] With reduced motion on (once ticket 12 adds it) the stagger is skipped; the sounds stay
- [x] Works in the web export on a phone-sized screen with sound (record what was checked in the PR)
