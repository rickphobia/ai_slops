# 23: Run the track

**What to build:** The Worker stops running in place on a treadmill and runs laps of a dirt track around the outside of the fence. The Generator (pump, loudspeaker pole and lamp) stands at one corner of the track with a turnstile across it. Each lap he pushes through the turnstile and winds the Generator, so the laps the rules already count are laps you can see. He stops to breathe at the turnstile after his last lap. That spot is where the Overseer stands in ticket 15. The rules about when crops grow don't change (spec: stories 90, 91, 94; "Rules decisions": Generator and Toil).

**Blocked by:** 14 (Run the Generator)

**Status:** done

**Touches:** rules, config/tuning, adapters/field, assets

**Effort:** medium

- [x] A dirt track loops the outside of the fence, wide enough to run on. The treadmill is gone. The Generator stands at one corner beside the track (simple shapes or a credited CC0 model) with a turnstile across the track, and the pipe still runs from the Generator to the plots
- [x] Tapping the Generator or its turnstile sends him, as before. He walks to the turnstile and runs laps, pushing through the turnstile each time. It turns, and the loudspeaker lamp stays lit while he runs
- [x] His place on the track follows the rules' lap clock: a lap on screen takes `lap_seconds`, and he always stops to breathe at the turnstile. Add how far through the current lap he is to WorkerView (read-only, with a GUT test) if the scene needs it to keep in step
- [x] `lap_seconds` and `laps_before_breath` in the tuning table are retuned for the track: a believable running pace, and he still stops to breathe about as often as now (every 20–40 s)
- [x] When a plot is tapped he walks back to his place by the plots from wherever he is on the track. If the fence is in the way, it gets a gate there
- [x] The camera's pan limits take in the whole track, so it can always be brought into view
- [x] Slowing on the last lap, the stagger and bending over to breathe still play, now at the turnstile. No weapon or fighting animations on the Worker; no blood, wounds or gore
- [x] Works in the web export on a phone-sized screen (record what was checked in the PR)
