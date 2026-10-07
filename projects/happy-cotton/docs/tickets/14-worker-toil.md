# 14: Worker Toil

**What to build:** The Worker is never allowed to stand still. Whenever there is no cotton to pick, they Toil: hoeing the rows, and, when the loudspeaker calls, Drill (running laps, then standing to attention). As soon as a plot is ripe they go back to the field. Toil is relentless work, never anyone being hurt (spec: stories 90, 92; "Rules decisions": Toil). The Exhaustion it costs comes in ticket 08.

**Blocked by:** 07 (Study Sessions), 13 (Pan and zoom the field)

**Status:** ready

**Touches:** rules, adapters/field, assets

**Effort:** medium

- [ ] The Farm rules say whether the Worker is Toiling: during online play, no plot ripe, not in a Study Session (and, once ticket 08 adds it, not resting); GUT tests cover each case through the public interface
- [ ] In the field, a Toiling Worker hoes the rows: walks along them with a hoe and the Interact motion (a CC0 hoe prop, credited)
- [ ] From time to time a loudspeaker call starts Drill: the Worker runs laps around the field, then stands to attention for a moment, then goes back to hoeing; how often and how long are named values in one place
- [ ] When a plot becomes ripe, or a Study Session starts, the Worker stops Toiling at once; taps on plots are never blocked by a Toil animation
- [ ] Nothing graphic: no guards hitting, no injury; the model's combat animations are never used
- [ ] Any App or loudspeaker text about Toil or Drill follows the sources rule (a source id in the App text table)
- [ ] Works in the web export on a phone-sized screen (record what was checked in the PR)
