import type { Piece, PieceKind } from "../battle/battle-state";
import type { Side } from "../board/square";
import { StartupError } from "../startup-error";

const LIGHT_SQUARE = "#eeeed2";
const DARK_SQUARE = "#769656";
const HP_BAR_BACK = "#5a1e1e";
const HP_BAR_FILL = "#4fd16b";

/** Filled chess glyphs; the colour comes from the side. U+FE0E stops the pawn showing as an emoji. */
const GLYPHS: Readonly<Record<PieceKind, string>> = {
  pawn: "♟︎",
  knight: "♞",
  bishop: "♝",
  rook: "♜",
  queen: "♛",
  king: "♚",
};

const PIECE_COLOURS: Readonly<Record<Side, { fill: string; outline: string }>> =
  {
    white: { fill: "#ffffff", outline: "#1a1a1a" },
    black: { fill: "#1a1a1a", outline: "#f0f0f0" },
  };

export interface BoardRenderer {
  draw(pieces: readonly Piece[]): void;
}

/**
 * Draws onto a square canvas. The canvas keeps its CSS size; its pixel size is
 * set from the current pixel ratio on every draw (it changes with browser zoom) so squares stay sharp on high-DPI screens.
 */
export function createCanvasRenderer(
  canvas: HTMLCanvasElement,
  boardSize: number,
  getPixelRatio: () => number,
): BoardRenderer {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new StartupError(
      "Canvas 2D context is not available in this browser.",
    );
  }

  const drawSquares = (squareSize: number): void => {
    for (let rank = 0; rank < boardSize; rank++) {
      for (let file = 0; file < boardSize; file++) {
        // a1 (bottom-left) is dark, as on a real chess board.
        const isDark = (file + rank) % 2 === 0;
        context.fillStyle = isDark ? DARK_SQUARE : LIGHT_SQUARE;
        const row = boardSize - 1 - rank;
        context.fillRect(
          Math.floor(file * squareSize),
          Math.floor(row * squareSize),
          Math.ceil(squareSize),
          Math.ceil(squareSize),
        );
      }
    }
  };

  const drawPiece = (piece: Piece, squareSize: number): void => {
    const left = piece.square.file * squareSize;
    const top = (boardSize - 1 - piece.square.rank) * squareSize;
    const colours = PIECE_COLOURS[piece.side];

    context.font = `${String(Math.floor(squareSize * 0.75))}px serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = Math.max(1, squareSize * 0.04);
    context.strokeStyle = colours.outline;
    context.fillStyle = colours.fill;
    const glyphX = left + squareSize / 2;
    const glyphY = top + squareSize * 0.45;
    context.strokeText(GLYPHS[piece.kind], glyphX, glyphY);
    context.fillText(GLYPHS[piece.kind], glyphX, glyphY);

    const barWidth = squareSize * 0.8;
    const barHeight = Math.max(2, squareSize * 0.08);
    const barX = left + (squareSize - barWidth) / 2;
    const barY = top + squareSize * 0.86;
    context.fillStyle = HP_BAR_BACK;
    context.fillRect(barX, barY, barWidth, barHeight);
    context.fillStyle = HP_BAR_FILL;
    context.fillRect(
      barX,
      barY,
      barWidth * (piece.hp / piece.maxHp),
      barHeight,
    );
  };

  const draw = (pieces: readonly Piece[]): void => {
    const cssSize = Math.min(canvas.clientWidth, canvas.clientHeight);
    const pixelSize = Math.floor(cssSize * getPixelRatio());
    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const squareSize = pixelSize / boardSize;
    drawSquares(squareSize);
    for (const piece of pieces) drawPiece(piece, squareSize);
  };

  return { draw };
}
