# 10: Offline time and the away summary

**What to build:** Closing the game or switching tabs pauses the Shift, but the world keeps going: crops keep growing, Exhaustion recovers a little (never below the floor), and a Study Session keeps counting down. Coming back shows a short "while you were away" summary. A wrong device clock never breaks the game (spec: stories 33, 49, 58, 60, 66–68; "Rules decisions": Shift, Clock safety).

**Blocked by:** 09 (Save and continue)

**Status:** ready

**Touches:** rules, adapters/clock, content/app-text, adapters/app-overlay, entrypoint

**Effort:** medium

- [ ] Rules resume after some seconds offline: growth and Study Sessions advance, Exhaustion recovers at the tuning rate down to the floor, the Shift does not move
- [ ] Negative offline time counts as zero; offline time is capped at the tuning maximum; both are logged as warnings
- [ ] An away-summary App message lists what ripened, how much Exhaustion recovered and Study Session time served
- [ ] GUT tests cover each of the above, including a Study Session that ends while away
- [ ] Clock adapter works out offline time from the save's timestamp on start and from the hidden time when the tab becomes visible again; a hidden tab counts as offline
- [ ] The overlay shows the away summary on return
