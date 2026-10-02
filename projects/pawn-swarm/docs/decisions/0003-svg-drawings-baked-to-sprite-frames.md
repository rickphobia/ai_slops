# Piece art is SVG code, baked into sprite frames at startup

The grotesque art (`docs/art/`) is drawn as SVG in TypeScript (`src/adapters/art/`), one function per piece, rather than as painted image files. Each drawing builds its moving parts (eyes, hearts, blood, maggots) through an animator that either writes SMIL, for live portraits in the DOM, or writes the still frame at a given time. At startup the canvas renderer decodes each drawing's 8 frames as one SVG image, then cuts sprite sheets from it per square size, so a battle with hundreds of pawns only copies pixels. All animations loop within 2.4 s (8 frames of 0.3 s) so the frames repeat without a jump.

**Trade-offs:** animations are limited to a few frames and to durations that divide the loop; a painter can't hand us a PNG without redrawing it as code; and a few hundred milliseconds of startup go to decoding the 24 strips.

## Considered options

- **Painted sprite sheets (PNG):** richer look, but every pawn type and black type needs an artist pass, and the live shop portraits would need a second set.
- **Drawing SVG or Path2D every frame:** smooth animation, but far too slow for 300+ pawns at 60 fps.
