# 13: Dark fantasy art

**What to build:** Replace the chess glyphs with the dark-fantasy horror art from `docs/art/style-sample.html` (see `docs/art/README.md`): every pawn type, every black piece and black type, the board, and the menus (HUD, shop, skills, end screens).

**Blocked by:** 04

**Status:** ready

**Touches:** adapters/canvas-renderer, adapters/dom-ui, art assets, index styles

- [ ] One art module maps each piece (pawn type, black piece, black type ring) to its drawing; the renderer only asks it for an image
- [ ] SVG drawings rendered once to canvas images at startup at 2× resolution; no per-frame SVG parsing
- [ ] All 11 pawn types drawn in the style (types not yet built still get their drawing)
- [ ] All 5 black pieces drawn, and each of the 8 black types drawn as its own variant from the sample (not just a coloured ring)
- [ ] Small animations (pulsing eyes, blinking shield eye, dripping blood, pumping twin vessel) as a few cached frames, cheap enough for 300+ pawns at 60 fps
- [ ] Board: dark squares, edge vignette, a few blood stains
- [ ] HUD, shop, skill bar and end screens restyled with Cinzel / Crimson Pro and the dark palette
- [ ] White and black pieces stay easy to tell apart in a crowd (screenshot of a big fight in the PR)
