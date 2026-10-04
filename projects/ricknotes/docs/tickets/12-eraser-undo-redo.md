# 12: Eraser, undo and redo

**What to build:** A stroke eraser removes whole strokes it touches, and undo and redo buttons step back and forward through my changes in this Tab. Undo history lasts until the Tab closes. Every change, including undo and redo, is saved like any other.

**Blocked by:** 10 (Versions), 11 (Pens and highlighter)

**Status:** ready

**Touches:** core-session, app-toolbar

**Effort:** low

- [ ] Document session supports erasing strokes, undo and redo; each add or erase gesture is one undo step (tested)
- [ ] Undo and redo changes are saved through the normal save path (tested)
- [ ] Eraser tool, undo and redo buttons in the toolbar, disabled when there's nothing to undo or redo
- [ ] On-tablet check written in the PR: write, erase, undo the erase, redo it, force-close, reopen
