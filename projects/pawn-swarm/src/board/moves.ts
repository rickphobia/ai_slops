import { type BoardSize, isOnBoard, type Square } from "./square";

const KNIGHT_JUMPS: readonly (readonly [number, number])[] = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

/**
 * Every L-jump that stays on the board and doesn't land on a square `isBlocked` reports.
 * Pieces in between don't matter: knights jump over them.
 */
export function knightJumps(
  from: Square,
  board: BoardSize,
  isBlocked: (square: Square) => boolean,
): Square[] {
  return KNIGHT_JUMPS.map(([fileStep, rankStep]) => ({
    file: from.file + fileStep,
    rank: from.rank + rankStep,
  })).filter((to) => isOnBoard(to, board) && !isBlocked(to));
}

/** The squares a knight hits when it lands: the 3×3 block around its landing square, cut at the board edge. */
export function knightHitSquares(landing: Square, board: BoardSize): Square[] {
  const squares: Square[] = [];
  for (let rankStep = -1; rankStep <= 1; rankStep++) {
    for (let fileStep = -1; fileStep <= 1; fileStep++) {
      const square = {
        file: landing.file + fileStep,
        rank: landing.rank + rankStep,
      };
      if (isOnBoard(square, board)) squares.push(square);
    }
  }
  return squares;
}
