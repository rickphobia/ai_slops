import { type BoardSize, isOnBoard, type Square } from "./square";

/** One step of a piece's move, as a file and rank offset. */
type Step = readonly [fileStep: number, rankStep: number];

const STRAIGHT: readonly Step[] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];
const DIAGONAL: readonly Step[] = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
];
const L_JUMPS: readonly Step[] = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

/** Which lines a piece moves along: knight L-jumps, diagonals, straight lines, or both kinds of line. */
export type MoveLines = "L" | "diagonal" | "straight" | "any";

/**
 * What a move hits: every square it passes through (sliders), the 3×3 block
 * where it lands, or that block plus the squares two away in each straight line.
 */
export type HitShape = "path" | "landing-block" | "landing-block-and-cross";

/** How a black piece moves, as data the catalog can hold. */
export interface MovePattern {
  readonly lines: MoveLines;
  /** Most squares it goes along a line in one move. An L-jump is one step. */
  readonly reach: number;
  readonly hits: HitShape;
}

export interface Move {
  readonly to: Square;
  /** Every pawn on one of these squares when the move lands is hit. */
  readonly hitSquares: readonly Square[];
}

const STEPS: Readonly<Record<MoveLines, readonly Step[]>> = {
  L: L_JUMPS,
  diagonal: DIAGONAL,
  straight: STRAIGHT,
  any: [...STRAIGHT, ...DIAGONAL],
};

/**
 * Every move the pattern allows from `from`. A line stops at the board edge and
 * at the first square `isBlocked` reports: black pieces can't pass through each
 * other. Pawns never block; they are what gets hit. A knight's jump has only one
 * step, so it can't be in the way of anything: it jumps over.
 */
export function pieceMoves(
  from: Square,
  pattern: MovePattern,
  board: BoardSize,
  isBlocked: (square: Square) => boolean,
): Move[] {
  const moves: Move[] = [];
  for (const [fileStep, rankStep] of STEPS[pattern.lines]) {
    const path: Square[] = [];
    for (let distance = 1; distance <= pattern.reach; distance++) {
      const to = {
        file: from.file + fileStep * distance,
        rank: from.rank + rankStep * distance,
      };
      if (!isOnBoard(to, board) || isBlocked(to)) break;
      path.push(to);
      moves.push({
        to,
        hitSquares: hitSquaresOf(pattern.hits, path, to, board),
      });
    }
  }
  return moves;
}

function hitSquaresOf(
  hits: HitShape,
  path: readonly Square[],
  to: Square,
  board: BoardSize,
): Square[] {
  switch (hits) {
    case "path":
      return [...path];
    case "landing-block":
      return blockAround(to, board);
    case "landing-block-and-cross":
      return [...blockAround(to, board), ...crossArms(to, board)];
  }
}

/** The four squares two away from `centre` in a straight line, the ones the 3×3 block misses; cut at the board edge. */
function crossArms(centre: Square, board: BoardSize): Square[] {
  return STRAIGHT.map(([fileStep, rankStep]) => ({
    file: centre.file + fileStep * 2,
    rank: centre.rank + rankStep * 2,
  })).filter((square) => isOnBoard(square, board));
}

/** The 3×3 block around a square, cut at the board edge. */
export function blockAround(centre: Square, board: BoardSize): Square[] {
  const squares: Square[] = [];
  for (let rankStep = -1; rankStep <= 1; rankStep++) {
    for (let fileStep = -1; fileStep <= 1; fileStep++) {
      const square = {
        file: centre.file + fileStep,
        rank: centre.rank + rankStep,
      };
      if (isOnBoard(square, board)) squares.push(square);
    }
  }
  return squares;
}
