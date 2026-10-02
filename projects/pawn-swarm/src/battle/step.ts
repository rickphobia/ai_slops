import {
  type BoardView,
  knightMoves,
  knightStepsTo,
  type Move,
  pawnMoves,
} from "../board/moves";
import { isSameSquare, type Square } from "../board/square";
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
  switch (piece.kind) {
    case "pawn":
      return choosePawnMove(piece, board, rng);
    case "knight":
      return chooseKnightMove(piece, livingPieces, board, rng);
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

/** The legal jump that leaves the fewest jumps to the nearest white pawn; a capture counts as 0. */
function chooseKnightMove(
  piece: Piece,
  livingPieces: readonly Piece[],
  board: BoardView,
  rng: RngState,
): MoveChoice {
  const targets: Square[] = livingPieces
    .filter((other) => other.side !== piece.side)
    .map((other) => other.square);
  const moves = knightMoves(piece.square, piece.side, board);
  if (targets.length === 0 || moves.length === 0)
    return { move: undefined, rng };

  const jumpsToTarget = knightStepsTo(targets, board.size);
  const fewest = Math.min(...moves.map((move) => jumpsToTarget(move.to)));
  const best = moves.filter((move) => jumpsToTarget(move.to) === fewest);
  const pick = pickOne(rng, best);
  return { move: pick.value, rng: pick.state };
}

function outcomeOf(pieces: readonly Piece[]): BattleOutcome {
  if (!pieces.some((piece) => piece.side === "black")) return "won";
  if (!pieces.some((piece) => piece.side === "white")) return "lost";
  return "ongoing";
}
