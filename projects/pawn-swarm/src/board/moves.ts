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

/** Every L-jump that stays on the board and doesn't land on a friend. Blockers in between don't matter. */
export function knightMoves(
  from: Square,
  side: Side,
  board: BoardView,
): Move[] {
  const moves: Move[] = [];
  for (const to of knightJumpsFrom(from, board.size)) {
    const occupant = board.occupantAt(to);
    if (occupant !== side) {
      moves.push({ to, isCapture: occupant !== undefined });
    }
  }
  return moves;
}

/**
 * Fewest knight jumps from a square to the nearest target, on an empty board.
 * Knights jump over pieces, so the empty-board count is the real distance.
 * Returns a lookup so one search serves every candidate move.
 */
export function knightStepsTo(
  targets: readonly Square[],
  size: number,
): (square: Square) => number {
  const steps = new Array<number>(size * size).fill(Infinity);
  const indexOf = (square: Square): number => square.rank * size + square.file;
  const queue: Square[] = [];
  for (const target of targets) {
    if (steps[indexOf(target)] !== 0) {
      steps[indexOf(target)] = 0;
      queue.push(target);
    }
  }
  // Jumps are symmetric, so searching outward from the targets gives the distance to them.
  // The loop visits squares pushed onto the queue while it runs.
  for (const square of queue) {
    const nextStep = (steps[indexOf(square)] ?? Infinity) + 1;
    for (const to of knightJumpsFrom(square, size)) {
      if ((steps[indexOf(to)] ?? Infinity) > nextStep) {
        steps[indexOf(to)] = nextStep;
        queue.push(to);
      }
    }
  }
  return (square) => steps[indexOf(square)] ?? Infinity;
}

function knightJumpsFrom(from: Square, size: number): Square[] {
  return KNIGHT_JUMPS.map(([fileStep, rankStep]) => ({
    file: from.file + fileStep,
    rank: from.rank + rankStep,
  })).filter((to) => isOnBoard(to, size));
}
