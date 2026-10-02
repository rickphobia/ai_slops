export type Side = "white" | "black";

/** A board square. File 0 is the left edge; rank 0 is the bottom edge. */
export interface Square {
  readonly file: number;
  readonly rank: number;
}

/** A position in board units: (0, 0) is the bottom-left corner, 1 unit is one square. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface BoardSize {
  readonly files: number;
  readonly ranks: number;
}

export function isOnBoard(square: Square, board: BoardSize): boolean {
  return (
    square.file >= 0 &&
    square.file < board.files &&
    square.rank >= 0 &&
    square.rank < board.ranks
  );
}

export function isSameSquare(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank;
}

export function centreOf(square: Square): Point {
  return { x: square.file + 0.5, y: square.rank + 0.5 };
}

export function boardCentre(board: BoardSize): Point {
  return { x: board.files / 2, y: board.ranks / 2 };
}

/** The square a point is on, clamped to the board. */
export function squareAt(point: Point, board: BoardSize): Square {
  return {
    file: Math.min(board.files - 1, Math.max(0, Math.floor(point.x))),
    rank: Math.min(board.ranks - 1, Math.max(0, Math.floor(point.y))),
  };
}
