import { centreOf } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { BLACK_PIECES, type BlackKind } from "../catalog/pieces";
import { advanceMove } from "./black-moves";
import { planSummonLandings } from "./landing-squares";
import { hurtPawn } from "./pawn-hits";
import { buildSpatialGrid, type SpatialGrid } from "./spatial-grid";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  takeId,
  type WorkingBlackPiece,
  type WorkingPawn,
} from "./step-context";

/** A black piece's HP in a wave: its wave-1 HP plus a share of it per wave after, rounded up. */
export function blackHp(kind: BlackKind, wave: number): number {
  const hp =
    BLACK_PIECES[kind].hp *
    (1 + BATTLE_RULES.blackHpGrowthPerWave * (wave - 1));
  // 220 × 4.15 comes out a hair above 913; don't let that round up to 914.
  return Math.ceil(hp - 1e-9);
}

/** Pieces whose landing warning has run out land on their square. */
export function landPieces(context: StepContext): void {
  for (const landing of context.landings) {
    landing.secondsLeft -= context.seconds;
    if (!hasRunOut(landing.secondsLeft)) continue;
    const stats = BLACK_PIECES[landing.kind];
    const hp = blackHp(landing.kind, context.wave);
    const id = takeId(context);
    context.blackPieces.push({
      id,
      kind: landing.kind,
      square: landing.square,
      hp,
      maxHp: hp,
      // Spread out first moves so a push doesn't move in lockstep.
      actLeft: context.random.next() * stats.actEvery,
      contactLeft: 0,
      summonLeft: stats.summons?.everySeconds ?? 0,
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
 * Each black piece hurts the pawns touching it, calls knights if it is a
 * summoner, then carries on with its move.
 */
export function actBlackPieces(context: StepContext): void {
  const pawns = buildSpatialGrid(context.pawns.filter(isAlive), 1);
  for (const piece of context.blackPieces) {
    if (!isAlive(piece)) continue;
    hurtTouchingPawns(context, pawns, piece);
    summonKnights(context, piece);
    advanceMove(context, pawns, piece);
  }
}

/**
 * Touching a black piece hurts, on the piece's own timer. A moving piece is in
 * the air and touches nothing: a hurt that comes due mid-move waits for the landing.
 */
function hurtTouchingPawns(
  context: StepContext,
  pawns: SpatialGrid<WorkingPawn>,
  piece: WorkingBlackPiece,
): void {
  piece.contactLeft -= context.seconds;
  if (!hasRunOut(piece.contactLeft) || piece.move?.phase === "moving") return;
  piece.contactLeft = BATTLE_RULES.contactEverySeconds;
  pawns.forEachNear(
    centreOf(piece.square),
    BLACK_PIECES[piece.kind].contactRadius,
    (pawn) => {
      hurtPawn(context, pawn, BATTLE_RULES.contactDamage, "contact");
    },
  );
}

/** A summoner (the king) calls knights onto free squares next to it, with a landing warning. */
function summonKnights(context: StepContext, piece: WorkingBlackPiece): void {
  const summons = BLACK_PIECES[piece.kind].summons;
  if (summons === undefined) return;
  piece.summonLeft -= context.seconds;
  if (!hasRunOut(piece.summonLeft)) return;
  piece.summonLeft = summons.everySeconds;

  const landings = planSummonLandings(
    piece.square,
    summons.knights,
    context,
    context.random,
  );
  if (landings.length === 0) return;
  context.landings.push(...landings);
  context.events.push({
    type: "summon",
    id: piece.id,
    count: landings.length,
    at: centreOf(piece.square),
  });
}
