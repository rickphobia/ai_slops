import type { PieceIdentity } from "../../battle/battle-state";
import type { BlackKind, PawnTypeId } from "../../catalog/pieces";
import { StartupError } from "../../startup-error";

/**
 * How pieces are drawn. This is the one place that maps a piece to its look,
 * so an art pass replaces this module (glyphs today, sprites later) without
 * touching the rules or the rest of the renderer.
 */
export interface PieceArt {
  /** Draws the piece centred on (`x`, `y`) in canvas pixels, where one square is `squarePx` wide. */
  draw(
    context: CanvasRenderingContext2D,
    piece: PieceIdentity,
    x: number,
    y: number,
    squarePx: number,
  ): void;
  /** The colour effects use for this piece: sparks when it dies, slashes when it strikes. */
  tint(piece: PieceIdentity): string;
}

interface GlyphStyle {
  readonly glyph: string;
  /** Glyph height as a share of a square. */
  readonly size: number;
  readonly fill: string;
  readonly outline: string;
}

const PAWN_GLYPHS: Readonly<Record<PawnTypeId, GlyphStyle>> = {
  plain: { glyph: "♟", size: 0.875, fill: "#f4efe4", outline: "#1a140c" },
};

const BLACK_GLYPHS: Readonly<Record<BlackKind, GlyphStyle>> = {
  knight: { glyph: "♞", size: 0.8125, fill: "#141210", outline: "#e9dcc2" },
  bishop: { glyph: "♝", size: 0.875, fill: "#141210", outline: "#e9dcc2" },
  rook: { glyph: "♜", size: 0.9375, fill: "#141210", outline: "#e9dcc2" },
  queen: { glyph: "♛", size: 1.0625, fill: "#141210", outline: "#e9dcc2" },
  king: { glyph: "♚", size: 1.4375, fill: "#141210", outline: "#e9dcc2" },
};

/** U+FE0E asks for the text form, so the pawn doesn't show as a colour emoji. */
const TEXT_FORM = "︎";
/** Sprite side as a multiple of the glyph size: room for the outline, no more, since every transparent pixel still costs blending. */
const SPRITE_PADDING = 1.15;
const GLYPH_FONTS =
  '"DejaVu Sans", "Segoe UI Symbol", "Noto Sans Symbols 2", serif';

function styleOf(piece: PieceIdentity): GlyphStyle {
  return piece.side === "white"
    ? PAWN_GLYPHS[piece.type]
    : BLACK_GLYPHS[piece.kind];
}

/**
 * Chess glyphs with an outline. Each glyph is drawn once per square size onto
 * a small canvas and then copied, which is far cheaper than drawing text for
 * hundreds of pawns every frame.
 */
export function createGlyphArt(): PieceArt {
  const sprites = new Map<string, HTMLCanvasElement>();

  const spriteFor = (
    piece: PieceIdentity,
    squarePx: number,
  ): HTMLCanvasElement => {
    const style = styleOf(piece);
    const key = `${style.glyph}|${style.fill}|${String(squarePx)}`;
    const cached = sprites.get(key);
    if (cached !== undefined) return cached;

    const glyphPx = style.size * squarePx;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = Math.ceil(glyphPx * SPRITE_PADDING);
    const context = sprite.getContext("2d");
    if (context === null) {
      throw new StartupError(
        "Canvas 2D context is not available for piece sprites.",
      );
    }
    const middle = sprite.width / 2;
    context.font = `${String(glyphPx)}px ${GLYPH_FONTS}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.lineWidth = Math.max(2, glyphPx / 9);
    context.strokeStyle = style.outline;
    context.strokeText(
      style.glyph + TEXT_FORM,
      middle,
      middle + glyphPx * 0.04,
    );
    context.fillStyle = style.fill;
    context.fillText(style.glyph + TEXT_FORM, middle, middle + glyphPx * 0.04);
    sprites.set(key, sprite);
    return sprite;
  };

  return {
    draw: (context, piece, x, y, squarePx) => {
      const sprite = spriteFor(piece, squarePx);
      // Whole-pixel positions copy the sprite as is; fractional ones make the browser resample it.
      context.drawImage(
        sprite,
        Math.round(x - sprite.width / 2),
        Math.round(y - sprite.height / 2),
      );
    },
    tint: (piece) => {
      const style = styleOf(piece);
      return piece.side === "white" ? style.fill : style.outline;
    },
  };
}
