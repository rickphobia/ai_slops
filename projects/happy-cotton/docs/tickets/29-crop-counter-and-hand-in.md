# 29: Crop counter and wages at the Hand-in

**What to build:** When a Shift's time runs out, The App asks the Worker to hand in his cotton, and the Farm waits for him. Labour Points are now paid at the Hand-in for the cotton handed in, not at each pick, and only what he hands in counts towards the Quota. During the Shift a crop counter beside Labour Points shows how many crops he has picked, with a "+1" rising from the Plot on each pick. The Hand-in's slider is fixed at "everything" for now; keeping back comes in the next ticket (land and hazards spec: stories 20, 22–32; "Implementation Decisions": Hand-in and Shift end, Save).

**Blocked by:** 28 (Longer laps on a bigger Farm)

**Status:** ready

**Touches:** rules, content/app-text, adapters/app-overlay, adapters/save

**Effort:** medium

- [ ] The crop counter goes up by one for every pick that doesn't drop its cotton, fills the Quota bar, and goes back to zero when the next Shift starts
- [ ] A "+1" rises from the Plot on each counted pick
- [ ] No Labour Points are paid at a pick; the Hand-in pays them for the cotton handed in
- [ ] When a Shift's time runs out the Hand-in opens; online time moves nothing and every other command is refused until he hands in; offline time works as usual
- [ ] Handing in runs the Shift end: Labour Points, the Quota check on what was handed in, Bills, the Exhaustion floor rise, the next Shift
- [ ] The Hand-in card shows the cotton in hand against the Quota
- [ ] An open Hand-in and the counter are saved; a previous-version save carries on with the Shift's picks as cotton in hand
- [ ] Existing tests that count Labour Points after a pick hand in first; none is deleted or weakened
- [ ] A decision record explains why wages are paid at the Hand-in
- [ ] Each Hand-in (handed in) is logged
- [ ] GUT tests through Farm cover the counter, the Hand-in, wages and the Quota on what was handed in
