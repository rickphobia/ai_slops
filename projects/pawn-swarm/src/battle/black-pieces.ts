import { knightHitSquares, knightJumps } from "../board/moves";
import {
  centreOf,
  isSameSquare,
  type Point,
  type Square,
} from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { BLACK_PIECES } from "../catalog/pieces";
import { buildSpatialGrid, type SpatialGrid } from "./spatial-grid";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  takeId,
  type WorkingBlackPiece,
  type WorkingPawn,
} from "./step-context";

/** A small random nudge to each candidate move's score, so equally good moves aren't always picked in the same order. */
const MOVE_SCORE_NOISE = 0.1875;

/** Wave pieces whose warning has run out land on their square. */
export function landPieces(context: StepContext): void {
  for (const landing of context.landings) {
    landing.secondsLeft -= context.seconds;
    if (!hasRunOut(landing.secondsLeft)) continue;
    const stats = BLACK_PIECES[landing.kind];
    const id = takeId(context);
    context.blackPieces.push({
      id,
      kind: landing.kind,
      square: landing.square,
      hp: stats.hp,
      maxHp: stats.hp,
      // Spread out first moves so a wave doesn't move in lockstep.
      actLeft: context.random.next() * stats.actEvery,
      contactLeft: 0,
      move: undefined,
    });
    context.events.push({
      type: "landed",
      id,
      kind: landing.kind,
      at: centreOf(landing.square),
    });
  }
  context.landings = context.landings.filter(
    (landing) => !hasRunOut(landing.secondsLeft),
  );
}

/**
 * Each black piece hurts the pawns touching it, then carries on with its move:
 * pick a target and a move, warn on the squares it will hit, move, and hit every pawn on them.
 */
export function actBlackPieces(context: StepContext): void {
  const pawns = buildSpatialGrid(context.pawns.filter(isAlive), 1);
  for (const piece of context.blackPieces) {
    if (!isAlive(piece)) continue;
    hurtTouchingPawns(context, pawns, piece);
    advanceMove(context, pawns, piece);
  }
}

/** Touching a black piece hurts, on the piece's own timer. A moving piece is in the air and touches nothing. */
function hurtTouchingPawns(
  context: StepContext,
  pawns: SpatialGrid<WorkingPawn>,
  piece: WorkingBlackPiece,
): void {
  if (piece.move?.phase === "moving") return;
  piece.contactLeft -= context.seconds;
  if (!hasRunOut(piece.contactLeft)) return;
  piece.contactLeft = BATTLE_RULES.contactEverySeconds;
  pawns.forEachNear(
    centreOf(piece.square),
    BLACK_PIECES[piece.kind].contactRadius,
    (pawn) => {
      hurtPawn(context, pawn, BATTLE_RULES.contactDamage, "contact");
    },
  );
}

function advanceMove(
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
    startMove(context, piece);
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
  context.events.push({ type: "stomp", id: piece.id, at: centreOf(move.to) });
  hitSquares(context, pawns, move.hitSquares, stats.attack);
}

/** Picks the L-jump that lands closest to the nearest pawn and starts its warning. */
function startMove(context: StepContext, piece: WorkingBlackPiece): void {
  const target = nearestPawn(context.pawns, centreOf(piece.square));
  if (target === undefined) return;

  const jumps = knightJumps(piece.square, context.board, (square) =>
    isTakenByAnotherBlackPiece(context, piece, square),
  );
  let best: Square | undefined;
  let bestScore = Infinity;
  for (const to of jumps) {
    const landing = centreOf(to);
    const score =
      Math.hypot(target.x - landing.x, target.y - landing.y) +
      context.random.next() * MOVE_SCORE_NOISE;
    if (score < bestScore) {
      best = to;
      bestScore = score;
    }
  }
  if (best === undefined) return;

  piece.move = {
    phase: "warning",
    to: best,
    hitSquares: knightHitSquares(best, context.board),
    secondsLeft: BATTLE_RULES.moveWarningSeconds,
    phaseSeconds: BATTLE_RULES.moveWarningSeconds,
  };
}

/** Black pieces never share a square: not one they stand on, are moving to, or are landing on. */
function isTakenByAnotherBlackPiece(
  context: StepContext,
  mover: WorkingBlackPiece,
  square: Square,
): boolean {
  return (
    context.blackPieces.some(
      (other) =>
        other !== mover &&
        isAlive(other) &&
        (isSameSquare(other.square, square) ||
          (other.move !== undefined && isSameSquare(other.move.to, square))),
    ) ||
    context.landings.some((landing) => isSameSquare(landing.square, square))
  );
}

/** Every pawn standing on at least one of the squares takes the damage once. */
function hitSquares(
  context: StepContext,
  pawns: SpatialGrid<WorkingPawn>,
  squares: readonly Square[],
  damage: number,
): void {
  const reach = BATTLE_RULES.squareHitReach;
  const isOnSquare = (pawn: Point, square: Square): boolean => {
    const centre = centreOf(square);
    return (
      Math.abs(pawn.x - centre.x) <= reach &&
      Math.abs(pawn.y - centre.y) <= reach
    );
  };
  const hit = new Set<WorkingPawn>();
  for (const square of squares) {
    pawns.forEachNear(centreOf(square), reach * Math.SQRT2, (pawn) => {
      if (isOnSquare(pawn, square)) hit.add(pawn);
    });
  }
  for (const pawn of hit) hurtPawn(context, pawn, damage, "stomp");
}

function hurtPawn(
  context: StepContext,
  pawn: WorkingPawn,
  damage: number,
  cause: "stomp" | "contact",
): void {
  if (!isAlive(pawn)) return;
  pawn.hp -= damage;
  const at = { x: pawn.x, y: pawn.y };
  context.events.push({
    type: "pawn-hurt",
    pawnId: pawn.id,
    damage,
    cause,
    at,
  });
  if (!isAlive(pawn)) {
    context.events.push({
      type: "death",
      id: pawn.id,
      piece: { side: "white", type: pawn.type },
      at,
    });
  }
}

function nearestPawn(
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
