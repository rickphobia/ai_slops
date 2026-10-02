import {
  bishopPattern,
  type BoardView,
  KING,
  KNIGHT,
  type Move,
  type MovePattern,
  pawnMoves,
  patternMoves,
  queenPattern,
  rookPattern,
  stepsTo,
} from "../board/moves";
import { isSameSquare, type Square } from "../board/square";
import { ENEMY_TYPES, type EnemyKind } from "../catalog/pieces";
import { pickOne, type RngState } from "../rng";
import type {
  BattleEvent,
  BattleOutcome,
  BattleState,
  Piece,
} from "./battle-state";

/**
 * Advances the battle by one tick. Pure: returns a new state and leaves `state` alone.
 * Each living piece, in id order, counts down its cooldown and acts when it reaches 0.
 * A piece with no legal move waits at 0 and tries again next tick.
 */
export function step(state: BattleState): BattleState {
  if (state.outcome !== "ongoing") return state;

  const pieces: WorkingPiece[] = state.pieces.map((piece) => ({ ...piece }));
  const events: BattleEvent[] = [];
  let rng = state.rng;
  const isAlive = (piece: Piece): boolean => piece.hp > 0;
  const livingPieceAt = (square: Square): WorkingPiece | undefined =>
    pieces.find(
      (piece) => isAlive(piece) && isSameSquare(piece.square, square),
    );
  const board: BoardView = {
    size: state.boardSize,
    occupantAt: (square) => livingPieceAt(square)?.side,
  };

  for (const piece of pieces) {
    if (!isAlive(piece)) continue;
    piece.cooldownLeft = Math.max(0, piece.cooldownLeft - 1);
    if (piece.cooldownLeft > 0) continue;

    const choice = chooseMove(piece, pieces.filter(isAlive), board, rng);
    rng = choice.rng;
    if (choice.move === undefined) continue;

    piece.cooldownLeft = piece.cooldownTicks;
    if (!choice.move.isCapture) {
      piece.square = choice.move.to;
      continue;
    }
    const target = livingPieceAt(choice.move.to);
    if (target !== undefined) events.push(...resolveCapture(piece, target));
  }

  const survivors = pieces.filter(isAlive);
  return {
    tick: state.tick + 1,
    boardSize: state.boardSize,
    pieces: survivors,
    rng,
    outcome: outcomeOf(survivors),
    events,
  };
}

/** A copy of a piece that this tick may change. */
type WorkingPiece = { -readonly [Key in keyof Piece]: Piece[Key] };

/** A capture is an attack: the target loses HP and the attacker stays where it is. */
function resolveCapture(attacker: Piece, target: WorkingPiece): BattleEvent[] {
  target.hp = Math.max(0, target.hp - attacker.attack);
  const events: BattleEvent[] = [
    {
      type: "hit",
      attackerId: attacker.id,
      targetId: target.id,
      damage: attacker.attack,
    },
  ];
  if (target.hp === 0) {
    events.push({ type: "death", pieceId: target.id, square: target.square });
  }
  return events;
}

interface MoveChoice {
  move: Move | undefined;
  rng: RngState;
}

function chooseMove(
  piece: Piece,
  livingPieces: readonly Piece[],
  board: BoardView,
  rng: RngState,
): MoveChoice {
  if (piece.kind === "pawn") return choosePawnMove(piece, board, rng);
  return chooseEnemyMove(
    piece,
    patternOf(piece.kind),
    livingPieces,
    board,
    rng,
  );
}

function patternOf(kind: EnemyKind): MovePattern {
  const { range } = ENEMY_TYPES[kind];
  switch (kind) {
    case "knight":
      return KNIGHT;
    case "bishop":
      return bishopPattern(range);
    case "rook":
      return rookPattern(range);
    case "queen":
      return queenPattern(range);
    case "king":
      return KING;
  }
}

/** Capture if possible (a random target if there are two), otherwise step forward. */
function choosePawnMove(
  piece: Piece,
  board: BoardView,
  rng: RngState,
): MoveChoice {
  const moves = pawnMoves(piece.square, piece.side, 1, board);
  const captures = moves.filter((move) => move.isCapture);
  if (captures.length > 0) {
    const pick = pickOne(rng, captures);
    return { move: pick.value, rng: pick.state };
  }
  return { move: moves[0], rng };
}

/**
 * The legal move that leaves the fewest moves to the nearest white pawn; a capture counts as 0.
 * If no move can ever reach a pawn (a bishop on the other colour), the one that ends
 * nearest in king steps.
 */
function chooseEnemyMove(
  piece: Piece,
  pattern: MovePattern,
  livingPieces: readonly Piece[],
  board: BoardView,
  rng: RngState,
): MoveChoice {
  const targets: Square[] = livingPieces
    .filter((other) => other.side !== piece.side)
    .map((other) => other.square);
  const moves = patternMoves(piece.square, piece.side, pattern, board);
  if (targets.length === 0 || moves.length === 0)
    return { move: undefined, rng };

  const movesToTarget = stepsTo(targets, board.size, pattern);
  let score = (move: Move): number => movesToTarget(move.to);
  if (moves.every((move) => score(move) === Infinity)) {
    score = (move) => Math.min(...targets.map((t) => kingSteps(move.to, t)));
  }
  const fewest = Math.min(...moves.map(score));
  const best = moves.filter((move) => score(move) === fewest);
  const pick = pickOne(rng, best);
  return { move: pick.value, rng: pick.state };
}

function kingSteps(a: Square, b: Square): number {
  return Math.max(Math.abs(a.file - b.file), Math.abs(a.rank - b.rank));
}

function outcomeOf(pieces: readonly Piece[]): BattleOutcome {
  if (!pieces.some((piece) => piece.side === "black")) return "won";
  if (!pieces.some((piece) => piece.side === "white")) return "lost";
  return "ongoing";
}
