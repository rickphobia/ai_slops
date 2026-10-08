# 08: Exhaustion and the rest hour

**What to build:** Every plant and pick wears the Worker down. As Exhaustion rises the Worker slows, then starts dropping cotton, and the world drains of colour as they slump. The player can spend Labour Points on a rest hour, the first Privilege, but rest never brings Exhaustion below a floor that creeps up every Shift. A missed Quota takes the rest hour away for the next Shift (spec: stories 40–50, 92, 94; "Rules decisions": Exhaustion, Generator and Toil).

**Blocked by:** 05 (Grounded field look), 11 (Withering and Negligence), 14 (Run the Generator)

**Status:** done

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay, adapters/field

**Effort:** medium

- [x] Plant and pick add Exhaustion; above one threshold actions take longer, above a higher one a pick can drop part of its cotton (randomness injected so tests are deterministic)
- [x] The Exhaustion floor rises at the end of every Shift and never falls
- [x] Buying a rest hour costs Labour Points, lowers Exhaustion towards the floor and never below it; refused with the reason when unaffordable or taken away
- [x] A missed Quota takes the rest hour away for the next Shift
- [x] GUT tests cover each of the above with time and randomness driven by the test
- [x] The overlay shows Exhaustion and the rest hour button with its price
- [x] The field drains of colour and the Worker slumps as Exhaustion rises
- [x] All Exhaustion numbers and the rest hour price come from the tuning table
- [x] Offline time recovers Exhaustion at the tuning rate, never below the floor, and the away summary says how much it recovered (stories 49, 66)
- [x] Running the Generator adds Exhaustion at its own tuning rate; the laps he manages before stopping to breathe fall as Exhaustion rises; the rest hour takes him off the Generator, so crops halt while he rests; with GUT tests
