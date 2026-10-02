import { frameIndexAt } from "./adapters/art/animation";
import { ART_IDS, type ArtId } from "./adapters/art/drawings";
import { portraitSvg } from "./adapters/art/portrait";
import { paintBoard } from "./adapters/canvas-renderer/board-art";
import { loadPieceArt } from "./adapters/canvas-renderer/piece-art";
import { createConsoleLogger, logLevelFromQuery } from "./logger";

/**
 * Entrypoint of art-gallery.html, a dev page that shows every drawing at game
 * size and as a portrait. It draws with the game's own art code.
 */

const SQUARE_CSS_PX = 48;
const PIXEL_RATIO = 2;
/** Each tile is a 2×2 patch of board, the piece standing in the middle. */
const TILE_SQUARES = 2;

const logger = createConsoleLogger(logLevelFromQuery(window.location.search));

function tile(id: ArtId): {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SQUARE_CSS_PX * TILE_SQUARES * PIXEL_RATIO;
  canvas.style.width =
    canvas.style.height = `${String(SQUARE_CSS_PX * TILE_SQUARES)}px`;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D context is not available.");
  const figure = document.createElement("figure");
  const caption = document.createElement("figcaption");
  caption.textContent = id;
  figure.append(canvas, caption);
  document.getElementById("game-size")?.append(figure);
  return { canvas, context };
}

async function showGallery(): Promise<void> {
  const art = await loadPieceArt();
  const squarePx = SQUARE_CSS_PX * PIXEL_RATIO;
  const tiles = ART_IDS.map((id, index) => ({ id, index, ...tile(id) }));
  const portraits = document.getElementById("portraits");
  for (const id of ART_IDS) {
    portraits?.insertAdjacentHTML(
      "beforeend",
      `<figure class="portrait">${portraitSvg(id, id)}<figcaption>${id}</figcaption></figure>`,
    );
  }
  const draw = (nowMs: number): void => {
    for (const { id, index, canvas, context } of tiles) {
      paintBoard(
        context,
        { files: TILE_SQUARES, ranks: TILE_SQUARES },
        squarePx,
      );
      const sprite = art.sprite(
        id,
        squarePx,
        frameIndexAt(nowMs / 1000, index),
      );
      context.drawImage(
        sprite.sheet,
        sprite.sourceX,
        0,
        sprite.size,
        sprite.size,
        Math.round(canvas.width / 2 - sprite.size / 2),
        Math.round(canvas.height / 2 - sprite.size / 2),
        sprite.size,
        sprite.size,
      );
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

showGallery().catch((error: unknown) => {
  logger.error("art gallery failed", {
    error: error instanceof Error ? error.message : String(error),
  });
});
