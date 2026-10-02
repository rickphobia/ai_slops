import type { Point } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { BLACK_PIECES } from "../catalog/pieces";
import { newPawn } from "./new-pawn";
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
    piece: { side: "black", kind: piece.kind },
    at,
  });
  if (BLACK_PIECES[piece.kind].isKing === true) context.kingDown = true;
  const swarm = context.pawns.filter(isAlive).length;
  const count = dropCount(
    BLACK_PIECES[piece.kind].drop,
    swarm,
    context.random.next(),
  );
  if (count === 0) return;

  const { minSpeed, extraSpeed } = BATTLE_RULES.dropBurst;
  for (let index = 0; index < count; index++) {
    const pawn = newPawn(takeId(context), "plain", at, context.random);
    const angle = context.random.next() * Math.PI * 2;
    const speed = minSpeed + context.random.next() * extraSpeed;
    pawn.burstX = Math.cos(angle) * speed;
    pawn.burstY = Math.sin(angle) * speed;
    context.pawns.push(pawn);
  }
  context.events.push({ type: "drop", count, at });
}
