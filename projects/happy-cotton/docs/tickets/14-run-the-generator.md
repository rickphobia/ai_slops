# 14: Run the Generator

**What to build:** The field is watered by a Generator: a treadmill wired to the pumps and to the loudspeaker pole. The player taps the Generator to send the Worker to run on it, and taps a plot to bring him back to plant or pick. While the game is open, crops grow only while he runs, and the loudspeaker light glows. After a few laps he slows, staggers and stops bent over to breathe, the crops halt and the light dims, then he starts again. The whistle and whip that make him start again come in ticket 15 (spec: stories 21, 90, 91, 93, 94; "Rules decisions": Generator and Toil).

**Blocked by:** 07 (Study Sessions), 13 (Pan and zoom the field)

**Status:** done

**Touches:** rules, config/tuning, adapters/field, assets, entrypoint

**Effort:** medium

- [x] The Farm rules track where the Worker is (in the field or on the Generator) and whether he is running or stopped to breathe; a command sends him to the Generator, and plant, pick and clear bring him back to the field
- [x] Online, crops grow only while he runs; in the field, stopped to breathe, or in a Study Session, growth halts
- [x] After a set number of laps he stops to breathe for a set time, then runs again (ticket 15 replaces the fixed time with the whistle and whip); laps and times come from the tuning table
- [x] The existing growth tests are updated to send the Worker to the Generator, since growth now depends on it; new GUT tests cover each rule above through the public interface
- [x] In the field: a Generator beside the plots (simple shapes or a credited CC0 model) that can be tapped; the Worker walks to it and runs on it (the model's Run animation), slows, staggers and stops bent over (Walk, HitRecieve, Idle), and walks back when a plot is tapped
- [x] The loudspeaker light glows while he runs and dims when he stops
- [x] Tapping the Generator works with touch and mouse, and a pan or zoom never sends him (ticket 13's tap rule)
- [x] No blood, wounds or gore; no weapon or fighting animations on the Worker
- [x] Works in the web export on a phone-sized screen (record what was checked in the PR)
