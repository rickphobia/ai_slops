import { ANIMATION_FRAMES } from "../art/animation";
import { ArtError } from "../art/art-error";
import { ART_IDS, type ArtId } from "../art/drawings";
import { frameStripSvg } from "../art/frame-strip";
import { PAWN_TYPE_COLOURS } from "../art/type-colours";
import type { PieceIdentity } from "../../battle/battle-state";
import { StartupError } from "../../startup-error";

/** A square cut from a sprite sheet: one frame of one drawing at one size. */
export interface Sprite {
  readonly sheet: CanvasImageSource;
  readonly sourceX: number;
  /** Width and height in canvas pixels; the sprite is drawn 1:1. */
  readonly size: number;
}

/**
 * How pieces look. This is the one place that maps a piece to its drawing;
 * the renderer only asks it for an image.
 */
export interface PieceArt {
  /** The image for `id` in animation frame `frame`, sized for squares `squarePx` wide. */
  sprite(id: ArtId, squarePx: number, frame: number): Sprite;
  /** The piece's colour: its sparks when it dies, its slashes when it strikes, a pawn type's ground disc. */
  tint(piece: PieceIdentity): string;
}

/** Copies a sprite 1:1 centred on (`x`, `y`); whole-pixel positions avoid resampling it every frame. */
export function drawSpriteCentred(
  context: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
): void {
  context.drawImage(
    sprite.sheet,
    sprite.sourceX,
    0,
    sprite.size,
    sprite.size,
    Math.round(x - sprite.size / 2),
    Math.round(y - sprite.size / 2),
    sprite.size,
    sprite.size,
  );
}

/** Which drawing a piece on the board uses: a special black type has its own. */
export function artIdOf(piece: PieceIdentity): ArtId {
  return piece.side === "white" ? piece.type : (piece.type ?? piece.kind);
}

/**
 * Each drawing's 120-unit box (the 100-unit drawing plus its margin), in
 * squares. A pawn's figure fills about 75 units of it, so 1.5 makes a pawn
 * about a square tall; black pieces loom over them, bigger the stronger they are.
 */
const CELL_SQUARES: Readonly<Record<ArtId, number>> = {
  plain: 1.5,
  shield: 1.5,
  spear: 1.5,
  twin: 1.5,
  medic: 1.5,
  banner: 1.5,
  bomb: 1.5,
  recruiter: 1.5,
  berserker: 1.55,
  promoter: 1.5,
  enPassant: 1.5,
  knight: 1.8,
  bishop: 1.85,
  rook: 1.9,
  queen: 2,
  king: 2.2,
  stomper: 1.8,
  hunter: 1.8,
  priest: 1.85,
  sniper: 1.85,
  tower: 1.95,
  cannon: 1.9,
  storm: 2,
  summoner: 2,
};

/** Size the strips are decoded at. SVG images stay vector, so sheets drawn from them at any size stay sharp. */
const STRIP_CELL_PX = 128;
/** Ember, not blood red, so a black piece's death burst doesn't read as a wounded pawn. */
const BLACK_TINT = "#ff8a3c";

function newCanvas(
  width: number,
  height: number,
): {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new StartupError(
      "Canvas 2D context is not available for piece sprites.",
    );
  }
  return { canvas, context };
}

async function decodeStrip(id: ArtId): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(frameStripSvg(id, STRIP_CELL_PX))}`;
  try {
    await image.decode();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new StartupError(
      `The "${id}" drawing could not be loaded as an image (${reason}).`,
    );
  }
  return image;
}

/**
 * Turns every drawing into images once, at startup: each drawing's animation
 * frames are decoded as one SVG strip. Sprite sheets for a square size are
 * drawn from the strips the first time that size is needed (again after a
 * resize), so a battle only copies pixels: no SVG parsing per frame.
 */
export async function loadPieceArt(): Promise<PieceArt> {
  const strips = new Map(
    await Promise.all(
      ART_IDS.map(async (id) => [id, await decodeStrip(id)] as const),
    ),
  );
  const sheets = new Map<string, HTMLCanvasElement>();

  const sheetFor = (id: ArtId, size: number): HTMLCanvasElement => {
    const key = `${id}|${String(size)}`;
    const cached = sheets.get(key);
    if (cached !== undefined) return cached;
    const strip = strips.get(id);
    if (strip === undefined) {
      throw new ArtError(`There is no drawing for "${id}".`);
    }
    const { canvas, context } = newCanvas(ANIMATION_FRAMES * size, size);
    context.drawImage(strip, 0, 0, canvas.width, canvas.height);
    sheets.set(key, canvas);
    return canvas;
  };

  return {
    sprite: (id, squarePx, frame) => {
      const size = Math.round(CELL_SQUARES[id] * squarePx);
      return { sheet: sheetFor(id, size), sourceX: frame * size, size };
    },
    tint: (piece) =>
      piece.side === "white" ? PAWN_TYPE_COLOURS[piece.type] : BLACK_TINT,
  };
}
