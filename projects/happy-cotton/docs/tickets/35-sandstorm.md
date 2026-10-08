# 35: Sandstorm

**What to build:** Now and then during a Shift after the first, The App warns of a Sandstorm a little before it strikes. While it lasts the sky turns orange, dust blows across the field and crops grow slower. The App cheers "Nature cannot stop us!" and the Quota stays where it was. It never lasts more than a quarter of a Shift, and closing the game ends it (land and hazards spec: stories 72–76, 79–83, 97, 101–102; "Implementation Decisions": Disasters, Adapters: Disaster looks).

**Blocked by:** 34 (Pesticide)

**Status:** ready

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay, adapters/field, adapters/debug

**Effort:** medium

- [ ] At the start of each Shift after the first, a Sandstorm is rolled (chance per Shift) and, if it comes, when it strikes; at most one Disaster a Shift
- [ ] A warning comes a set number of seconds before; it lasts a set length in online Shift time and ends within the Shift
- [ ] While it lasts, growth per second of running is multiplied by a factor between 0.5 and 1
- [ ] The Quota never changes for it
- [ ] The Shift view shows the Disaster (warned or striking, and the seconds left), and the overlay a countdown
- [ ] An orange sky, haze and blowing dust; with reduced motion, a still tint instead
- [ ] A planned or running Sandstorm is not saved
- [ ] Validation: a Disaster lasts at most a quarter of a Shift and warning plus length fit in it
- [ ] Debug mode adds "Sandstorm now"
- [ ] Disasters planned, struck and passed (kind, length) are logged
- [ ] GUT tests through Farm cover planning, warning, strike, growth, the unchanged Quota and restore
