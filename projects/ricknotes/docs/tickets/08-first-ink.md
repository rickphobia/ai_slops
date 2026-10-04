# 08: First ink

**What to build:** In an open Document, the pen draws black strokes with no noticeable lag, and a finger scrolls. Strokes are attached to the page: they stay exactly in place while scrolling and zooming. Strokes are kept in memory only; saving comes in ticket 09. This is the first time the owner can judge pen feel, which is the make-or-break risk of the whole app.

**Blocked by:** 05 (Zoom, jump and resume)

**Status:** ready

**Touches:** core-ink, core-touch, app-ink, app-viewer

**Effort:** medium

- [ ] `core` has the stroke model (stable ID, page ID, tool, colour, width, time, points with x, y, pressure and time in PDF page coordinates), with no Android types
- [ ] `core` has a first touch interpreter: pen draws, one finger scrolls, two fingers scroll and zoom; unit-tested with invented event sequences
- [ ] The app converts Android touch events into the plain events `core` understands
- [ ] Strokes in progress use Jetpack Ink's low-latency drawing; finished strokes are drawn with the page at any zoom
- [ ] Converting screen positions to page coordinates and back is unit-tested in `core`
- [ ] A finger never draws
- [ ] On-tablet check written in the PR: write a page of working at two zoom levels; strokes stay put while scrolling and zooming; the owner reports how it compares to Nebo
