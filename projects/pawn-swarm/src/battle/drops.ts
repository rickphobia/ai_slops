import type { Point } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { POWER_UP_RULES } from "../catalog/power-ups";
import { BLACK_PIECES } from "../catalog/pieces";
import { baseDropOf } from "./black-type-rules";
import { newPawn } from "./new-pawn";
import { maybeDropOrb } from "./orb-drops";
import { isRunning } from "./power-ups";
import {
  isAlive,
  type StepContext,
  takeId,
  type WorkingBlackPiece,
} from "./step-context";

/**
 * How many plain pawns a kill drops. Crowding shrinks the drop as the swarm
 * grows: `base × max(floor, 1 − swarm / swarmSize)`. The fraction left over is
 * a chance of one more pawn, decided by `roll` (a number in [0, 1)).
 */
export function dropCount(base: number, swarm: number, roll: number): number {
  const { swarmSize, floor } = BATTLE_RULES.crowding;
  const expected = base * Math.max(floor, 1 - swarm / swarmSize);
  const whole = Math.floor(expected);
  return whole + (roll < expected - whole ? 1 : 0);
}

/** A black piece dies: it drops plain pawns on its square that burst outward and join the fight. */
export function killBlackPiece(
  context: StepContext,
  piece: WorkingBlackPiece,
  at: Point,
): void {
  context.events.push({
    type: "death",
    id: piece.id,
    piece: {
      side: "black",
      kind: piece.kind,
      ...(piece.type === undefined ? {} : { type: piece.type }),
    },
    at,
  });
  if (BLACK_PIECES[piece.kind].isKing === true) context.kingDown = true;
  maybeDropOrb(context, piece, at);
  const swarm = context.pawns.filter(isAlive).length;
  // Bounty doubles the drop before crowding shrinks it and the fraction is rounded.
  const bounty = isRunning(context, "bounty")
    ? POWER_UP_RULES.bountyDropFactor
    : 1;
  const count = dropCount(
    baseDropOf(piece) * bounty,
    swarm,
    context.random.next(),
  );
  if (count === 0) return;

  spawnPlainPawns(context, at, count);
  context.events.push({ type: "drop", count, at });
}

/** `count` plain pawns appear on `at`, burst outward and join the fight next step. */
export function spawnPlainPawns(
  context: StepContext,
  at: Point,
  count: number,
): void {
  const { minSpeed, extraSpeed } = BATTLE_RULES.dropBurst;
  for (let index = 0; index < count; index++) {
    const pawn = newPawn(takeId(context), "plain", at, context.random);
    const angle = context.random.next() * Math.PI * 2;
    const speed = minSpeed + context.random.next() * extraSpeed;
    pawn.burstX = Math.cos(angle) * speed;
    pawn.burstY = Math.sin(angle) * speed;
    context.pawns.push(pawn);
  }
}
