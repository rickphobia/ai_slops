import { isOnBoard, type Side, type Square } from "./square";

/** What move generation needs to know about the board: its size and who stands where. */
export interface BoardView {
  readonly size: number;
  occupantAt(square: Square): Side | undefined;
}

export interface Move {
  readonly to: Square;
  readonly isCapture: boolean;
}

/** One step of a piece's move, as a file and rank offset. */
type Step = readonly [fileStep: number, rankStep: number];

/**
 * How a non-pawn piece moves: it repeats one of its steps up to `range` times in a
 * straight line, stopping at the first piece in the way. With range 1 nothing can be
 * in the way, which is how a knight jumps over blockers.
 */
export interface MovePattern {
  readonly steps: readonly Step[];
  readonly range: number;
}

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

export const KNIGHT: MovePattern = {
  steps: [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
  ],
  range: 1,
};

export const KING: MovePattern = {
  steps: [...STRAIGHT, ...DIAGONAL],
  range: 1,
};

export function bishopPattern(range: number): MovePattern {
  return { steps: DIAGONAL, range };
}

export function rookPattern(range: number): MovePattern {
  return { steps: STRAIGHT, range };
}

export function queenPattern(range: number): MovePattern {
  return { steps: [...STRAIGHT, ...DIAGONAL], range };
}

/**
 * One square forward if it is empty; one square diagonally forward if an enemy is there.
 * `forward` is +1 to move up the board and -1 to move down.
 */
export function pawnMoves(
  from: Square,
  side: Side,
  forward: 1 | -1,
  board: BoardView,
): Move[] {
  const moves: Move[] = [];
  const ahead = { file: from.file, rank: from.rank + forward };
  if (isOnBoard(ahead, board.size) && board.occupantAt(ahead) === undefined) {
    moves.push({ to: ahead, isCapture: false });
  }
  for (const fileStep of [-1, 1]) {
    const diagonal = { file: from.file + fileStep, rank: from.rank + forward };
    const occupant = isOnBoard(diagonal, board.size)
      ? board.occupantAt(diagonal)
      : undefined;
    if (occupant !== undefined && occupant !== side) {
      moves.push({ to: diagonal, isCapture: true });
    }
  }
  return moves;
}

/** Every square the pattern reaches on the board, short of a friend; an enemy in the way is a capture and ends that line. */
export function patternMoves(
  from: Square,
  side: Side,
  pattern: MovePattern,
  board: BoardView,
): Move[] {
  const moves: Move[] = [];
  for (const [fileStep, rankStep] of pattern.steps) {
    for (let distance = 1; distance <= pattern.range; distance++) {
      const to = {
        file: from.file + fileStep * distance,
        rank: from.rank + rankStep * distance,
      };
      if (!isOnBoard(to, board.size)) break;
      const occupant = board.occupantAt(to);
      if (occupant === side) break;
      moves.push({ to, isCapture: occupant !== undefined });
      if (occupant !== undefined) break;
    }
  }
  return moves;
}

/**
 * Fewest moves of the pattern from a square to the nearest target, on an empty board
 * (Infinity if no target can be reached, like a bishop and a square of the other colour).
 * Ignoring blockers keeps this one search per piece; for a knight it is exact.
 * Returns a lookup so one search serves every candidate move.
 */
export function stepsTo(
  targets: readonly Square[],
  size: number,
  pattern: MovePattern,
): (square: Square) => number {
  const steps = new Array<number>(size * size).fill(Infinity);
  const indexOf = (square: Square): number => square.rank * size + square.file;
  const emptyBoard: BoardView = { size, occupantAt: () => undefined };
  const queue: Square[] = [];
  for (const target of targets) {
    if (steps[indexOf(target)] !== 0) {
      steps[indexOf(target)] = 0;
      queue.push(target);
    }
  }
  // Every pattern is symmetric, so searching outward from the targets gives the distance to them.
  // The loop visits squares pushed onto the queue while it runs.
  for (const square of queue) {
    const nextStep = (steps[indexOf(square)] ?? Infinity) + 1;
    for (const { to } of patternMoves(square, "white", pattern, emptyBoard)) {
      if ((steps[indexOf(to)] ?? Infinity) > nextStep) {
        steps[indexOf(to)] = nextStep;
        queue.push(to);
      }
    }
  }
  return (square) => steps[indexOf(square)] ?? Infinity;
}
