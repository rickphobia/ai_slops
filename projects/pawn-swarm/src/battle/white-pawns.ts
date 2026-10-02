import { boardCentre, type Point } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { BLACK_PIECES, PAWN_TYPES } from "../catalog/pieces";
import { blackPiecePosition } from "./piece-position";
import { strikeDamage, walkingSpeed } from "./skill-effects";
import { buildSpatialGrid } from "./spatial-grid";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  type WorkingBlackPiece,
  type WorkingPawn,
} from "./step-context";
import { strike } from "./strike";

/**
 * Every pawn alive at the start of the step drifts with its drop burst, then
 * walks toward the nearest black piece (where it is now, even mid-move) and
 * strikes it once in range and off cooldown.
 * Pawns dropped during this phase start acting next step.
 */
export function actPawns(context: StepContext): void {
  const actingCount = context.pawns.length;
  for (let index = 0; index < actingCount; index++) {
    const pawn = context.pawns[index];
    if (pawn === undefined || !isAlive(pawn)) continue;
    drift(pawn, context.seconds);
    actPawn(context, pawn);
  }
}

function actPawn(context: StepContext, pawn: WorkingPawn): void {
  const stats = PAWN_TYPES[pawn.type];
  pawn.strikeCooldownLeft -= context.seconds;

  const target = nearestBlackPiece(context.blackPieces, pawn);
  if (target === undefined) {
    walkStraight(
      pawn,
      boardCentre(context.board),
      stats.speed * BATTLE_RULES.idleSpeedFactor * context.seconds,
      BATTLE_RULES.idleStopDistance,
    );
    return;
  }

  const targetCentre = blackPiecePosition(target);
  const reach = stats.range + BLACK_PIECES[target.kind].bodyRadius;
  if (distance(pawn, targetCentre) > reach) {
    walkStraight(
      pawn,
      targetCentre,
      walkingSpeed(context, pawn) * context.seconds,
      0,
    );
    return;
  }
  if (!hasRunOut(pawn.strikeCooldownLeft)) return;

  pawn.strikeCooldownLeft = stats.strikeCooldown;
  // Only types that strike several pieces look for more, so a big plain swarm stays cheap.
  const others =
    stats.strikesAtOnce > 1
      ? blackPiecesInReach(context.blackPieces, pawn, stats.range)
          .filter((piece) => piece !== target)
          .slice(0, stats.strikesAtOnce - 1)
      : [];
  const damage = strikeDamage(context, pawn);
  for (const piece of [target, ...others]) {
    strike(context, pawn, piece, damage);
  }
}

/** Living black pieces a pawn with this range can strike from where it stands, nearest first. */
function blackPiecesInReach(
  pieces: readonly WorkingBlackPiece[],
  from: Point,
  range: number,
): WorkingBlackPiece[] {
  return pieces
    .filter(isAlive)
    .map((piece) => ({
      piece,
      distance: distance(from, blackPiecePosition(piece)),
    }))
    .filter(
      ({ piece, distance: pieceDistance }) =>
        pieceDistance <= range + BLACK_PIECES[piece.kind].bodyRadius,
    )
    .sort((a, b) => a.distance - b.distance)
    .map(({ piece }) => piece);
}

/** Pawns push each other apart so the swarm spreads out, then stay inside the board edge. */
export function separatePawns(context: StepContext): void {
  const {
    separationRadius,
    separationStrength,
    separationMaxNeighbours,
    edgeMargin,
  } = BATTLE_RULES;
  const living = context.pawns.filter(isAlive);
  const grid = buildSpatialGrid(living, 1);
  for (const pawn of living) {
    let neighbours = 0;
    grid.forEachNear(pawn, separationRadius, (other) => {
      if (other === pawn || neighbours >= separationMaxNeighbours) return;
      neighbours += 1;
      // Two pawns on the exact same spot (a fresh drop) get pushed a random way.
      const dx = pawn.x - other.x || context.random.next() - 0.5;
      const dy = pawn.y - other.y || context.random.next() - 0.5;
      const gap = Math.hypot(dx, dy) || 1;
      const push = (separationRadius - gap) * separationStrength;
      pawn.x += (dx / gap) * push;
      pawn.y += (dy / gap) * push;
    });
    pawn.x = clamp(pawn.x, edgeMargin, context.board.files - edgeMargin);
    pawn.y = clamp(pawn.y, edgeMargin, context.board.ranks - edgeMargin);
  }
}

/**
 * Walks like a rook: along one axis only, never diagonally. The pawn keeps its
 * axis until the other one is clearly longer (`axisSwitchRatio`) or it has
 * lined up on this one, so it doesn't zig-zag every step.
 */
function walkStraight(
  pawn: WorkingPawn,
  target: Point,
  distanceThisStep: number,
  stopWithin: number,
): void {
  const { axisSwitchRatio, axisLinedUp } = BATTLE_RULES;
  const dx = target.x - pawn.x;
  const dy = target.y - pawn.y;
  const alongX = Math.abs(dx);
  const alongY = Math.abs(dy);
  if (alongX + alongY <= stopWithin) return;

  const shouldSwitch =
    pawn.axis === "x"
      ? alongY > alongX * axisSwitchRatio || alongX < axisLinedUp
      : alongX > alongY * axisSwitchRatio || alongY < axisLinedUp;
  if (shouldSwitch) pawn.axis = pawn.axis === "x" ? "y" : "x";

  if (pawn.axis === "x") {
    pawn.x += Math.sign(dx) * Math.min(distanceThisStep, alongX);
  } else {
    pawn.y += Math.sign(dy) * Math.min(distanceThisStep, alongY);
  }
}

/** A dropped pawn flies outward and slows down fast. */
function drift(pawn: WorkingPawn, seconds: number): void {
  if (pawn.burstX === 0 && pawn.burstY === 0) return;
  const { keptPerSecond, stopSpeed } = BATTLE_RULES.dropBurst;
  pawn.x += pawn.burstX * seconds;
  pawn.y += pawn.burstY * seconds;
  const kept = Math.pow(keptPerSecond, seconds);
  pawn.burstX *= kept;
  pawn.burstY *= kept;
  if (Math.abs(pawn.burstX) + Math.abs(pawn.burstY) < stopSpeed) {
    pawn.burstX = 0;
    pawn.burstY = 0;
  }
}

function nearestBlackPiece(
  pieces: readonly WorkingBlackPiece[],
  from: Point,
): WorkingBlackPiece | undefined {
  let nearest: WorkingBlackPiece | undefined;
  let nearestDistance = Infinity;
  for (const piece of pieces) {
    if (!isAlive(piece)) continue;
    const pieceDistance = distance(from, blackPiecePosition(piece));
    if (pieceDistance < nearestDistance) {
      nearest = piece;
      nearestDistance = pieceDistance;
    }
  }
  return nearest;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
