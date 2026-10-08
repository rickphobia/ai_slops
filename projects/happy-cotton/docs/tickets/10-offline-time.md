# 10: Offline time and the away summary

**What to build:** Closing the game or switching tabs pauses the Shift, but the world keeps going: crops grow at the slower offline rate (the night shift) and a Study Session keeps counting down. Coming back shows a short "while you were away" summary. In debug mode (`?debug=1` in the URL, or `-- --debug` on desktop) a Skip time control lets the owner jump ahead without waiting. A wrong device clock never breaks the game (spec: stories 33, 49, 58, 60, 66–68, 87; "Rules decisions": Shift, Clock safety, "Modules": Debug mode).

**Blocked by:** 14 (Run the Generator)

**Status:** done

**Touches:** rules, adapters/clock, adapters/debug, content/app-text, adapters/app-overlay, entrypoint

**Effort:** medium

- [x] Rules resume after some seconds offline: growth advances at the offline rate from the tuning table (no Generator needed) and Study Sessions advance, the Shift does not move (Exhaustion recovery while away is added in 08)
- [x] Negative offline time counts as zero; offline time is capped at the tuning maximum; both are logged as warnings
- [x] An away-summary App message lists what ripened and Study Session time served
- [x] GUT tests cover each of the above, including a Study Session that ends while away
- [x] Clock adapter works out offline time from the hidden time when the tab becomes visible again; a hidden tab counts as offline (offline time since the last save, on start, is added in 09)
- [x] The overlay shows the away summary on return
- [x] Debug mode is on only with `?debug=1` in the page URL or `-- --debug` on the command line; without it no debug control is shown
- [x] In debug mode a Skip time control offers +1 hour and +8 hours; each runs exactly the same offline resume as coming back after that long (away summary included) and is logged at info level
- [x] README explains debug mode and Skip time
