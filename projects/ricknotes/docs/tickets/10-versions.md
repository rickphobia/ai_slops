# 10: Versions

**What to build:** Every time I open a Document, a **Version** of its Ink file is taken before my first new stroke, then at most one every 15 minutes while I write. Only the newest 10 per Document are kept, in a hidden `.versions` folder beside it. The restore screen comes in milestone 6; this ticket makes sure the copies exist.

**Blocked by:** 09 (Save and reopen)

**Status:** done

**Touches:** core-session

**Effort:** low

- [x] A Version is taken on open when an Ink file exists, before any change (tested)
- [x] At most one Version per 15 minutes of writing (tested with a fake clock)
- [x] Only the newest 10 Versions per Document are kept (tested)
- [x] Versions are written with the same safe write as the Ink file
- [x] `.versions` name pattern written in the README for the sync app to skip
