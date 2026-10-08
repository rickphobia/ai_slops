# 28: Longer laps on a bigger Farm

**What to build:** Every new column or row makes the track longer, and the Worker runs it at the same pace, so each lap takes longer. Running costs the same Exhaustion per second, so a longer lap tires him more, and he still runs the same number of laps before he stops to breathe. A new lap length starts with his next lap (land and hazards spec: stories 8–12; "Implementation Decisions": Lap length).

**Blocked by:** 27 (Buy a Plot: the fence moves out)

**Status:** ready

**Touches:** rules, config/tuning, adapters/field

**Effort:** low

- [ ] A lap takes lap_seconds on the first Farm plus a set number of seconds (tuning) for each new column or row, chosen so the shipped pace stays the same
- [ ] The new length starts with the Worker's next lap; the lap in progress keeps its length
- [ ] Exhaustion from running is charged per second at the first Farm's rate, so a longer lap adds more
- [ ] Laps before a breath don't change
- [ ] The Worker view shows the current lap length, and the field's runner and power tiles follow the longer track
- [ ] GUT tests through Farm cover lap length, when it changes, and Exhaustion per second
