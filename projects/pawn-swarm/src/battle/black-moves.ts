import { pieceMoves } from "../board/moves";
import { centreOf, type Point } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { BLACK_PIECES } from "../catalog/pieces";
import type { BlackMove } from "./battle-state";
import { isAmong, squaresHeldByBlack } from "./black-squares";
import { hitSquares } from "./pawn-hits";
import type { SpatialGrid } from "./spatial-grid";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  type WorkingBlackPiece,
  type WorkingPawn,
} from "./step-context";

/** A small random nudge to each candidate move's score, so equally good moves aren't always picked in the same order. */
const MOVE_SCORE_NOISE = 0.1875;

/**
 * Carries on with a piece's move: when its act timer runs out, pick a target
 * and a move and warn on the squares it will hit; then move; then hit every pawn on them.
 */
export function advanceMove(
  context: StepContext,
  pawns: SpatialGrid<WorkingPawn>,
  piece: WorkingBlackPiece,
): void {
  const stats = BLACK_PIECES[piece.kind];
  const move = piece.move;
  if (move === undefined) {
    piece.actLeft -= context.seconds;
    if (!hasRunOut(piece.actLeft)) return;
    piece.actLeft = stats.actEvery;
    piece.move = chooseMove(context, piece);
    return;
  }

  const secondsLeft = move.secondsLeft - context.seconds;
  if (!hasRunOut(secondsLeft)) {
    piece.move = { ...move, secondsLeft };
    return;
  }
  if (move.phase === "warning") {
    piece.move = {
      ...move,
      phase: "moving",
      secondsLeft: stats.moveSeconds,
      phaseSeconds: stats.moveSeconds,
    };
    return;
  }
  piece.square = move.to;
  piece.move = undefined;
  if (stats.move.hits === "landing-block") {
    context.events.push({ type: "stomp", id: piece.id, at: centreOf(move.to) });
  }
  hitSquares(context, pawns, move.hitSquares, stats.attack);
}

/** The legal move that lands closest to the piece's target, as a warning about to start. */
function chooseMove(
  context: StepContext,
  piece: WorkingBlackPiece,
): BlackMove | undefined {
  const target = chooseTarget(context.pawns, centreOf(piece.square));
  if (target === undefined) return undefined;

  const held = squaresHeldByBlack(context.blackPieces, context.landings, piece);
  const moves = pieceMoves(
    piece.square,
    BLACK_PIECES[piece.kind].move,
    context.board,
    (square) => isAmong(held, square),
  );
  let best: (typeof moves)[number] | undefined;
  let bestScore = Infinity;
  for (const move of moves) {
    const landing = centreOf(move.to);
    const score =
      Math.hypot(target.x - landing.x, target.y - landing.y) +
      context.random.next() * MOVE_SCORE_NOISE;
    if (score < bestScore) {
      best = move;
      bestScore = score;
    }
  }
  if (best === undefined) return undefined;

  return {
    phase: "warning",
    to: best.to,
    hitSquares: best.hitSquares,
    secondsLeft: BATTLE_RULES.moveWarningSeconds,
    phaseSeconds: BATTLE_RULES.moveWarningSeconds,
  };
}

/**
 * The pawn a black piece goes for: the nearest one. Shield pawns arrive in
 * ticket 06 and will be picked first when one is within reach.
 */
function chooseTarget(
  pawns: readonly WorkingPawn[],
  from: Point,
): WorkingPawn | undefined {
  let nearest: WorkingPawn | undefined;
  let nearestDistance = Infinity;
  for (const pawn of pawns) {
    if (!isAlive(pawn)) continue;
    const pawnDistance = Math.hypot(pawn.x - from.x, pawn.y - from.y);
    if (pawnDistance < nearestDistance) {
      nearest = pawn;
      nearestDistance = pawnDistance;
    }
  }
  return nearest;
}
