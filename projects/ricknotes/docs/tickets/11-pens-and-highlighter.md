# 11: Pens and highlighter

**What to build:** A toolbar in the Document lets me pick a black, blue, red or green pen, or a highlighter. Highlighter strokes are see-through and drawn under my pen strokes, so they never hide text or writing. The chosen tool and colour are saved with each stroke. Tapping the current pen cycles through my **Favourite pens** (default black → blue → red → green, editable in Settings), so switching to red for marking is one tap. This replaces the pen button actions, dropped because the stylus's side button never reaches apps (see the README's "Pen buttons").

**Blocked by:** 08 (First ink)

**Status:** done

**Touches:** app-toolbar, app-ink, app-settings, core-settings

**Effort:** low

- [x] Toolbar with the four pens and the highlighter; the current tool is clearly shown
- [x] Highlighter strokes are translucent and drawn beneath pen strokes on the same page
- [x] Each stroke records its tool and colour in the stroke model
- [x] Tapping the current pen cycles through the Favourite pens list (cycling and list validation tested in `core`)
- [x] Favourite pens list editable in Settings: pick which pen colours are in it and their order; it can't be emptied
- [x] On-tablet check written in the PR: highlight a line of a slide, write over it in each colour, tap the pen to cycle to red
