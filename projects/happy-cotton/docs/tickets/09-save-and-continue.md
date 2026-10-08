# 09: Save and continue

**What to build:** The game saves itself, in the browser, with no account. A returning player picks up where they left off from the title screen. A damaged save never silently disappears: the player is told and offered a fresh start. "Start over" asks for confirmation first (spec: stories 10, 69–72; "Rules decisions": Save).

**Blocked by:** 08 (Exhaustion and the rest hour)

**Status:** done

**Touches:** rules, adapters/save, adapters/title, entrypoint

**Effort:** medium

- [x] Rules produce a plain dictionary of the full Farm state with a save format version, and restore from one
- [x] GUT round-trip tests: a game saved and restored behaves identically through the next Shift, Study Session and rest hour
- [x] Save store adapter keeps one slot in Godot's user folder (browser storage in the web export)
- [x] Autosave after every command, at the end of each Shift and when the tab is hidden
- [x] The title screen offers Continue when a save exists
- [x] A save that can't be read is kept aside, not overwritten; the player sees a clear message and can start over
- [x] "Start over" asks for confirmation
- [x] Saves, loads and failures are logged without dumping the save itself
- [x] On start, the time since the save was written is fed through the same offline resume as a hidden tab (crops grow, Withering, Study Sessions, Exhaustion recovery), with the away summary; the clock-safety rules apply
