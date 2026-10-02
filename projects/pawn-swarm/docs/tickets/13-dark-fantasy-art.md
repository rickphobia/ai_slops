# 13: Grotesque dark fantasy art

**What to build:** Replace the chess glyphs with grotesque dark-fantasy art: the look of `docs/art/grotesque-sample.html`, applied to every piece using the concepts in `docs/art/style-sample.html` (see `docs/art/README.md`): every pawn type, every black piece and black type, the board, and the menus (HUD, shop, skills, end screens).

**Blocked by:** 04

**Status:** done

**Touches:** adapters/canvas-renderer, adapters/dom-ui, art assets, index styles

- [x] One art module maps each piece (pawn type, black piece, black type ring) to its drawing; the renderer only asks it for an image
- [x] SVG drawings rendered once to canvas images at startup at 2× resolution; no per-frame SVG parsing
- [x] All 11 pawn types drawn at the grotesque level (types not yet built still get their drawing); plain, twin and spear match the grotesque sample
- [x] All 5 black pieces drawn at the grotesque level (knight and queen match the grotesque sample), and each of the 8 black types drawn as its own variant (not just a coloured ring). The board shows the variants once ticket 10 puts black types in the battle state
- [x] Small animations (moving and blinking eyes, beating hearts, dripping and pooling blood, crawling maggots, twitching limbs) as a few cached frames, cheap enough for 300+ pawns at 60 fps
- [x] Board: dark squares, edge vignette, a few blood stains
- [x] HUD, shop, skill bar and end screens restyled with Cinzel / Crimson Pro and the dark palette. The shop (06) and skill bar (07) don't exist yet; they use the `:root` tokens in `index.html`, and the shop shows pawns with `portraitSvg` from `src/adapters/art/portrait.ts`
- [x] White and black pieces stay easy to tell apart in a crowd: black pieces mostly dark with red flesh as detail (screenshot of a big fight in the PR)
- [x] Each drawing still reads at about 48 px (screenshot of all pieces at game size in the PR)
