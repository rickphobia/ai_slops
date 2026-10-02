import type { Point } from "../board/square";
import { PAWN_TYPES, type PawnTypeId } from "../catalog/pieces";
import type { Random } from "../rng";
import type { WorkingPawn } from "./step-context";

/** A fresh pawn at full HP. Its first strike is a random part of a cooldown away, so a swarm doesn't strike in lockstep. */
export function newPawn(
  id: number,
  type: PawnTypeId,
  at: Point,
  random: Random,
): WorkingPawn {
  const stats = PAWN_TYPES[type];
  return {
    id,
    type,
    x: at.x,
    y: at.y,
    hp: stats.hp,
    maxHp: stats.hp,
    strikeCooldownLeft: random.next() * stats.strikeCooldown,
    axis: "y",
    burstX: 0,
    burstY: 0,
  };
}
