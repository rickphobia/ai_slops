# 15: Pen buttons

**What to build:** In Settings I can give each **Pen button** that reaches the app an action: eraser, highlighter or Lasso while held, or undo, redo or next colour on click. Defaults are hold = eraser and click = undo. "Next colour" cycles through my **Favourite pens** (default black → blue → red → green). Buttons the system keeps for itself are listed as unavailable. This completes milestone 2.

**Blocked by:** 06 (Pen test screen), 14 (Palm safety and finger gestures)

**Status:** ready

**Touches:** core-touch, app-settings

**Effort:** low

- [ ] Button mapping built only for the buttons the pen test screen showed reaching the app (results from ticket 06 in the README)
- [ ] Held-button actions switch tool while held and switch back on release; click actions run once (tested in `core`)
- [ ] Favourite pens list editable in Settings; "next colour" cycles it (tested)
- [ ] Unavailable buttons listed with a plain explanation
- [ ] **Milestone 2 gate**, written in the PR for the owner: write, force-close, reopen with all ink there; a page of tutorial working feels as good as Nebo; a resting palm never marks or erases; pen buttons do what Settings says
