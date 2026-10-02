import { pieceMoves } from "../board/moves";
import { centreOf, type Point } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { BLACK_PIECES } from "../catalog/pieces";
import type { BlackMove } from "./battle-state";
import {
  actEveryOf,
  attackOf,
  movePatternOf,
  typeStatsOf,
} from "./black-type-rules";
import { isAmong, squaresHeldByBlack } from "./black-squares";
import { hitSquares } from "./pawn-hits";
import { drawsBlackWithin } from "./skill-effects";
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
    piece.actLeft = actEveryOf(piece);
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
  if (movePatternOf(piece).hits !== "path") {
    context.events.push({ type: "stomp", id: piece.id, at: centreOf(move.to) });
  }
  hitSquares(context, pawns, move.hitSquares, attackOf(piece));
}

/** The legal move that lands closest to the piece's target, as a warning about to start. */
function chooseMove(
  context: StepContext,
  piece: WorkingBlackPiece,
): BlackMove | undefined {
  const target = chooseTarget(
    context,
    centreOf(piece.square),
    typeStatsOf(piece)?.huntsSpecialPawns === true,
  );
  if (target === undefined) return undefined;

  const held = squaresHeldByBlack(context.blackPieces, context.landings, piece);
  const moves = pieceMoves(
    piece.square,
    movePatternOf(piece),
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
 * The pawn a black piece goes for: the nearest pawn that draws black pieces
 * (a shield) if one is close enough; a hunter next goes for the nearest
 * special (not plain) pawn; otherwise the nearest pawn.
 */
function chooseTarget(
  context: StepContext,
  from: Point,
  hunts: boolean,
): WorkingPawn | undefined {
  let nearest: WorkingPawn | undefined;
  let nearestDistance = Infinity;
  let nearestSpecial: WorkingPawn | undefined;
  let nearestSpecialDistance = Infinity;
  let drawingPawn: WorkingPawn | undefined;
  let drawingPawnDistance = Infinity;
  for (const pawn of context.pawns) {
    if (!isAlive(pawn)) continue;
    const pawnDistance = Math.hypot(pawn.x - from.x, pawn.y - from.y);
    if (pawnDistance < nearestDistance) {
      nearest = pawn;
      nearestDistance = pawnDistance;
    }
    if (
      hunts &&
      pawn.type !== "plain" &&
      pawnDistance < nearestSpecialDistance
    ) {
      nearestSpecial = pawn;
      nearestSpecialDistance = pawnDistance;
    }
    const drawsWithin = drawsBlackWithin(context, pawn.type);
    if (
      drawsWithin !== undefined &&
      pawnDistance <= drawsWithin &&
      pawnDistance < drawingPawnDistance
    ) {
      drawingPawn = pawn;
      drawingPawnDistance = pawnDistance;
    }
  }
  return drawingPawn ?? nearestSpecial ?? nearest;
}
