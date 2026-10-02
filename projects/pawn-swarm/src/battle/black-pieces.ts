import { centreOf } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import type { BlackTypeId } from "../catalog/black-types";
import { BLACK_TYPE_RULES } from "../catalog/black-types";
import { BLACK_PIECES, type BlackKind } from "../catalog/pieces";
import { advanceMove } from "./black-moves";
import { actEveryOf, hpFactorOf, summonsOf } from "./black-type-rules";
import { useBlackPower } from "./black-powers";
import { planSummonLandings } from "./landing-squares";
import { hurtPawn } from "./pawn-hits";
import { isRunning } from "./power-ups";
import { buildSpatialGrid, type SpatialGrid } from "./spatial-grid";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  takeId,
  type WorkingBlackPiece,
  type WorkingPawn,
} from "./step-context";

/**
 * A black piece's HP in a wave: its wave-1 HP plus a share of it per wave
 * after, times its type's factor (a tower's 3), rounded up.
 */
export function blackHp(
  kind: BlackKind,
  wave: number,
  type?: BlackTypeId,
): number {
  const hp =
    BLACK_PIECES[kind].hp *
    (1 + BATTLE_RULES.blackHpGrowthPerWave * (wave - 1)) *
    hpFactorOf(type);
  // 220 × 4.15 comes out a hair above 913; don't let that round up to 914.
  return Math.ceil(hp - 1e-9);
}

/** Pieces whose landing warning has run out land on their square. */
export function landPieces(context: StepContext): void {
  for (const landing of context.landings) {
    landing.secondsLeft -= context.seconds;
    if (!hasRunOut(landing.secondsLeft)) continue;
    const piece = { kind: landing.kind, type: landing.type };
    const hp = blackHp(landing.kind, context.wave, landing.type);
    const id = takeId(context);
    context.blackPieces.push({
      id,
      ...piece,
      square: landing.square,
      hp,
      maxHp: hp,
      // Spread out first moves so a push doesn't move in lockstep.
      actLeft: context.random.next() * actEveryOf(piece),
      contactLeft: 0,
      summonLeft: summonsOf(piece)?.everySeconds ?? 0,
      // The same spread for a special type's first power.
      powerLeft:
        landing.type === undefined
          ? 0
          : BLACK_TYPE_RULES.firstPowerMinSeconds +
            context.random.next() * BLACK_TYPE_RULES.firstPowerSpreadSeconds,
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
 * summoner, uses its type's power, then carries on with its move. A Freeze
 * power-up stops all of it.
 */
export function actBlackPieces(context: StepContext): void {
  if (isRunning(context, "freeze")) return;
  const pawns = buildSpatialGrid(context.pawns.filter(isAlive), 1);
  for (const piece of context.blackPieces) {
    if (!isAlive(piece)) continue;
    hurtTouchingPawns(context, pawns, piece);
    summonKnights(context, piece);
    useBlackPower(context, pawns, piece);
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

/** A summoner (the king, a Summoner queen) calls knights onto free squares next to it, with a landing warning. */
function summonKnights(context: StepContext, piece: WorkingBlackPiece): void {
  const summons = summonsOf(piece);
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
