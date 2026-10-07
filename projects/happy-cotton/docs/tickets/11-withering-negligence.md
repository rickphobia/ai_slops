# 11: Withering and Negligence

**What to build:** Ripe cotton left unpicked for 8 hours Withers. Withered plots are plain to see and must be cleared before replanting. The App logs each one as Negligence, docks Labour Points and sends the Worker to a Study Session longer than one for a missed Quota. Nothing Withers while the Worker is in a Study Session (spec: stories 59, 61–65; "Rules decisions": Withering and Negligence).

**Blocked by:** 10 (Offline time and the away summary)

**Status:** ready

**Touches:** rules, config/tuning, content/app-text, adapters/field, adapters/app-overlay

**Effort:** medium

- [ ] Ripe cotton Withers once it has been ripe for the tuning time (8 hours), counted outside Study Sessions, online or offline
- [ ] A clear command empties a Withered plot; planting on a Withered plot is refused with the reason
- [ ] Each Withered plot is logged as Negligence: Labour Points are docked (never below zero) and a Study Session starts that is longer than one for a missed Quota
- [ ] Negligence App messages, and Withered crops in the away summary
- [ ] GUT tests cover Withering at exactly the wither time and not before, no Withering during a Study Session, the clear command, docking and the longer Study Session
- [ ] Withered plots look withered in the field and can be cleared by tap or click
- [ ] With debug mode on, a ripe plot followed by Skip time +8 hours shows it Withered, the Negligence message and the longer Study Session (shown in the PR's evidence)
