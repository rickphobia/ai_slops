# 03: Title screen and Sources page

**What to build:** The player opens the game to a title screen that names it, says plainly what it depicts and that it is based on documented reporting, and offers Start and Sources. The Sources page lists every source the game draws on, with its author, publisher, date and a link, built from one sources register (spec: stories 5–9, "Content rules", "Sources register").

**Blocked by:** 01 (Walking skeleton)

**Status:** ready

**Touches:** adapters/title, content/sources

**Effort:** low

- [ ] Sources register with the six starting entries from the spec, each with an id, title, author or publisher, date, link and a one-line note on what the game uses it for; links checked to resolve
- [ ] A test that every register entry has all its fields and that ids are unique
- [ ] Title screen shows "Happy Cotton" and the exact content note from the spec
- [ ] Sources button opens a readable, scrollable Sources page built from the register; each link opens in a new tab; Back returns to the title
- [ ] Start goes to the main scene with one tap or click
- [ ] The title screen works with touch and mouse, in landscape, at phone size
