# 24: Power tiles

**What to build:** The turnstile goes, and the whole track is paved with power tiles: the floor tiles from Japan that turn footsteps into electricity. Every step the Worker takes lights the tile under his foot, and the light fades behind him, so his laps leave a glowing trail. The Generator at the corner gathers the power from cables under the track, and a white line across the track there marks the end of each lap. He no longer pushes anything; his feet are the power. He stops to breathe on the line after his last lap, where the Overseer stands (ticket 15). The rules don't change (spec: stories 90, 91, 93, 94; "Rules decisions": Generator and Toil).

**Blocked by:** 15 (The Overseer at the Generator), 23 (Run the track)

**Status:** done

**Touches:** adapters/field, adapters/audio, assets

**Effort:** medium

- [x] The turnstile is gone. The track is paved with square power tiles (simple shapes, or one shared mesh drawn many times so the web build stays fast), with a white lap line across it at the Generator and cables from under the track to the Generator. Tapping the Generator or the lap line still sends him
- [x] Each footstep while he runs (or walks on the track) lights the tile under that foot. The tile fades out over a second or two, so a short glowing trail follows him. Steps follow his run animation's footfalls, not a fixed timer
- [x] While he runs, the loudspeaker lamp pulses faintly with his steps. When he stops, the tiles go dark and the lamp dims, as now
- [x] He runs over the lap line at full stride. After his last lap he stops on it to breathe, and the Overseer's spot beside it is unchanged
- [x] Ticket 15's turnstile sound becomes a soft electric tick on each lit step, quieter than the footsteps (CC0, credited), on the same audio bus
- [x] The code and tests speak of the lap line and power tiles, not a turnstile: signal, constants, TrackPath's starting point, lap-clock comments and test names
- [x] GLOSSARY (Generator), the spec's "Generator and Toil" and the README describe the tiles. Leave done tickets 15 and 23 as they are, since they record what was built then. The power tiles are presented as the state's cheerful invention, not as how the real tiles are used
- [x] With reduced motion on (ticket 12), the trail fades instantly and the lamp doesn't pulse; the sound stays
- [x] No blood, wounds or gore; the tiles never hurt him on screen
- [x] Works in the web export on a phone-sized screen, with no drop in frame rate from the tiles (record what was checked in the PR)
