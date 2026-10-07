# 07: Study Sessions

**What to build:** When the Worker misses a Quota, they are taken off the field for a Study Session: a plain room and a loudspeaker with a countdown, never physical harm. They can't plant or pick until it ends. Each Study Session in a row lasts longer, up to a cap; a met Quota resets the count. The App's messages grow colder after repeated failures (spec: stories 30, 52–57; "Rules decisions": Study Session).

**Blocked by:** 06 (The App: Shift and Quota)

**Status:** ready

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay

**Effort:** medium

- [ ] A missed Quota starts a Study Session; plant and pick are refused during it with the reason
- [ ] The Study Session counts down with advance; its length starts at the tuning value (5 minutes) and doubles for each one in a row up to a cap; a met Quota resets the count
- [ ] App messages for Study Session start and end, and colder Quota messages after repeated misses
- [ ] GUT tests cover start, blocked actions, countdown, escalation, the cap and the reset
- [ ] Study Session screen: a plain room, a loudspeaker and the time left; nothing graphic
- [ ] Study Sessions are logged at info level with their length and the escalation count
