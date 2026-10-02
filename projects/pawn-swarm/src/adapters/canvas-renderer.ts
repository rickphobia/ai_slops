const LIGHT_SQUARE = "#eeeed2";
const DARK_SQUARE = "#769656";

export interface BoardRenderer {
  drawEmptyBoard(): void;
}

/**
 * Draws onto a square canvas. The canvas keeps its CSS size; its pixel size is
 * set from `devicePixelRatio` so squares stay sharp on high-DPI screens.
 */
export function createCanvasRenderer(
  canvas: HTMLCanvasElement,
  boardSize: number,
  pixelRatio: number,
): BoardRenderer {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D context is not available in this browser.");
  }

  const drawEmptyBoard = (): void => {
    const cssSize = Math.min(canvas.clientWidth, canvas.clientHeight);
    const pixelSize = Math.floor(cssSize * pixelRatio);
    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const squareSize = pixelSize / boardSize;
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

  return { drawEmptyBoard };
}
